# Bản đồ yêu cầu → nơi đáp ứng → **cách tự kiểm**

- **Sinh viên:** Lê Nhựt Duy — **MSSV:** 23127178 · **Bài:** HW06-AI API Testing

Ba cột, và **cột thứ ba là cột quan trọng nhất**. Cột 2 chỉ là một lời khẳng định; người chấm không
có cách nào phân biệt "việc này đã làm" với "việc này được viết là đã làm" nếu chỉ đọc tài liệu.

**Chạy hết một lượt:**

```bash
bash tools/verify-all.sh      # hoặc: npm run verify
```

Trạng thái hiện tại: **8 PASS · 27 FAIL** — đúng như mong đợi khi vừa dựng khung. Danh sách FAIL
chính là danh sách việc còn phải làm.

---

## §5 — Chọn API

| Yêu cầu của đề | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| 3 API, mỗi pool A/B/C một API | [docs/api-selection.md](docs/api-selection.md) §2 · [README §1](README.md) | `grep -c '^| \*\*API-0' docs/api-selection.md` |
| Không trùng bộ 3 với thành viên nhóm | [docs/api-selection.md](docs/api-selection.md) §1 (bảng 4 bộ đã bị lấy) | **không tự động kiểm được** — đối chiếu ảnh chat nhóm |
| Endpoint đứng sau mỗi feature lấy từ spec | [docs/api-selection.md](docs/api-selection.md) §3, có số dòng `server.js` | `sed -n '141,157p;290,295p;179,189p' ../eshop-sut/backend/server.js` |

## §6.1 — Generate with AI (≥35 case/API)

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| Dẫn AI **từng bước**, không một prompt gộp | [.claude/skills/api-test-design](.claude/skills/api-test-design/SKILL.md) 5 bước · mỗi bước một mục trong [ai-audit](ai-audit/ai-audit-report.md) | `grep -c '^### Interaction' ai-audit/ai-audit-report.md` |
| ≥35 test case mỗi API | `test-cases/api-0X-*/generated.md` | `verify-all.sh` mục 2 — đếm dòng `TC-` của cả 3 file |
| Domain partition trên **mọi** tham số | mục `10-domain-*` của collection + bảng test case | `verify-all.sh` mục 2 · đọc ma trận phủ trong `main-report` |
| State transition | mục `20-state-*` | đọc §3.2/§4.2/§5.2 của `report/main-report.md` |
| Security SEC-01…SEC-07 | mục `30-security-*` | `grep -c 'SEC-0' test-cases/*/*.md` |
| Schema validation | mục `40-schema-*`, dùng `pm.response.to.have.jsonSchema` | `grep -c jsonSchema postman/collections/*.json` |

## §6.2 — Audit (human review)

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| Dán nhãn VALID / INVALID / INCOMPLETE + lý do | `test-cases/api-0X-*/audit.md` | `verify-all.sh` mục 3 — mọi dòng `TC-` phải có nhãn |
| Sửa case invalid/incomplete | cùng file, cột `Audit` ghi sửa gì | so `generated.md` với `audit.md` |

## §6.3 — Extend (≥5 case AI bỏ sót)

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| ≥5 case tự thêm mỗi API | `test-cases/api-0X-*/extended.md` | `verify-all.sh` mục 2 |
| Giải thích **vì sao** AI bỏ sót, đúng 3 nhóm | bảng cuối `extended.md` | `grep -cE 'prompt\|model\|đặc điểm' test-cases/*/extended.md` |

## §6.4 — Execute (Postman + Newman)

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| Chạy bằng Postman + Newman | `postman/collections/*.json` · `tools/run-newman.sh` | `npm run test:all` |
| **Mọi** request mang `X-Student-Id` | [postman/prerequest-collection.js](postman/prerequest-collection.js) ở cấp collection | `verify-all.sh` mục 1 — đọc `event.prerequest` của từng collection |
| Ảnh console chứng minh header (§11) | `bug-report/screenshots/console-x-student-id.png` | **kiểm tay** — mở ảnh, phải thấy dòng `[HW06] X-Student-Id = 23127178` |
| Newman / HTML report | `reports/newman/*.html` + `*.json` | `ls reports/newman/` |
| Hostname là localhost/127.0.0.1 (§11) | trong output Newman | **kiểm tay** trong HTML report |

## §6.5 — Report bugs

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| Bug trong báo cáo Markdown | [bug-report/bug-report.md](bug-report/bug-report.md) | `bash bug-report/verify-bugs.sh` — tái hiện bằng request thật |
| Bug trên GitHub Issues + ảnh | repo `DuyITLOR/group05_eshop` | `verify-all.sh` mục 7 — tìm `issues/<số>` trong bug report |

## §6 (technical) — Postman features + CI/CD

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| Dùng càng nhiều feature Postman càng tốt + **liệt kê** | [postman/README.md](postman/README.md) bảng 15 feature | đọc cột trạng thái; mỗi `[x]` phải trỏ được vào file thật |
| Newman trong CI/CD | [.github/workflows/api-tests.yml](.github/workflows/api-tests.yml) | `gh run list --workflow api-tests.yml` |
| CI/CD report + **2 commit mẫu** (1 xanh, 1 đỏ) | [ci/ci-report.md](ci/ci-report.md) §3 | `verify-all.sh` — tìm link `actions/runs/<id>` |

## §7 — Agent Skill / AI test generator

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| Thiết kế generator + **sơ đồ tự vẽ** + pseudocode | [generator/design.md](generator/design.md) · `generator/diagram/*.png` · [generator/pseudocode.py](generator/pseudocode.py) | `verify-all.sh` mục 6 · **kiểm tay**: sơ đồ phải do mình vẽ (§11) |
| Hiện thực dưới dạng Agent Skill + video demo | [.claude/skills/](.claude/README.md) · link YouTube trong README | `ls .claude/skills/*/SKILL.md` · mở link video ở cửa sổ ẩn danh |

## §9, §10 — AI Audit + Critique

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| Lời khai + audit mỗi lượt AI (tool, giờ, prompt, output, review) | [ai-audit/ai-audit-report.md](ai-audit/ai-audit-report.md) | `grep -c '^### Interaction' ai-audit/ai-audit-report.md` |
| AI Critique 200–300 từ, trả lời 3 câu | [ai-audit/ai-critique.md](ai-audit/ai-critique.md) | `verify-all.sh` mục 7 — đếm từ dưới `## Critique` |

## §12, §14 — Commit log + bộ nộp

| Yêu cầu | Nơi đáp ứng | **Tự kiểm bằng** |
|---|---|---|
| Một commit cho **mỗi bước** của quy trình | git history | `bash tools/commit-plan.sh status` |
| Commit log dạng text | `git-log/commit-log.txt` | `bash tools/commit-plan.sh log` |
| Đủ tài liệu §14, tên zip đúng định dạng | — | `bash tools/package.sh <điểm> --check` |
| Repo công khai | https://github.com/DuyITLOR/HW06-Api-Testing | **kiểm tay** bằng cửa sổ ẩn danh |

---

## Không tự động kiểm được — danh sách kiểm tay trước khi nộp

- [ ] Ảnh Postman Console hiện đúng header `X-Student-Id: 23127178` (§11)
- [ ] Hostname trong output Newman là `localhost`/`127.0.0.1` (§11)
- [ ] Sơ đồ generator do **chính mình** vẽ, không phải AI sinh (§11)
- [ ] Bộ 3 API không trùng thành viên nào trong nhóm (§5) — đối chiếu ảnh chat
- [ ] Repo ở trạng thái **public**, mở được từ cửa sổ ẩn danh (§14)
- [ ] Video demo Agent Skill xem được bằng link (§7)
- [ ] Mỗi bug trong `bug-report.md` đã tự tái hiện lại bằng request thật
- [ ] Human review trong AI Audit dùng đúng hai nhãn *(SV đã kiểm)* / *(SV chưa tự kiểm)*
