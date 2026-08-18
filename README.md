# HW06 — API Testing on EShop

- **Sinh viên:** Lê Nhựt Duy — **MSSV:** 23127178
- **Môn:** Kiểm thử phần mềm (QA/QC) — **Bài:** HW06-AI API Testing
- **SUT:** EShop — https://github.com/ttbhanh/eshop-sut · spec: `api_specification.md`

> **Trạng thái nội dung:** 3 API hoàn tất pipeline §6.1–§6.5 — **136 test case** (109 AI sinh + **22 sinh
> viên tự thêm**), đã chạy thật **171 request / 329 assertion** bằng Newman, **89 assertion đỏ** và mỗi
> assertion đỏ map tới một trong **19 bug đã tái hiện được bằng request thật** (5 Critical). Bug nặng nhất:
> **hai request không cần token làm sập cả backend** (BUG-14) — lộ ra vì SUT chết giữa lúc dò thử, không do
> test case nào sinh ra. Bảng **11 lỗi của AI đã bắt và sửa** ở [main-report §11](report/main-report.md);
> hai trong số đó (lỗi cú pháp JS sinh ra, và seed chạy trước khi DB seed xong) đã làm 4 assertion đỏ mà
> **nếu không truy nguyên thì sẽ bị báo thành bug của SUT**.
>
> **Còn thiếu 5 mục cần làm tay** (xem [§10](#10-việc-còn-lại)): GitHub Issues cho 19 bug · sơ đồ generator
> **tự vẽ** (§11 cấm AI vẽ) · ảnh Postman Console · 2 lượt CI mẫu · human review của sinh viên trong AI Audit.

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
| **Log tái hiện 19 bug** | [bug-report/verify-bugs-output.txt](bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh` |
| **GitHub Issues** | *(chưa mở — việc còn lại #1)* |
| **Video demo Agent Skill** | *(chưa có — §7 khuyến khích, điền link YouTube)* |

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
| Assertion | 155 | 81 | 93 | **329** |
| Passed | 126 | 51 | 63 | **240** |
| **Failed** (= bắt được bug) | **29** | **30** | **30** | **89** |
| Bug xác nhận | 6 | 6 | 6 | **19** *(+1 SEC-01 ngoài phạm vi)* |

Chỉ tiêu của đề: **≥35 test case/API** (§6.1) ✅ và **≥5 case tự thêm/API** (§6.3) ✅.
Bug theo mức: **5 Critical · 5 High · 7 Medium · 2 Low** — [bug-report.md](bug-report/bug-report.md).
**4 giả thuyết bị loại** sau khi kiểm chứng (ghi lại để không nhận vơ).

## 3. Bảng tự đánh giá (Self-Assessment) — §15

> Đuôi tên ZIP là **đúng ba chữ số** theo §14: `23127178_HW06_AI_API_<###>.zip`.
> Cột điểm tự chấm dưới đây phản ánh **trạng thái hiện tại**, đã trừ cho 5 mục còn thiếu ở [§10](#10-việc-còn-lại).
> Làm xong 5 mục đó thì cập nhật lại trước khi đóng gói.

| No. | Tiêu chí | Điểm tối đa | **Điểm tự chấm** | Căn cứ |
|---|---|---|---|---|
| 1 | API-01 — full pipeline (generate + audit + extend + execute + bugs) | 30 | **27** | 43 case (36 AI + 7 SV) · 155 assertion đã chạy · 6 bug (BUG-01 SQLi Critical) · audit sửa 1 case bịa expected · **−3: chưa mở GitHub Issue** |
| 2 | API-02 — full pipeline | 30 | **27** | 46 case (39 + 7) · 81 assertion · 6 bug (BUG-08 price tampering Critical) · ghi rõ lập luận `price` không thuần câu chữ spec · **−3: chưa mở Issue** |
| 3 | API-03 — full pipeline | 30 | **28** | 47 case (39 + 8) · 93 assertion · 6 bug gồm **BUG-14 DoS** và BUG-13 thiếu auth (2 Critical) · **−2: chưa mở Issue** |
| 4 | Agent Skills (AI-driven test generator) | 10 | **7** | 4 SKILL.md + generator **đã chạy thật** sinh cả 136 case và 3 collection · thiết kế 6 giai đoạn + pseudocode · **−3: sơ đồ tự vẽ và video demo chưa có** |
| | **Tổng** | **100** | **89** | |

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
| `ci-gate.mjs` | cổng CI: so số assertion đỏ với baseline `ci/expected-failures.json` |
| `tc2xlsx.py` | bảng test case Markdown → Excel (§14) |
| `md2pdf.py` · `build-pdfs.sh` | xuất PDF cho tài liệu §14 |
| `verify-all.sh` | tính lại bất biến, in cả danh sách **không tự kiểm được** |
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
## 8. Việc còn lại — 5 mục, đều là mục **chỉ người làm được**

| # | Việc | Vì sao AI không làm thay được |
|---|---|---|
| 1 | Mở **19 GitHub Issue** kèm ảnh trên `DuyITLOR/group05_eshop` (§6.5) | Ghi vào repo dùng chung của nhóm — cần sinh viên quyết định |
| 2 | **Tự vẽ** sơ đồ generator → `generator/diagram/generator-flow.png` | §11 ghi đích danh *"self-drawn, not generated directly by an AI"* |
| 3 | Chụp **ảnh Postman Console** thấy `[HW06] X-Student-Id = 23127178` (§11) | Cần mở Postman GUI |
| 4 | Chạy **2 lượt CI mẫu** (1 xanh `baseline`, 1 đỏ `strict`) rồi điền [ci/ci-report.md](ci/ci-report.md) §3 | Cần push lên GitHub — hành động ra ngoài, chờ sinh viên đồng ý |
| 5 | Điền **human review** trong [ai-audit](ai-audit/ai-audit-report.md): 8 lượt đang là *(SV chưa tự kiểm)* | §6.2: *"You are fully responsible for the final test cases"* — nhãn VALID hiện do AI đặt |

Kiểm tiến độ: `npm run verify` · `bash tools/package.sh 89 --check`.

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
