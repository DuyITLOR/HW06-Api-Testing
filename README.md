# HW06 — API Testing on EShop

- **Sinh viên:** Lê Nhựt Duy — **MSSV:** 23127178
- **Môn:** Kiểm thử phần mềm (QA/QC) — **Bài:** HW06-AI API Testing
- **SUT:** EShop — https://github.com/ttbhanh/eshop-sut · spec: `api_specification.md`

> **Trạng thái nội dung:** 3 API hoàn tất pipeline §6.1–§6.5 — **136 test case** (109 AI sinh + **22 sinh
> viên tự thêm**), đã chạy thật **171 request / 333 assertion** bằng Newman, **89 assertion đỏ** và mỗi
> assertion đỏ map tới một trong **19 bug đã tái hiện được bằng request thật** (5 Critical). Bug nặng nhất:
> **hai request không cần token làm sập cả backend** (BUG-14) — lộ ra vì SUT chết giữa lúc dò thử, không do
> test case nào sinh ra. Bảng **11 lỗi của AI đã bắt và sửa** ở [main-report §11](report/main-report.md);
> hai trong số đó (lỗi cú pháp JS sinh ra, và seed chạy trước khi DB seed xong) đã làm 4 assertion đỏ mà
> **nếu không truy nguyên thì sẽ bị báo thành bug của SUT**.
>
> **CI/CD:** hai lượt mẫu đúng nghĩa §6 — [XANH 216/0](https://github.com/DuyITLOR/HW06-Api-Testing/actions/runs/32580345226) · [ĐỎ 1/217](https://github.com/DuyITLOR/HW06-Api-Testing/actions/runs/32580407707).
>
> **Còn thiếu 1 mục cần làm tay** (xem [§8](#10-việc-còn-lại)): **human review của sinh viên** trong AI Audit —
> 11 lượt đang là *(SV chưa tự kiểm)*, và §6.2 nói trách nhiệm cuối là của sinh viên.

## Liên kết

| | |
|---|---|
| **Repo bài làm (HW06)** | https://github.com/DuyITLOR/HW06-Api-Testing |
| **SUT** | https://github.com/ttbhanh/eshop-sut |
| **Bằng chứng chọn API (§5)** | [docs/api-selection.md](docs/api-selection.md) |
| **Bản đồ yêu cầu → file** | [TASKS.md](TASKS.md) |
| **Báo cáo chính** | [report/main-report.md](report/main-report.md) |
| **Test summary (sinh tự động)** | [test-cases/test-summary/summary.md](test-cases/test-summary/summary.md) — *chưa có, chạy `npm run summary`* |
| **Postman feature đã dùng** | [postman/README.md](postman/README.md) |
| **CI/CD report** | [ci/ci-report.md](ci/ci-report.md) |
| **Bug report** | [bug-report/bug-report.md](bug-report/bug-report.md) |
| **AI Audit + Critique** | [ai-audit/](ai-audit/) |
| **Bằng chứng §11** | [postman-console-gui.png](bug-report/screenshots/postman-console-gui.png) — **Postman Console** in 12 dòng `[HW06] X-Student-Id = "23127178"` kèm request tới `localhost:3000` trả 200 · thêm [console-x-student-id.png](bug-report/screenshots/console-x-student-id.png) và [x-student-id-request-header.png](bug-report/screenshots/x-student-id-request-header.png) |
| **Log tái hiện 19 bug** | [bug-report/verify-bugs-output.txt](bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh` |
| **GitHub Issues** | [#323](https://github.com/DuyITLOR/group05_eshop/issues/323)–[#341](https://github.com/DuyITLOR/group05_eshop/issues/341) — 19/19 bug, mỗi issue có ảnh nhúng sẵn |
| **2 lượt CI mẫu (§6)** | [XANH 216/0](https://github.com/DuyITLOR/HW06-Api-Testing/actions/runs/32580345226) · [ĐỎ 1/217](https://github.com/DuyITLOR/HW06-Api-Testing/actions/runs/32580407707) |
| **Video demo Agent Skill** | *(chưa có — §7 khuyến khích, không bắt buộc)* |

---

## 1. Phạm vi — 3 API, mỗi pool một API (§5)

Chi tiết + bằng chứng không trùng nhóm: [docs/api-selection.md](docs/api-selection.md).

| Mã | Pool | FR | API chính | Endpoint hỗ trợ | Prefix test case |
|---|---|---|---|---|---|
| **API-01** | A | FR-05 Product listing & search | `GET /api/products?search=` | `GET /api/products/:id` | `TC-PRODLIST-###` |
| **API-02** | B | FR-07 Shopping cart | `POST /api/cart` | `GET /api/cart`, `POST /api/checkout` | `TC-CART-###` |
| **API-03** | C | FR-15 Product management (admin) | `PUT /api/products/:id` | `POST`/`GET`/`DELETE /api/products/:id` | `TC-PRODUPD-###` |

Trọng tâm kiểm thử của từng API (rút từ source SUT, **chưa xác nhận**): API-01 → SQL injection +
schema · API-02 → validate + price tampering + state sau checkout · API-03 → thiếu auth/role
(SEC-02/SEC-03) + partial update.

## 2. Test Summary Report (§14)

> Số liệu request/assertion **sinh tự động** bằng `npm run summary` từ `reports/newman/*.json`
> ([summary.md](test-cases/test-summary/summary.md)). **Đừng gõ tay.**

| Chỉ số | API-01 | API-02 | API-03 | **Tổng** |
|---|---|---|---|---|
| Test case AI sinh (§6.1) | 36 | 39 | 39 | **114** |
| Test case sinh viên thêm (§6.3) | 7 | 7 | 8 | **22** |
| **Tổng test case** (§6.1 đòi ≥35/API) | **43** | **46** | **47** | **136** |
| Request đã thực thi (kèm setup/teardown) | 62 | 52 | 57 | **171** |
| Assertion | 155 | 85 | 93 | **333** |
| Passed | 126 | 55 | 63 | **244** |
| **Failed** (= bắt được bug) | **29** | **30** | **30** | **89** |
| Bug xác nhận | 6 | 6 | 6 | **19** *(+1 SEC-01 ngoài phạm vi)* |

Thêm **regression suite** (cổng CI): 94 request · **216 assertion · 0 đỏ** — tập con các case đang xanh,
sinh tự động, giữ nguyên expected.

Chỉ tiêu của đề: **≥35 test case/API** (§6.1) ✅ và **≥5 case tự thêm/API** (§6.3) ✅.
Bug theo mức: **5 Critical · 5 High · 7 Medium · 2 Low** — [bug-report.md](bug-report/bug-report.md).
**4 giả thuyết bị loại** sau khi kiểm chứng (ghi lại để không nhận vơ).

## 3. Bảng tự đánh giá (Self-Assessment) — §15

> Đuôi tên ZIP là **đúng ba chữ số** theo §14: `23127178_HW06_AI_API_<###>.zip`.
> **Điểm tự chấm: 95/100.** Mọi deliverable §14 đều có và kiểm được bằng máy (38 mục, 0 lỗi); trừ **5 điểm**
> cho một điều đã khai rõ ở [§8](#8-human-review--sinh-viên-tự-làm-gì-uỷ-quyền-gì-692-99): phần **đọc từng
> dòng tài liệu** được uỷ quyền cho AI, trong khi §6.2 đặt trách nhiệm cuối về test case lên sinh viên.
> Tự chấm 100 khi đã khai như vậy là tự mâu thuẫn; 95 là con số trung thực.

| No. | Tiêu chí | Điểm tối đa | **Điểm tự chấm** | Căn cứ |
|---|---|---|---|---|
| 1 | API-01 — full pipeline (generate + audit + extend + execute + bugs) | 30 | **28** | 43 case (36 AI + 7 SV) · 155 assertion đã chạy · 6 bug (BUG-01 SQLi Critical) · audit sửa 1 case bịa expected · Issue [#323](https://github.com/DuyITLOR/group05_eshop/issues/323)–[#328](https://github.com/DuyITLOR/group05_eshop/issues/328) |
| 2 | API-02 — full pipeline | 30 | **28** | 46 case (39 + 7) · 85 assertion · 6 bug (BUG-08 price tampering Critical) · ghi rõ lập luận `price` không thuần câu chữ spec · Issue [#329](https://github.com/DuyITLOR/group05_eshop/issues/329)–[#334](https://github.com/DuyITLOR/group05_eshop/issues/334) |
| 3 | API-03 — full pipeline | 30 | **29** | 47 case (39 + 8) · 93 assertion · 6 bug gồm **BUG-14 DoS** và BUG-13 thiếu auth (2 Critical) · Issue [#335](https://github.com/DuyITLOR/group05_eshop/issues/335)–[#340](https://github.com/DuyITLOR/group05_eshop/issues/340) |
| 4 | Agent Skills (AI-driven test generator) | 10 | **10** | 4 SKILL.md + generator **đã chạy thật** sinh cả 136 case và 3 collection · thiết kế 6 giai đoạn + pseudocode · sơ đồ 6 giai đoạn + 3 nhánh quyết định · `gen-regression.mjs` cũng là một tầng của generator (§7 khuyến khích video, không bắt buộc) |
| | **Tổng** | **100** | **95** | |

## 4. Cách chạy

```bash
# 1. Khởi động SUT (dùng chung cho mọi HW)
bash ../final/eshop.sh --seed          # backend :3000

# 2. Kiểm môi trường + dựng dữ liệu test
npm run preflight                      # SUT sống? tài khoản seed còn? 3 API phản hồi?
npm run seed:api                       # fixture cho phân vùng search + CSV data-driven

# 3. Chạy test
npm run test:api1                      # hoặc test:api2 / test:api3 / test:all
npm run summary                        # → test-cases/test-summary/summary.md (nguồn số liệu DUY NHẤT)

# 4. Tài liệu và bằng chứng
npm run excel                          # bảng test case .md → excel/23127178_HW06_TestCases.xlsx
npm run pdf                            # xuất PDF các tài liệu §14
bash bug-report/verify-bugs.sh         # chạy lại bằng chứng từng bug bằng curl

# 5. Soát và đóng gói
npm run verify                         # tính lại bất biến, in danh sách việc còn thiếu
bash tools/package.sh 90 --check       # soát đúng danh sách §14, không tạo gói
bash tools/package.sh 90               # → 23127178_HW06_AI_API_090.zip
```

## 5. Cấu trúc repo

```
postman/
├── collections/      3 collection .json (§14) — tên: 23127178_<api-slug>.postman_collection.json
├── environments/     HW06-local.postman_environment.json
├── data/             CSV cho Collection Runner (data-driven) — sinh bằng npm run seed:api
├── prerequest-collection.js   script gắn header X-Student-Id cho MỌI request (§6.4, §11)
└── README.md         danh sách Postman feature đã dùng (§6 đòi liệt kê)
test-cases/
├── api-0X-*/         generated.md (§6.1) · audit.md (§6.2) · extended.md (§6.3)
└── test-summary/     summary.md (sinh tự động) · traceability-matrix.md
reports/newman/       HTML + raw JSON từng lượt chạy
excel/                test case + test summary dạng .xlsx (npm run excel)
generator/            thiết kế AI test generator (§7) + pseudocode + diagram/ (TỰ VẼ)
ci/                   ci-report.md (2 lượt mẫu) · expected-failures.json (baseline cổng CI)
report/ ai-audit/ bug-report/ git-log/
docs/                 api-selection.md NỘP KÈM (bằng chứng §5) · PLAYBOOK KHÔNG nộp
tools/                10 script — xem §6 dưới
.claude/skills/       4 Agent Skill (§7)
.github/workflows/    api-tests.yml — Newman trong GitHub Actions
```

## 6. Tooling

| Script | Việc |
|---|---|
| `preflight.mjs` | kiểm SUT + tài khoản seed + 3 API trước khi chạy |
| `seed-api-data.mjs` | fixture cho phân vùng `search` + 3 file CSV data-driven (`--clean` để dọn) |
| `run-newman.sh` | chạy 1 hoặc 3 collection, xuất HTML + JSON có timestamp |
| `summarize-newman.mjs` | raw JSON → `summary.md` + bảng assertion đỏ (nguồn số liệu duy nhất) |
| `ci-gate.mjs` | cổng CI: `--strict` (0 đỏ) cho regression suite · so baseline cho 3 collection bug-hunting |
| `gen-regression.mjs` | sinh regression suite = tập con case đang xanh (giữ nguyên expected) · `--break` tạo lượt CI đỏ mẫu |
| `tc2xlsx.py` | bảng test case Markdown → Excel (§14) |
| `md2pdf.py` · `build-pdfs.sh` | xuất PDF cho tài liệu §14 |
| `verify-all.sh` | tính lại bất biến, in cả danh sách **không tự kiểm được** |
| `check-claims.mjs` | soát **mọi con số công bố** trong 7 tài liệu so với raw JSON + kiểm link nội bộ + kiểm hash commit có thật |
| `check-expect-vs-checks.mjs` | bắt lỗi **assertion nghiêm hơn expected** trên toàn bộ 136 case (lỗi #11) |
| `mark-reviewed.mjs` | đánh dấu human review §6.2 — có hỏi xác nhận, ghi ngày |
| `package.sh` | soát đúng danh sách §14 rồi zip theo tên §14 |
| `commit-plan.sh` | commit theo từng bước (§12) + xuất `git-log/commit-log.txt` |

## 7. Agent Skills (§7)

| Skill | Việc |
|---|---|
| [`api-test-design`](.claude/skills/api-test-design/SKILL.md) | sinh test case qua **5 bước riêng** — §2 cấm prompt gộp |
| [`api-test-audit`](.claude/skills/api-test-audit/SKILL.md) | dán nhãn VALID/INVALID/INCOMPLETE + ≥5 case AI bỏ sót và **vì sao** |
| [`postman-newman`](.claude/skills/postman-newman/SKILL.md) | dựng collection, assertion đủ mạnh, chạy Newman, cổng CI |
| [`ai-audit-logger`](.claude/skills/ai-audit-logger/SKILL.md) | ghi AI Audit Report (§9) + 3 trường riêng HW06 |

<a id="10-việc-còn-lại"></a>
## 8. Human review — sinh viên tự làm gì, uỷ quyền gì (§6.2, §9)

Khai rõ để người chấm không phải đoán:

| Phần | Ai làm | Bằng chứng |
|---|---|---|
| Tái hiện 3 bug Critical (BUG-08, 13, 14) | **sinh viên** | tự chạy `verify-bugs.sh`, thấy backend chết + stack trace |
| Chạy toàn bộ bộ test (29/30/30) | **sinh viên** | lượt `*_20260823-0009*` chính là bằng chứng nộp |
| Chạy collection trong Postman GUI + chụp console | **sinh viên** | `postman-console-gui.png` |
| **Đọc từng dòng 3 file `audit.md` + báo cáo** | **uỷ quyền cho AI** | 4 lượt soát · 4 phép kiểm bằng máy (38 mục) · 25 lỗi đã tìm và sửa (§11) |

AI Policy của bài là **Open**, nên uỷ quyền **có khai báo** là hợp lệ. Cái giá của nó được ghi thẳng trong
[ai-audit](ai-audit/ai-audit-report.md): bốn lượt AI tự soát tìm được **1 → 3 → 2 → 2** lỗi, chưa lần nào
về 0 — tức lớp đọc của người vẫn còn giá trị, và bài này thiếu lớp đó ở phần tài liệu.

Nếu sau này bạn có đọc và muốn ghi nhận: `npm run review <số lượt>`.

## 9. Việc còn lại — không còn mục nào

> Ảnh Postman Console **đã có** — chụp từ chính Postman GUI (`postman-console-gui.png`): 12 dòng
> `[HW06] X-Student-Id = "23127178"` do pre-request script in ra, mỗi dòng kèm request tới
> `http://localhost:3000` trả `200`. Cộng thêm 2 ảnh cùng nội dung lấy từ báo cáo Newman.

Bộ nộp đã đủ §14 (`bash tools/package.sh 100 --check`). Việc duy nhất còn lại: **lấy file `.zip` đem nộp**.

**Đánh dấu sau khi đọc** — thay vì sửa tay 7 chỗ trong file audit:

```bash
npm run review              # xem lượt nào còn chưa kiểm + cần đọc file nào
npm run review 5 8          # đánh dấu lượt #5 và #8 (script hỏi lại trước khi ghi)
```

Script in ra chính xác điều sắp được khai, đòi bạn gõ xác nhận, rồi ghi ngày vào audit. Nó **không**
thay việc đọc — chỉ thay việc sửa tay.

**Cách làm tối thiểu mà đủ chắc** (~30 phút):

```bash
bash bug-report/verify-bugs.sh 14      # bug nặng nhất — 2 request làm sập backend
bash bug-report/verify-bugs.sh 13      # thiếu auth hoàn toàn
bash bug-report/verify-bugs.sh 08      # price tampering
npm run test:all                       # tự thấy 29/30/30
```

Rồi đọc 3 file `test-cases/*/audit.md`, sửa chỗ nào không đồng ý, và đổi *(SV chưa tự kiểm)* →
*(SV đã kiểm)* **chỉ ở những lượt đã kiểm thật**.

*(Tuỳ chọn — §7 ghi "encouraged", không bắt buộc: video demo Agent Skill. Ảnh Postman Console GUI cũng
là tuỳ chọn: bằng chứng `X-Student-Id` đã có bằng ảnh bảng REQUEST HEADERS trong báo cáo Newman.)*

Kiểm tiến độ: `npm run verify` · `bash tools/package.sh 100 --check`.

## 9. Ba điều quyết định cách đọc mọi con số của bài này

1. **Assertion đỏ là kết quả mong đợi.** Bộ test cố ý bắt bug thật của SUT, nên cổng CI so với
   **baseline** (`ci/expected-failures.json`), không so với 0. Đỏ tăng = hồi quy mới; đỏ giảm = SUT
   đã sửa **hoặc test của mình yếu đi** — cả hai đều cần người xem lại.
2. **Số liệu chỉ đến từ raw JSON của Newman.** `npm run summary` là nguồn duy nhất; README và
   báo cáo cùng đọc file đó.
3. **SUT xoá sạch và seed lại DB mỗi lần khởi động** (`backend/database.js:15-20`). Đó vừa là ràng buộc
   vừa là công cụ: `tools/run-newman.sh` **tự khởi động lại SUT trước mỗi collection** để có trạng thái
   đầu vào xác định, và chỉ kill tiến trình do chính nó khởi động (PID trong `.run-logs/sut.pid`).
   Vì vậy mọi assertion đếm dòng đều dùng mốc tương đối (`total_products`, `cart_before`), không hard-code.
4. **`BUG-14` không nằm trong collection Postman** — có chủ ý. Một lượt Newman chạm vào chuỗi đó sẽ làm
   SUT chết giữa đường và mọi case sau đỏ **vì môi trường**. Bằng chứng của BUG-14 nằm ở
   `bug-report/verify-bugs.sh` + stack trace trong `.run-logs/sut.log`.
