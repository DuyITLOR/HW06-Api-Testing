# API-01 — Pool A · GET /api/products · bước 1 (§6.1): test case do AI sinh

- **Pool A · FR-05 Product listing & search** · prefix `TC-PRODLIST-###` · **36 test case** (đề đòi ≥35 tính cả case tự thêm)
- Sinh bằng `node tools/gen-artifacts.mjs api-01-products-search` từ `generator/specs/api-01-products-search.mjs` — **đừng sửa file này bằng tay**, sửa spec rồi sinh lại.
- Quy trình 5 bước của `/api-test-design`; mỗi bước một lượt AI riêng, ghi trong `ai-audit/ai-audit-report.md`.

## Phân bố theo kỹ thuật

| Kỹ thuật | Số case |
|---|---|
| Domain | 18 |
| State | 5 |
| Security | 6 |
| Schema | 7 |
| **Tổng** | **36** |

## Bảng test case

> Cột `Kết quả` điền **tự động** từ `reports/newman/*.json` (lượt `23127178_api-01-products-search_20260819-002443.json`).

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PRODLIST-001 | Domain | **không truyền** `search` — trả toàn bộ | `GET /api/products` | không có header | – | 200 | mảng JSON tất cả sản phẩm, đúng schema | spec §3.1 | AI |  | **Pass** (5/5) |
| TC-PRODLIST-002 | Domain | `search` **rỗng** — coi như không lọc | `GET /api/products` | không có header | `search=(rỗng)` | 200 | mảng JSON, số dòng = mốc `total_products` | spec §3.1 (`search` là *tuỳ chọn*) | AI |  | **Pass** (3/3) |
| TC-PRODLIST-003 | Domain | khớp **nhiều dòng** — `Laptop` | `GET /api/products` | không có header | `search=Laptop` | 200 | ≥2 dòng, **mọi** dòng có `Laptop` trong `name` | spec §3.1 *tìm theo tên* | AI |  | **Pass** (4/4) |
| TC-PRODLIST-004 | Domain | chữ **thường** — `laptop` (không phân biệt hoa/thường) | `GET /api/products` | không có header | `search=laptop` | 200 | ≥2 dòng — bằng kết quả của `Laptop` | FR-05 *tìm kiếm theo tên* | AI |  | **Pass** (3/3) |
| TC-PRODLIST-005 | Domain | **IN HOA** — `LAPTOP` | `GET /api/products` | không có header | `search=LAPTOP` | 200 | ≥2 dòng | FR-05 | AI |  | **Pass** (3/3) |
| TC-PRODLIST-006 | Domain | tiếng Việt **có dấu**, đúng hoa/thường — `Áo` | `GET /api/products` | không có header | `search=Áo` | 200 | 1 dòng — fixture áo thun | FR-05 · SUT là ứng dụng tiếng Việt | AI |  | **Pass** (3/3) |
| TC-PRODLIST-007 | Domain | khớp **giữa từ** — `thun` | `GET /api/products` | không có header | `search=thun` | 200 | 1 dòng (LIKE `%…%` khớp giữa tên) | spec §3.1 | AI |  | **Pass** (3/3) |
| TC-PRODLIST-008 | Domain | **nhiều từ** — `Dell XPS` | `GET /api/products` | không có header | `search=Dell XPS` | 200 | 1 dòng | spec §3.1 | AI |  | **Pass** (3/3) |
| TC-PRODLIST-009 | Domain | **không khớp gì** — chuỗi vô nghĩa | `GET /api/products` | không có header | `search=khong-ton-tai-xyz-123` | 200 | mảng **rỗng**, không phải 404 | spec §3.1 (danh sách rỗng là hợp lệ) | AI |  | **Pass** (3/3) |
| TC-PRODLIST-010 | Domain | **một ký tự** — `a` (biên dưới độ dài) | `GET /api/products` | không có header | `search=a` | 200 | mảng JSON, ≥1 dòng | spec §3.1 không đặt độ dài tối thiểu | AI |  | **Pass** (3/3) |
| TC-PRODLIST-011 | Domain | **chỉ khoảng trắng** — ` ` | `GET /api/products` | không có header | `search= ` | 200 | 200 + mảng JSON đúng schema (spec không định nghĩa trim) | spec §3.1 **im lặng** — chỉ kiểm status + schema, không kiểm số dòng | AI |  | **Pass** (3/3) |
| TC-PRODLIST-012 | Domain | **rất dài** — 300 ký tự | `GET /api/products` | không có header | `search=LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL` | 200 | mảng rỗng, không 500 | spec §3.1 không giới hạn độ dài | AI |  | **Pass** (4/4) |
| TC-PRODLIST-013 | Domain | chứa `_` trong **dữ liệu hợp lệ** — `Chuot_khong` | `GET /api/products` | không có header | `search=Chuot_khong` | 200 | 1 dòng | spec §3.1 | AI |  | **Pass** (3/3) |
| TC-PRODLIST-014 | Domain | **emoji / ký tự ngoài BMP** — 🚀 | `GET /api/products` | không có header | `search=🚀` | 200 | mảng rỗng, không 500 | spec §3.1 không hạn chế bộ ký tự | AI |  | **Pass** (4/4) |
| TC-PRODLIST-015 | Domain | **khoảng trắng đầu/cuối** — ` Laptop ` | `GET /api/products` | không có header | `search= Laptop ` | 200 | 200 + mảng JSON (spec không định nghĩa trim) | spec §3.1 **im lặng** về trim | AI |  | **Pass** (3/3) |
| TC-PRODLIST-016 | Domain | **tham số lạ** — `?foo=bar` (phải bỏ qua) | `GET /api/products` | không có header | `foo=bar` | 200 | như không truyền `search`: số dòng = `total_products` | spec §3.1 chỉ định nghĩa `search` | AI |  | **Pass** (3/3) |
| TC-PRODLIST-017 | Domain | endpoint **public** — có token vẫn phải chạy | `GET /api/products` | user thường | `search=Laptop` | 200 | 200, kết quả như khi không có token | spec §3 không đòi `Authorization` cho §3.1 | AI |  | **Pass** (3/3) |
| TC-PRODLIST-018 | Domain | **method không được hỗ trợ** — `PATCH /api/products` | `PATCH /api/products` | không có header | – | 404 hoặc 405 | 404/405 — không được coi là GET | spec §3.1 chỉ định nghĩa GET | AI |  | **Pass** (1/1) |
| TC-PRODLIST-019 | State | tạo sản phẩm mới → phải xuất hiện trong tìm kiếm (bước 1: tạo) | `POST /api/products` | admin | `{"name":"HW06-State-Marker","price":12345,"description":"state","imageUrl":"","category_id` | 200 | `{message, id}`, lưu `state_product_id` | spec §3.3 | AI |  | **Pass** (2/2) |
| TC-PRODLIST-020 | State | bước 2: tìm được sản phẩm vừa tạo | `GET /api/products` | không có header | `search=HW06-State-Marker` | 200 | đúng 1 dòng, `name` khớp | spec §3.1 + §3.3 | AI |  | **Pass** (4/4) |
| TC-PRODLIST-021 | State | bước 3: xoá sản phẩm | `DELETE /api/products/{{state_product_id}}` | admin | – | 200 | `{message: 'Product deleted'}` | spec §3.3 | AI |  | **Pass** (2/2) |
| TC-PRODLIST-022 | State | bước 4: sau khi xoá thì **không** còn trong tìm kiếm | `GET /api/products` | không có header | `search=HW06-State-Marker` | 200 | mảng rỗng | spec §3.1 + §3.3 | AI |  | **Pass** (3/3) |
| TC-PRODLIST-023 | State | bước 5: xem chi tiết sản phẩm **đã xoá** | `GET /api/products/{{state_product_id}}` | không có header | – | 404 | 404 + `{error}` — tài nguyên không còn tồn tại | spec §3.2 định nghĩa *xem chi tiết MỘT sản phẩm*; không có sản phẩm thì không có đối tượng để trả 200 | AI |  | **FAIL** (2/2 đỏ) |
| TC-PRODLIST-024 | Security SEC-05 | SQLi **tautology** — `%' OR '1'='1` | `GET /api/products` | không có header | `search=%' OR '1'='1` | 200 | coi là **chuỗi tìm kiếm bình thường** → 0 dòng; **không** được trả toàn bộ bảng | SEC-05 (parameterized query) | AI |  | **FAIL** (2/4 đỏ) |
| TC-PRODLIST-025 | Security SEC-05 | SQLi **comment** — `' OR 1=1--` | `GET /api/products` | không có header | `search=' OR 1=1--` | 200 | 0 dòng, không trả toàn bộ bảng | SEC-05 | AI |  | **FAIL** (2/4 đỏ) |
| TC-PRODLIST-026 | Security SEC-05 | SQLi **UNION** — dò số cột | `GET /api/products` | không có header | `search=' UNION SELECT 1,2,3,4,5--` | 200 | 200 + 0 dòng; **không** lộ lỗi SQL | SEC-05 | AI |  | **FAIL** (5/5 đỏ) |
| TC-PRODLIST-027 | Security SEC-05 | SQLi **stacked query** — `'; DROP TABLE products--` | `GET /api/products` | không có header | `search='; DROP TABLE products--` | 200 | 200 + 0 dòng | SEC-05 | AI |  | **FAIL** (1/3 đỏ) |
| TC-PRODLIST-028 | Security SEC-04 | payload **XSS** trong `search` | `GET /api/products` | không có header | `search=<script>alert(1)</script>` | 200 | 200, `Content-Type: application/json` (payload là **dữ liệu**, không phải markup), 0 dòng | SEC-04 | AI |  | **Pass** (4/4) |
| TC-PRODLIST-029 | Security SEC-05 | SQLi **boolean-based** — `x' AND '1'='2` | `GET /api/products` | không có header | `search=x' AND '1'='2` | 200 | 200 + 0 dòng, không 500 | SEC-05 | AI |  | **Pass** (4/4) |
| TC-PRODLIST-030 | Schema | danh sách: **kiểu** của mọi field | `GET /api/products` | không có header | – | 200 | mảng object; `id` integer, `name` string, `price` **number** | spec §3.1 + body mẫu §3.3 | AI |  | **Pass** (2/2) |
| TC-PRODLIST-031 | Schema | danh sách: **không** được lộ field nội bộ | `GET /api/products` | không có header | – | 200 | không có field ngoài tập của spec | spec §3.1 | AI |  | **Pass** (2/2) |
| TC-PRODLIST-032 | Schema | chi tiết **id lẻ** (id=1): `price` là number | `GET /api/products/1` | không có header | – | 200 | object đúng schema, `price` number | spec §3.2 + §3.3 (`price: 100000`) | AI |  | **Pass** (5/5) |
| TC-PRODLIST-033 | Schema | chi tiết: `id` **không tồn tại** (999999) | `GET /api/products/999999` | không có header | – | 404 | 404 + `{error}` | spec §3.2 — *xem chi tiết một sản phẩm* | AI |  | **FAIL** (2/2 đỏ) |
| TC-PRODLIST-034 | Schema | chi tiết: `id` **sai kiểu** (`abc`) | `GET /api/products/abc` | không có header | – | 400 hoặc 404 | 400/404, **không** 200 | spec §3.2 — `:id` là số | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODLIST-035 | Schema | chi tiết: `id` **âm** (-1) | `GET /api/products/-1` | không có header | – | 400 hoặc 404 | 400/404 | spec §3.2 — id là khoá tự tăng, luôn ≥1 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODLIST-036 | Schema | chi tiết: `id = 0` (biên dưới - 1) | `GET /api/products/0` | không có header | – | 404 | 404 | spec §3.2 | AI |  | **FAIL** (1/1 đỏ) |
