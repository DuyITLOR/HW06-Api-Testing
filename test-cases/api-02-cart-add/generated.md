# API-02 — Pool B · POST /api/cart · bước 1 (§6.1): test case do AI sinh

- **Pool B · FR-07 Shopping cart** · prefix `TC-CART-###` · **39 test case** (đề đòi ≥35 tính cả case tự thêm)
- Sinh bằng `node tools/gen-artifacts.mjs api-02-cart-add` từ `generator/specs/api-02-cart-add.mjs` — **đừng sửa file này bằng tay**, sửa spec rồi sinh lại.
- Quy trình 5 bước của `/api-test-design`; mỗi bước một lượt AI riêng, ghi trong `ai-audit/ai-audit-report.md`.

## Phân bố theo kỹ thuật

| Kỹ thuật | Số case |
|---|---|
| Domain | 23 |
| State | 7 |
| Security | 6 |
| Schema | 3 |
| **Tổng** | **39** |

## Bảng test case

> Cột `Kết quả` điền **tự động** từ `reports/newman/*.json` (lượt `23127178_api-02-cart-add_20260819-002446.json`).

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-CART-001 | Domain | `quantity = 1` — **biên dưới hợp lệ** | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":1}` | 200 | 200 + `{message}` | spec §4.2 | AI |  | **Pass** (3/3) |
| TC-CART-002 | Domain | `quantity = 2` — giá trị điển hình | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":2}` | 200 | 200 + `{message}` | spec §4.2 (body mẫu) | AI |  | **Pass** (2/2) |
| TC-CART-003 | Domain | `quantity = 0` — **biên dưới − 1** | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":0}` | 400/422 | từ chối — thêm 0 sản phẩm vào giỏ là vô nghĩa | FR-07 (giỏ hàng chứa số lượng ≥ 1) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-004 | Domain | `quantity = -5` — **số âm** | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":-5}` | 400/422 | từ chối | FR-07 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-005 | Domain | `quantity = 1.5` — **số thập phân** | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":1.5}` | 400/422 | từ chối — số lượng là số nguyên | spec §4.2 (`quantity: 2` là số nguyên) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-006 | Domain | `quantity = "abc"` — **sai kiểu** | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":"abc"}` | 400/422 | từ chối | spec §4.2 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-007 | Domain | **thiếu** `quantity` | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000}` | 400/422 | từ chối — `quantity` là field bắt buộc | spec §4.2 (body mẫu có `quantity`) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-008 | Domain | `quantity = 999999` — **vượt tồn kho** | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":999999}` | 400/422 | từ chối | FR-07 (không bán quá tồn kho) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-009 | Domain | `quantity = null` | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":null}` | 400/422 | từ chối | spec §4.2 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-010 | Domain | `id` **không tồn tại** (999999) | `POST /api/cart` | user thường | `{"id":999999,"name":"ghost","price":1000,"quantity":1}` | 400/404 | từ chối — không thêm được sản phẩm không có trong catalog | FR-07 (giỏ chứa sản phẩm thật) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-011 | Domain | `id = 0` — biên dưới − 1 | `POST /api/cart` | user thường | `{"id":0,"name":"x","price":1000,"quantity":1}` | 400/404 | từ chối | FR-07 · `id` là khoá tự tăng ≥ 1 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-012 | Domain | `id = -1` — số âm | `POST /api/cart` | user thường | `{"id":-1,"name":"x","price":1000,"quantity":1}` | 400/404 | từ chối | FR-07 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-013 | Domain | `id = "abc"` — sai kiểu | `POST /api/cart` | user thường | `{"id":"abc","name":"x","price":1000,"quantity":1}` | 400/422 | từ chối | spec §4.2 (`id: 1` là số) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-014 | Domain | **thiếu** `id` | `POST /api/cart` | user thường | `{"name":"x","price":1000,"quantity":1}` | 400/422 | từ chối — không biết thêm sản phẩm nào | spec §4.2 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-015 | Domain | **body rỗng** `{}` | `POST /api/cart` | user thường | `{}` | 400/422 | từ chối | spec §4.2 (4 field bắt buộc) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-016 | Domain | `price` **khớp catalog** (111000) | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":1}` | 200 | 200 + `{message}` | spec §4.2 | AI |  | **Pass** (2/2) |
| TC-CART-017 | Domain | `price = 0` | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":0,"quantity":1}` | 400/422 | từ chối — giá 0 không khớp catalog | FR-07/FR-08 (giá trong giỏ phải là giá thật) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-018 | Domain | `price = -1000` — âm | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":-1000,"quantity":1}` | 400/422 | từ chối | FR-08 (tiền không âm) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-019 | Domain | `price = "abc"` — sai kiểu | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":"abc","quantity":1}` | 400/422 | từ chối | spec §4.2 (`price: 100000` là số) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-020 | Domain | **thiếu** `price` | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","quantity":1}` | 400/422 | từ chối, **hoặc** lấy giá từ catalog | spec §4.2 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-021 | Domain | `name` **rỗng** | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"","price":111000,"quantity":1}` | 400/422 | từ chối, hoặc lấy tên từ catalog | spec §4.2 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-022 | Domain | `name` **không khớp** sản phẩm thật | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"Tên bịa không khớp id","price":111000,"quantity":1}` | 400/422 | từ chối — tên phải khớp `id`, hoặc server tự lấy tên | FR-07 (giỏ phản ánh sản phẩm thật) | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-023 | Domain | `name` **rất dài** (300 ký tự) | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN` | 400/422 | từ chối (tên không khớp catalog) | FR-07 | AI |  | **FAIL** (1/1 đỏ) |
| TC-CART-024 | State | bước 1: thêm 1 sản phẩm rồi **đọc lại giỏ** | `GET /api/cart` | user thường | – | 200 | giỏ có nhiều hơn mốc `cart_before` (các case hợp lệ ở trên đã thêm) | spec §4.1 + §4.2 | AI |  | **Pass** (3/3) |
| TC-CART-025 | State | bước 2: **giá trong giỏ phải bằng giá catalog** | `GET /api/cart` | user thường | – | 200 | mọi dòng của `product_id` có `price = 111000` | FR-07/FR-08 — giá đơn hàng không do client quyết định | AI |  | **FAIL** (1/2 đỏ) |
| TC-CART-026 | State | bước 3: thêm **cùng sản phẩm** lần nữa (quantity 3) | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":3}` | 200 | 200 | spec §4.2 | AI |  | **Pass** (2/2) |
| TC-CART-027 | State | bước 4: **một sản phẩm chỉ một dòng** trong giỏ | `GET /api/cart` | user thường | – | 200 | `product_id` xuất hiện **1 dòng** duy nhất (số lượng được cộng dồn) | FR-07 — giỏ hàng là tập sản phẩm kèm số lượng, không phải log các lần bấm | AI |  | **FAIL** (1/2 đỏ) |
| TC-CART-028 | State | bước 5: **checkout** đơn hàng | `POST /api/checkout` | user thường | `{"total_amount":111000,"shipping_address":"123 Le Loi, Q1, TP.HCM"}` | 200 | 200 + `{message, orderId}` | spec §4.3 | AI |  | **Pass** (2/2) |
| TC-CART-029 | State | bước 6: sau checkout **giỏ phải rỗng** | `GET /api/cart` | user thường | – | 200 | mảng **rỗng** — hàng đã chuyển thành đơn | FR-07 + FR-08 (vòng đời giỏ → đơn); nếu giỏ còn nguyên thì lần checkout sau tạo đơn trùng | AI |  | **FAIL** (1/3 đỏ) |
| TC-CART-030 | State | bước 7: **cách ly giỏ** — giỏ của user2 không bị ảnh hưởng | `GET /api/cart` | user thứ hai | – | 200 | giỏ user2 **không** chứa `product_id` của user1 | FR-07 · SEC-02 (dữ liệu theo từng người dùng) | AI |  | **Pass** (3/3) |
| TC-CART-031 | Security SEC-02 | **không có** header `Authorization` | `POST /api/cart` | không có header | `{"id":1,"name":"x","price":1000,"quantity":1}` | 401 | 401 + `{error}` | SEC-02 · spec §4 (*Yêu cầu Header: Authorization*) | AI |  | **Pass** (2/2) |
| TC-CART-032 | Security SEC-02 | token **rác** (`abc.def.ghi`) | `POST /api/cart` | token rác | `{"id":1,"name":"x","price":1000,"quantity":1}` | 401/403 | 401/403 + `{error}` | SEC-02 | AI |  | **Pass** (2/2) |
| TC-CART-033 | Security SEC-02 | **thiếu tiền tố `Bearer`** | `POST /api/cart` | thiếu tiền tố Bearer | `{"id":1,"name":"x","price":1000,"quantity":1}` | 401/403 | 401/403 | SEC-02 · spec §2 (`Authorization: Bearer <token>`) | AI |  | **Pass** (1/1) |
| TC-CART-034 | Security SEC-02 | header `Authorization` **rỗng** | `POST /api/cart` | header rỗng | `{"id":1,"name":"x","price":1000,"quantity":1}` | 401/403 | 401/403 | SEC-02 | AI |  | **Pass** (1/1) |
| TC-CART-035 | Security SEC-05 | payload **SQLi** trong `name` | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"x'; DROP TABLE products--","price":111000,"quantity":1}` | 200/400 | không lỗi 500, không lộ chi tiết SQL | SEC-05 | AI |  | **Pass** (2/2) |
| TC-CART-036 | Security | **mass assignment** — gửi kèm field lạ `role` | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":1,"role":"admi` | 200/400 | field lạ **không** được lưu vào giỏ (kiểm ở TC-104) | SEC-06 (không cho client đặt field ngoài đặc tả) | AI |  | **Pass** (1/1) |
| TC-CART-037 | Schema | response của thêm giỏ đúng `{message: string}` | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":1}` | 200 | `{message: string}`, `Content-Type: application/json` | spec §4.2 | AI |  | **Pass** (4/4) |
| TC-CART-038 | Schema | `GET /api/cart` đúng schema giỏ hàng | `GET /api/cart` | user thường | – | 200 | mảng object `{id, name, price, quantity}` với `quantity ≥ 1` | spec §4.1 + §4.2 | AI |  | **FAIL** (1/3 đỏ) |
| TC-CART-039 | Schema | `GET /api/cart` **không token** → 401 | `GET /api/cart` | không có header | – | 401 | 401 + `{error}` | SEC-02 · spec §4 | AI |  | **Pass** (2/2) |
