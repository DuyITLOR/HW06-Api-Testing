# API-01 — Pool A · GET /api/products · bước 2 (§6.2): audit của sinh viên

- 36 case AI sinh, đã dán nhãn **VALID / INVALID / INCOMPLETE** kèm lý do.
- Sinh từ cột `audit` trong `generator/specs/api-01-products-search.mjs` — nhãn nằm cùng chỗ với định nghĩa case nên không lệch nhau được.

## Thống kê audit

| Nhãn | Số case |
|---|---|
| VALID | 35 |
| INVALID (đã sửa) | 0 |
| INCOMPLETE (đã bổ sung) | 1 |

## Ghi chú audit

**Sửa 1 case (`TC-PRODLIST-011`).** Bản AI sinh đặt expected `0 dòng` cho `search=" "`. Spec §3.1 không nói gì về trim,
nên `0 dòng` là suy đoán — nếu SUT trả về nhiều dòng thì đó **chưa chắc** là bug. Đã hạ về đúng phần spec bảo đảm:
status 200 + schema. Đây là kiểu lỗi nguy hiểm nhất khi để AI sinh test: expected trông hợp lý nhưng không có căn cứ,
và nó sinh ra **bug giả** trong báo cáo.

**Không sửa expected để khớp SUT.** 14 case dưới đây ĐỎ ở lượt nộp — đúng danh sách, không gộp khoảng:
`023 · 024 · 025 · 026 · 027 · 033 · 034 · 035 · 036 · 101 · 103 · 104 · 105 · 107`.
Sửa expected cho khớp hành vi sai của SUT là cách nhanh nhất để bộ test mất hết giá trị — đỏ ở đây là
**phát hiện**, không phải lỗi test. (Danh sách này được `tools/check-cases.mjs` đối chiếu với raw JSON của
lượt chạy, nên nó không thể lệch âm thầm — bản trước ghi `007/…/101–107`, trong đó 007, 102 và 106 thực ra XANH.)

## Bảng audit

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PRODLIST-001 | Domain | **không truyền** `search` — trả toàn bộ | `GET /api/products` | không có header | – | 200 | mảng JSON tất cả sản phẩm, đúng schema | spec §3.1 | AI | VALID | **Pass** (5/5) |
| TC-PRODLIST-002 | Domain | `search` **rỗng** — coi như không lọc | `GET /api/products` | không có header | `search=(rỗng)` | 200 | mảng JSON, số dòng = mốc `total_products` | spec §3.1 (`search` là *tuỳ chọn*) | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-003 | Domain | khớp **nhiều dòng** — `Laptop` | `GET /api/products` | không có header | `search=Laptop` | 200 | ≥2 dòng, **mọi** dòng có `Laptop` trong `name` | spec §3.1 *tìm theo tên* | AI | VALID | **Pass** (4/4) |
| TC-PRODLIST-004 | Domain | chữ **thường** — `laptop` (không phân biệt hoa/thường) | `GET /api/products` | không có header | `search=laptop` | 200 | ≥2 dòng — bằng kết quả của `Laptop` | FR-05 *tìm kiếm theo tên* | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-005 | Domain | **IN HOA** — `LAPTOP` | `GET /api/products` | không có header | `search=LAPTOP` | 200 | ≥2 dòng | FR-05 | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-006 | Domain | tiếng Việt **có dấu**, đúng hoa/thường — `Áo` | `GET /api/products` | không có header | `search=Áo` | 200 | 1 dòng — fixture áo thun | FR-05 · SUT là ứng dụng tiếng Việt | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-007 | Domain | khớp **giữa từ** — `thun` | `GET /api/products` | không có header | `search=thun` | 200 | 1 dòng (LIKE `%…%` khớp giữa tên) | spec §3.1 | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-008 | Domain | **nhiều từ** — `Dell XPS` | `GET /api/products` | không có header | `search=Dell XPS` | 200 | 1 dòng | spec §3.1 | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-009 | Domain | **không khớp gì** — chuỗi vô nghĩa | `GET /api/products` | không có header | `search=khong-ton-tai-xyz-123` | 200 | mảng **rỗng**, không phải 404 | spec §3.1 (danh sách rỗng là hợp lệ) | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-010 | Domain | **một ký tự** — `a` (biên dưới độ dài) | `GET /api/products` | không có header | `search=a` | 200 | mảng JSON, ≥1 dòng | spec §3.1 không đặt độ dài tối thiểu | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-011 | Domain | **chỉ khoảng trắng** — ` ` | `GET /api/products` | không có header | `search= ` | 200 | 200 + mảng JSON đúng schema (spec không định nghĩa trim) | spec §3.1 **im lặng** — chỉ kiểm status + schema, không kiểm số dòng | AI | INCOMPLETE: bản AI sinh ban đầu ghi expected `0 dòng` — đó là **suy đoán**. Đã sửa: spec không nói có trim hay không, nên chỉ khẳng định phần spec bảo đảm. | **Pass** (3/3) |
| TC-PRODLIST-012 | Domain | **rất dài** — 300 ký tự | `GET /api/products` | không có header | `search=LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL` | 200 | mảng rỗng, không 500 | spec §3.1 không giới hạn độ dài | AI | VALID | **Pass** (4/4) |
| TC-PRODLIST-013 | Domain | chứa `_` trong **dữ liệu hợp lệ** — `Chuot_khong` | `GET /api/products` | không có header | `search=Chuot_khong` | 200 | 1 dòng | spec §3.1 | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-014 | Domain | **emoji / ký tự ngoài BMP** — 🚀 | `GET /api/products` | không có header | `search=🚀` | 200 | mảng rỗng, không 500 | spec §3.1 không hạn chế bộ ký tự | AI | VALID | **Pass** (4/4) |
| TC-PRODLIST-015 | Domain | **khoảng trắng đầu/cuối** — ` Laptop ` | `GET /api/products` | không có header | `search= Laptop ` | 200 | 200 + mảng JSON (spec không định nghĩa trim) | spec §3.1 **im lặng** về trim | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-016 | Domain | **tham số lạ** — `?foo=bar` (phải bỏ qua) | `GET /api/products` | không có header | `foo=bar` | 200 | như không truyền `search`: số dòng = `total_products` | spec §3.1 chỉ định nghĩa `search` | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-017 | Domain | endpoint **public** — có token vẫn phải chạy | `GET /api/products` | user thường | `search=Laptop` | 200 | 200, kết quả như khi không có token | spec §3 không đòi `Authorization` cho §3.1 | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-018 | Domain | **method không được hỗ trợ** — `PATCH /api/products` | `PATCH /api/products` | không có header | – | 404 hoặc 405 | 404/405 — không được coi là GET | spec §3.1 chỉ định nghĩa GET | AI | VALID | **Pass** (1/1) |
| TC-PRODLIST-019 | State | tạo sản phẩm mới → phải xuất hiện trong tìm kiếm (bước 1: tạo) | `POST /api/products` | admin | `{"name":"HW06-State-Marker","price":12345,"description":"state","imageUrl":"","category_id` | 200 | `{message, id}`, lưu `state_product_id` | spec §3.3 | AI | VALID | **Pass** (2/2) |
| TC-PRODLIST-020 | State | bước 2: tìm được sản phẩm vừa tạo | `GET /api/products` | không có header | `search=HW06-State-Marker` | 200 | đúng 1 dòng, `name` khớp | spec §3.1 + §3.3 | AI | VALID | **Pass** (4/4) |
| TC-PRODLIST-021 | State | bước 3: xoá sản phẩm | `DELETE /api/products/{{state_product_id}}` | admin | – | 200 | `{message: 'Product deleted'}` | spec §3.3 | AI | VALID | **Pass** (2/2) |
| TC-PRODLIST-022 | State | bước 4: sau khi xoá thì **không** còn trong tìm kiếm | `GET /api/products` | không có header | `search=HW06-State-Marker` | 200 | mảng rỗng | spec §3.1 + §3.3 | AI | VALID | **Pass** (3/3) |
| TC-PRODLIST-023 | State | bước 5: xem chi tiết sản phẩm **đã xoá** | `GET /api/products/{{state_product_id}}` | không có header | – | 404 | 404 + `{error}` — tài nguyên không còn tồn tại | spec §3.2 định nghĩa *xem chi tiết MỘT sản phẩm*; không có sản phẩm thì không có đối tượng để trả 200 | AI | VALID | **FAIL** (2/2 đỏ) |
| TC-PRODLIST-024 | Security SEC-05 | SQLi **tautology** — `%' OR '1'='1` | `GET /api/products` | không có header | `search=%' OR '1'='1` | 200 | coi là **chuỗi tìm kiếm bình thường** → 0 dòng; **không** được trả toàn bộ bảng | SEC-05 (parameterized query) | AI | VALID | **FAIL** (2/4 đỏ) |
| TC-PRODLIST-025 | Security SEC-05 | SQLi **comment** — `' OR 1=1--` | `GET /api/products` | không có header | `search=' OR 1=1--` | 200 | 0 dòng, không trả toàn bộ bảng | SEC-05 | AI | VALID | **FAIL** (2/4 đỏ) |
| TC-PRODLIST-026 | Security SEC-05 | SQLi **UNION** — dò số cột | `GET /api/products` | không có header | `search=' UNION SELECT 1,2,3,4,5--` | 200 | 200 + 0 dòng; **không** lộ lỗi SQL | SEC-05 | AI | VALID | **FAIL** (5/5 đỏ) |
| TC-PRODLIST-027 | Security SEC-05 | SQLi **stacked query** — `'; DROP TABLE products--` | `GET /api/products` | không có header | `search='; DROP TABLE products--` | 200 | 200 + 0 dòng | SEC-05 | AI | VALID | **FAIL** (1/3 đỏ) |
| TC-PRODLIST-028 | Security SEC-04 | payload **XSS** trong `search` | `GET /api/products` | không có header | `search=<script>alert(1)</script>` | 200 | 200, `Content-Type: application/json` (payload là **dữ liệu**, không phải markup), 0 dòng | SEC-04 | AI | VALID | **Pass** (4/4) |
| TC-PRODLIST-029 | Security SEC-05 | SQLi **boolean-based** — `x' AND '1'='2` | `GET /api/products` | không có header | `search=x' AND '1'='2` | 200 | 200 + 0 dòng, không 500 | SEC-05 | AI | VALID | **Pass** (4/4) |
| TC-PRODLIST-030 | Schema | danh sách: **kiểu** của mọi field | `GET /api/products` | không có header | – | 200 | mảng object; `id` integer, `name` string, `price` **number** | spec §3.1 + body mẫu §3.3 | AI | VALID | **Pass** (2/2) |
| TC-PRODLIST-031 | Schema | danh sách: **không** được lộ field nội bộ | `GET /api/products` | không có header | – | 200 | không có field ngoài tập của spec | spec §3.1 | AI | VALID | **Pass** (2/2) |
| TC-PRODLIST-032 | Schema | chi tiết **id lẻ** (id=1): `price` là number | `GET /api/products/1` | không có header | – | 200 | object đúng schema, `price` number | spec §3.2 + §3.3 (`price: 100000`) | AI | VALID | **Pass** (5/5) |
| TC-PRODLIST-033 | Schema | chi tiết: `id` **không tồn tại** (999999) | `GET /api/products/999999` | không có header | – | 404 | 404 + `{error}` | spec §3.2 — *xem chi tiết một sản phẩm* | AI | VALID | **FAIL** (2/2 đỏ) |
| TC-PRODLIST-034 | Schema | chi tiết: `id` **sai kiểu** (`abc`) | `GET /api/products/abc` | không có header | – | 400 hoặc 404 | 400/404, **không** 200 | spec §3.2 — `:id` là số | AI | VALID | **FAIL** (1/1 đỏ) |
| TC-PRODLIST-035 | Schema | chi tiết: `id` **âm** (-1) | `GET /api/products/-1` | không có header | – | 400 hoặc 404 | 400/404 | spec §3.2 — id là khoá tự tăng, luôn ≥1 | AI | VALID | **FAIL** (1/1 đỏ) |
| TC-PRODLIST-036 | Schema | chi tiết: `id = 0` (biên dưới - 1) | `GET /api/products/0` | không có header | – | 404 | 404 | spec §3.2 | AI | VALID | **FAIL** (1/1 đỏ) |
