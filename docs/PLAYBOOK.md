# HW06 — Playbook thực hiện 3 API

> Quy trình lặp lại **y hệt** cho API-01 → API-02 → API-03: gồm **prompt copy-dán** + **việc review
> thủ công** ở mỗi bước. File này là tài liệu quy trình nội bộ — **KHÔNG nộp** (xem `tools/package.sh`).
> Sinh viên: Lê Nhựt Duy — 23127178

---

## Sơ đồ quy trình (lặp cho mỗi API)

```
Đọc spec + source → Sinh test case (5 bước) → Audit → Thêm ≥5 case → Dựng collection
→ Chạy Newman → Bug report → GitHub Issues → Gộp main-report → Commit nhỏ → Push
```

## Cheat-sheet 3 API

| | API-01 | API-02 | API-03 |
|---|---|---|---|
| Pool / FR | A · FR-05 | B · FR-07 | C · FR-15 |
| Endpoint | `GET /api/products?search=` | `POST /api/cart` | `PUT /api/products/:id` |
| Prefix TC | `TC-PRODLIST-###` | `TC-CART-###` | `TC-PRODUPD-###` |
| Tham số | `search` | `id`, `name`, `price`, `quantity`, `Authorization` | `:id`, `name`, `price`, `description`, `imageUrl`, `category_id`, `Authorization` |
| Trọng tâm | **SQL injection (SEC-05)** + schema | **validate + price tampering + state sau checkout** | **thiếu auth/role (SEC-02, SEC-03)** + partial update |
| Giả thuyết bug | H1–H4 | H5–H8 | H9–H12 |
| Dòng source | `server.js:141-164` | `server.js:284-309` | `server.js:167-198` |

Bảng giả thuyết bug đầy đủ: `bug-report/bug-report.md`.

---

## Bước 0 — Chuẩn bị (làm một lần mỗi phiên)

```bash
bash ../final/eshop.sh --seed     # SUT lên ở :3000
cd HW06-Api-Testing
npm run preflight                 # phải xanh trước khi làm gì tiếp
npm run seed:api                  # fixture + CSV
```

**Review thủ công:** preflight có dòng nào `[LOI]` không? DB có đủ fixture `HW06-*` chưa
(`curl -s localhost:3000/api/products | grep -c HW06-`)?

## Bước 1 — Sinh test case (§6.1) — **5 lượt AI riêng, không gộp**

**Prompt (lần lượt, mỗi lượt một tin nhắn):**

> 1. `/api-test-design` bước 1 cho **API-01 (`GET /api/products`)**: rút bảng tham số · kiểu · bắt buộc ·
>    ràng buộc từ `api_specification.md` §3.1 + FR-05 trong README SUT + `server.js:141-164`. Ghi rõ
>    chỗ nào spec **im lặng**, đừng bịa expected.
> 2. `/api-test-design` bước 2: phân hoạch miền cho **từng** tham số ở bảng trên. Phân vùng phải rời
>    nhau và phủ kín. Mã `TC-PRODLIST-###`.
> 3. `/api-test-design` bước 3: state transition cho API này (nếu có) — chuỗi request có thứ tự.
> 4. `/api-test-design` bước 4: security SEC-01…SEC-07. Case nào **ngoài phạm vi** API này thì ghi rõ
>    là ngoài phạm vi, đừng nhận vơ.
> 5. `/api-test-design` bước 5: schema validation — so response với spec, không so với chính nó.
>    Gộp cả 5 bước vào `test-cases/api-01-products-search/generated.md`, đúng 12 cột.

**Review thủ công:**
- Đủ **mọi** tham số chưa? `Authorization` có được coi là một tham số không?
- Có expected nào **bịa** không? Mỗi dòng cột `Căn cứ` phải trỏ được vào spec / FR / SEC / số dòng code.
- **Tự chạy 2–3 case bằng curl** để xác nhận expected mình ghi là đúng — đừng tin AI 100%.
- Ghi audit: `/ai-audit-logger` (5 mục, một mục mỗi bước).

## Bước 2 — Audit (§6.2)

**Prompt:**
> `/api-test-audit` cho API-01. Dán nhãn VALID/INVALID/INCOMPLETE **kèm lý do** cho từng dòng trong
> `generated.md`, sửa case invalid/incomplete, ghi ra `audit.md` + bảng thống kê 3 nhãn.

**Review thủ công:** nhãn nào không có lý do là chưa xong. Đặc biệt soát 4 lỗi hay gặp: expected bịa ·
assertion chỉ kiểm status · case không độc lập · case security không chứng minh tác động.
**Quan trọng:** nếu SUT lệch spec thì đó là **bug** — ghi vào bug report, **không** sửa expected cho
khớp hành vi sai của SUT.

## Bước 3 — Thêm ≥5 case AI bỏ sót (§6.3)

**Prompt:**
> `/api-test-audit` phần §6.3 cho API-01: thêm ≥5 case AI bỏ sót vào `extended.md`, phân loại lý do
> theo đúng 3 nhóm (prompt quality / model limitations / characteristics of the API).

**Review thủ công:** 5 case này phải là case **mình** nghĩ ra hoặc mình nhận ra AI thiếu — và lý do
phải trả lời *"vì sao AI không thấy"*, không phải *"vì sao case này đúng"*.

## Bước 4 — Dựng collection + chạy Newman (§6.4)

**Prompt:**
> `/postman-newman` dựng `postman/collections/23127178_api-01-products-search.postman_collection.json`
> từ `audit.md` + `extended.md`: folder 00-setup / 10-domain / 20-state / 30-security / 40-schema /
> 99-teardown, pre-request cấp collection lấy từ `postman/prerequest-collection.js`, assertion kiểm cả
> status + kiểu + schema, data-driven đọc `postman/data/search-terms.csv`.

```bash
npm run test:api1
npm run summary
```

**Review thủ công:**
- Mở HTML report: assertion đỏ có **đúng** là bug thật, hay là test mình viết sai?
- Chụp **ảnh Postman Console** thấy dòng `[HW06] X-Student-Id = 23127178` (§11) → lưu vào
  `bug-report/screenshots/`.
- Điền `ci/expected-failures.json` cho collection này, `reason` trỏ tới bug.

## Bước 5 — Bug report + GitHub Issues (§6.5)

**Prompt:**
> Từ assertion đỏ của API-01, viết bug vào `bug-report/bug-report.md` đúng template
> `.github/ISSUE_TEMPLATE/bug_report.md` của repo SUT, rồi thêm hàm tái hiện vào
> `bug-report/verify-bugs.sh`.

**Review thủ công:** `bash bug-report/verify-bugs.sh` — **tự tái hiện lại** từng bug trước khi ghi
"đã xác nhận". Mở Issue trên `DuyITLOR/group05_eshop`, **kéo-thả ảnh** vào mục Evidence, điền số `#`
ngược lại vào bug report + traceability + main-report.

## Bước 6 — Gộp vào main-report + commit

**Prompt:**
> Gộp API-01 vào `report/main-report.md` (mục 3.0–3.7, tự chứa), cập nhật README test summary +
> traceability + `postman/README.md` (đánh dấu feature đã dùng).

```bash
npm run excel
bash tools/commit-plan.sh status     # xem còn gì chưa commit
```

**Review thủ công:** số liệu trong README có **khớp** `summary.md` không (đừng gõ tay)?
Mỗi bước ở trên là **một commit riêng** (§12): generation · audit · extension · execution.

---

## Sau khi xong cả 3 API

1. **CI/CD (§6):** push để chạy `api-tests.yml` → một lượt **xanh** (`gate_mode=baseline`), rồi
   `gh workflow run api-tests.yml -f gate_mode=strict` → một lượt **đỏ**. Điền link + ảnh vào
   `ci/ci-report.md` §3.
2. **Generator (§7):** viết `generator/design.md` §2, §7 · **tự vẽ** sơ đồ → `generator/diagram/` ·
   quay video demo skill sinh test case cho 1 API.
3. **AI Critique (§10):** 200–300 từ, trả lời đúng 3 câu.
4. **Human review:** điền hết trong `ai-audit/ai-audit-report.md`, dùng hai nhãn *(SV đã kiểm)* /
   *(SV chưa tự kiểm)*.
5. `npm run pdf` · `bash tools/commit-plan.sh log` · `npm run verify` · `bash tools/package.sh <điểm>`.

## Nguyên tắc xuyên suốt (để được điểm cao + đúng đề)

1. **AI-First nhưng có kỷ luật:** đi từng bước qua skill, **không** một prompt gộp (§2 cấm đích danh).
2. **Human review là bắt buộc và được chấm:** luôn tự chạy lại vài case + tự tái hiện bug; chủ động
   ghi lại chỗ AI sai — bảng lỗi của AI càng cụ thể càng được điểm.
3. **Không viết con số nào chưa đo.** Số liệu chỉ đến từ `npm run summary`.
4. **Mỗi bước = một commit nhỏ** (§12).
5. **Sơ đồ generator tự vẽ** (§11) — đây là mục TA kiểm tay.
