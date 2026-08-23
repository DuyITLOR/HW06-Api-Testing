# Test Summary — sinh tự động từ raw JSON của Newman

> **Đừng sửa tay.** Sinh lại bằng `npm run summary`. Nguồn: `reports/newman/*.json`.
> Mỗi api-slug lấy **lượt mới nhất**. Assertion đỏ ở đây là **kết quả mong đợi** khi test case bắt được bug thật.


| API | Lượt chạy (UTC) | Iteration | Request | Assertion | Passed | **Failed** | Thời lượng |
|---|---|---|---|---|---|---|---|
| API-01 · Pool A · GET /api/products | 2026-08-23T10:51:00.632Z | 1 | 67 | 170 | 141 | **29** | 0.9s |
| API-02 · Pool B · POST /api/cart | 2026-08-23T10:51:03.237Z | 1 | 61 | 99 | 68 | **31** | 0.9s |
| API-03 · Pool C · PUT /api/products/:id | 2026-08-23T10:51:06.445Z | 1 | 64 | 103 | 70 | **33** | 0.9s |
| **Tổng** | | | **192** | **372** | **279** | **93** | **2.7s** |

## Assertion đỏ theo từng API

> Mỗi dòng phải map được sang một bug trong `bug-report/bug-report.md`, hoặc được giải thích
> là test case của mình viết sai. Không để dòng nào không có kết luận.

### API-01 · Pool A · GET /api/products
Raw: `reports/newman/23127178_api-01-products-search_20260823-175059.json`

| Request | Test | Thông báo |
|---|---|---|
| TC-PRODLIST-023 · bước 5: xem chi tiết sản phẩm **đã xoá** | status = 404 | expected response to have status code 404 but got 200 |
| TC-PRODLIST-023 · bước 5: xem chi tiết sản phẩm **đã xoá** | body lỗi đúng schema {error: string} | expected data to satisfy schema but found following errors:  data should have required property 'error' |
| TC-PRODLIST-024 · SQLi **tautology** — %' OR '1'='1 | trả về đúng 0 dòng | expected 11 to deeply equal +0 |
| TC-PRODLIST-024 · SQLi **tautology** — %' OR '1'='1 | số dòng NHỎ HƠN {{total_products}} (payload không được trả về toàn bộ bảng) | expected 11 to be below 11 |
| TC-PRODLIST-025 · SQLi **comment** — ' OR 1=1-- | trả về đúng 0 dòng | expected 11 to deeply equal +0 |
| TC-PRODLIST-025 · SQLi **comment** — ' OR 1=1-- | số dòng NHỎ HƠN {{total_products}} (payload không được trả về toàn bộ bảng) | expected 11 to be below 11 |
| TC-PRODLIST-026 · SQLi **UNION** — dò số cột | status = 200 | expected response to have status code 200 but got 500 |
| TC-PRODLIST-026 · SQLi **UNION** — dò số cột | Content-Type là application/json | expected 'text/html; charset=utf-8' to include 'application/json' |
| TC-PRODLIST-026 · SQLi **UNION** — dò số cột | body là mảng JSON | Unexpected token '<' at 1:1 <h1>Database Error</h1><p>SQLITE_ERROR: SELECTs to the left and right of UNION  ^ |
| TC-PRODLIST-026 · SQLi **UNION** — dò số cột | trả về đúng 0 dòng | Unexpected token '<' at 1:1 <h1>Database Error</h1><p>SQLITE_ERROR: SELECTs to the left and right of UNION  ^ |
| TC-PRODLIST-026 · SQLi **UNION** — dò số cột | body không được chứa "SQLITE" | expected '<h1>Database Error</h1><p>SQLITE_ERRO…' to not include 'SQLITE' |
| TC-PRODLIST-027 · SQLi **stacked query** — '; DROP TABLE products-- | trả về đúng 0 dòng | expected 11 to deeply equal +0 |
| TC-PRODLIST-033 · chi tiết: id **không tồn tại** (999999) | status = 404 | expected response to have status code 404 but got 200 |
| TC-PRODLIST-033 · chi tiết: id **không tồn tại** (999999) | body lỗi đúng schema {error: string} | expected data to satisfy schema but found following errors:  data should have required property 'error' |
| TC-PRODLIST-034 · chi tiết: id **sai kiểu** (abc) | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-PRODLIST-035 · chi tiết: id **âm** (-1) | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-PRODLIST-036 · chi tiết: id = 0 (biên dưới - 1) | status = 404 | expected response to have status code 404 but got 200 |
| TC-PRODLIST-101 · tiếng Việt **chữ thường có dấu** — áo (cách người Việt gõ thật) | trả về đúng 1 dòng | expected +0 to deeply equal 1 |
| TC-PRODLIST-103 · chỉ **một ký tự %** — không phải payload tấn công | trả về đúng 0 dòng | expected 11 to deeply equal +0 |
| TC-PRODLIST-103 · chỉ **một ký tự %** — không phải payload tấn công | số dòng NHỎ HƠN {{total_products}} (payload không được trả về toàn bộ bảng) | expected 11 to be below 11 |
| TC-PRODLIST-104 · **dấu nháy đơn trong dữ liệu hợp lệ** — O'Brien | status = 200 | expected response to have status code 200 but got 500 |
| TC-PRODLIST-104 · **dấu nháy đơn trong dữ liệu hợp lệ** — O'Brien | Content-Type là application/json | expected 'text/html; charset=utf-8' to include 'application/json' |
| TC-PRODLIST-104 · **dấu nháy đơn trong dữ liệu hợp lệ** — O'Brien | body là mảng JSON | Unexpected token '<' at 1:1 <h1>Database Error</h1><p>SQLITE_ERROR: near "Brien": syntax error</p> ^ |
| TC-PRODLIST-104 · **dấu nháy đơn trong dữ liệu hợp lệ** — O'Brien | trả về đúng 1 dòng | Unexpected token '<' at 1:1 <h1>Database Error</h1><p>SQLITE_ERROR: near "Brien": syntax error</p> ^ |
| TC-PRODLIST-105 · **response lỗi** phải là JSON và không lộ chi tiết engine | Content-Type là application/json | expected 'text/html; charset=utf-8' to include 'application/json' |
| TC-PRODLIST-105 · **response lỗi** phải là JSON và không lộ chi tiết engine | body không được chứa "SQLITE_ERROR" | expected '<h1>Database Error</h1><p>SQLITE_ERRO…' to not include 'SQLITE_ERROR' |
| TC-PRODLIST-105 · **response lỗi** phải là JSON và không lộ chi tiết engine | body không được chứa "<h1>" | expected '<h1>Database Error</h1><p>SQLITE_ERRO…' to not include '<h1>' |
| TC-PRODLIST-107 · chi tiết **id chẵn** (id=2): price vẫn phải là number | price phải là number | expected '28000000' to be a number |
| TC-PRODLIST-107 · chi tiết **id chẵn** (id=2): price vẫn phải là number | object đúng schema product (spec §3.1) | expected data to satisfy schema but found following errors:  data.price should be number |

### API-02 · Pool B · POST /api/cart
Raw: `reports/newman/23127178_api-02-cart-add_20260823-175102.json`

| Request | Test | Thông báo |
|---|---|---|
| TC-CART-003 · quantity = 0 — **biên dưới − 1** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-004 · quantity = -5 — **số âm** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-005 · quantity = 1.5 — **số thập phân** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-006 · quantity = "abc" — **sai kiểu** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-007 · **thiếu** quantity | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-008 · quantity = 999999 — **vượt tồn kho** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-009 · quantity = null | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-010 · id **không tồn tại** (999999) | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-CART-011 · id = 0 — biên dưới − 1 | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-CART-012 · id = -1 — số âm | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-CART-013 · id = "abc" — sai kiểu | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-014 · **thiếu** id | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-015 · **body rỗng** {} | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-017 · price = 0 | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-018 · price = -1000 — âm | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-019 · price = "abc" — sai kiểu | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-022 · name **không khớp** sản phẩm thật | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-023 · name **rất dài** (300 ký tự) | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-025 · bước 2: **giá trong giỏ phải bằng giá catalog** | mọi dòng của product_id đều có giá đúng catalog | giá bị client sửa: expected +0 to deeply equal 111000 |
| TC-CART-027 · bước 4: **một sản phẩm chỉ một dòng** trong giỏ | product_id chỉ có 1 dòng trong giỏ | giỏ có 18 dòng trùng sản phẩm: expected 18 to deeply equal 1 |
| TC-CART-029 · bước 6: sau checkout **giỏ phải rỗng** | trả về đúng 0 dòng | expected 25 to deeply equal +0 |
| TC-CART-038 · GET /api/cart đúng schema giỏ hàng | giỏ hàng đúng schema (spec §4.2) | expected data to satisfy schema but found following errors:  data[1].id should be integer, data[2].id should be integer, data[3].id should be integer, data[3].q |
| TC-CART-101 · **price tampering**: gửi giá 1 đồng cho sản phẩm 111.000 | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-CART-102 · **hệ quả** của price tampering: giỏ không được chứa giá 1 đồng | không có dòng nào bị sửa giá | có 5 dòng giá sai: [{"id":"6","name":"HW06-Cart-Fixture","price":0,"quantity":1},{"id":"6","name":"HW06-Cart-Fixture","price":-1000,"quantity":1},{"id":"6","nam |
| TC-CART-103 · **checkout lần hai** ngay sau lần một — không được tạo đơn trùng | status thuộc [400,409,422] | expected [ 400, 409, 422 ] to include 200 |
| TC-CART-104 · **hệ quả** của mass assignment: giỏ không được chứa field lạ | không dòng nào có field lạ role/isAdmin | có 1 dòng mang field lạ: expected 1 to deeply equal +0 |
| TC-CART-106 · bước 2: thêm sản phẩm **vừa bị xoá** vào giỏ | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-CART-107 · **bất biến trạng thái giỏ** sau toàn bộ input sai ở trên | không dòng nào có quantity <= 0 | có 6 dòng quantity không hợp lệ: [{"id":"6","name":"HW06-Cart-Fixture","price":111000,"quantity":0},{"id":"6","name":"HW06-Cart-Fixture","price":111000,"quantit |
| TC-CART-107 · **bất biến trạng thái giỏ** sau toàn bộ input sai ở trên | không dòng nào có name rỗng hoặc thiếu (hệ quả TC-021) | có 2 dòng không có tên: [{},{"id":"6","name":"","price":111000,"quantity":1}]: expected 2 to deeply equal +0 |
| TC-CART-107 · **bất biến trạng thái giỏ** sau toàn bộ input sai ở trên | không dòng nào thiếu price (hệ quả TC-020) | có 2 dòng không có giá: [{},{"id":"6","name":"HW06-Cart-Fixture","quantity":1}]: expected 2 to deeply equal +0 |
| TC-CART-209 · **hệ quả** TC-208: token cũ của user đã xoá còn dùng được không | status thuộc [401,403] | expected [ 401, 403 ] to include 200 |

### API-03 · Pool C · PUT /api/products/:id
Raw: `reports/newman/23127178_api-03-product-update_20260823-175105.json`

| Request | Test | Thông báo |
|---|---|---|
| TC-PRODUPD-003 · name **rỗng** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-004 · name **chỉ khoảng trắng** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-009 · price = 0 — **biên** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-010 · price = -1 — **số âm** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-011 · price = "abc" — **sai kiểu** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-012 · price = null | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-014 · **verify** TC-013: giá đọc lại phải khớp giá đã gửi | giá không bị làm tròn khi lưu | expected '9007199254740992' to deeply equal '9007199254740993' |
| TC-PRODUPD-016 · category_id = 999999 — **không tồn tại** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-017 · category_id = "abc" — sai kiểu | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-018 · category_id = -1 | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-020 · :id **không tồn tại** (999999) | status = 404 | expected response to have status code 404 but got 200 |
| TC-PRODUPD-020 · :id **không tồn tại** (999999) | body lỗi đúng schema {error: string} | expected data to satisfy schema but found following errors:  data should have required property 'error' |
| TC-PRODUPD-021 · :id = abc — **sai kiểu** | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-PRODUPD-022 · :id = 0 — biên dưới − 1 | status = 404 | expected response to have status code 404 but got 200 |
| TC-PRODUPD-023 · :id = -1 — số âm | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-PRODUPD-024 · :id chứa payload **SQLi** | status thuộc [400,404] | expected [ 400, 404 ] to include 200 |
| TC-PRODUPD-029 · bước 4: cập nhật sản phẩm **đã bị xoá** | status = 404 | expected response to have status code 404 but got 200 |
| TC-PRODUPD-031 · **không có** header Authorization | status = 401 | expected response to have status code 401 but got 200 |
| TC-PRODUPD-031 · **không có** header Authorization | body lỗi đúng schema {error: string} | expected data to satisfy schema but found following errors:  data should have required property 'error' |
| TC-PRODUPD-032 · token **user thường** — role escalation | status = 403 | expected response to have status code 403 but got 200 |
| TC-PRODUPD-032 · token **user thường** — role escalation | body lỗi đúng schema {error: string} | expected data to satisfy schema but found following errors:  data should have required property 'error' |
| TC-PRODUPD-033 · token **rác** | status thuộc [401,403] | expected [ 401, 403 ] to include 200 |
| TC-PRODUPD-034 · **thiếu tiền tố Bearer** | status thuộc [401,403] | expected [ 401, 403 ] to include 200 |
| TC-PRODUPD-102 · **hệ quả** của PUT bằng token user thường | status = 403 | expected response to have status code 403 but got 200 |
| TC-PRODUPD-103 · **verify**: user thường có sửa được dữ liệu thật không | user thường không được sửa sản phẩm | user role=user đã sửa được sản phẩm của admin: expected 'HW06-EscalationProof' to not deeply equal 'HW06-EscalationProof' |
| TC-PRODUPD-105 · **verify** TC-104: các field khác không bị ghi NULL | price không được null | expected null not to be null |
| TC-PRODUPD-105 · **verify** TC-104: các field khác không bị ghi NULL | description không được null | expected null not to be null |
| TC-PRODUPD-105 · **verify** TC-104: các field khác không bị ghi NULL | category_id không được null | expected null not to be null |
| TC-PRODUPD-107 · **route lân cận**: POST /api/products cũng không đòi token? | status = 401 | expected response to have status code 401 but got 200 |
| TC-PRODUPD-108 · **route lân cận**: DELETE /api/products/:id không đòi token? | status thuộc [401,403,404] | expected [ 401, 403, 404 ] to include 200 |
| TC-PRODUPD-202 · **hệ quả** TC-201: imageUrl có bị lưu nguyên javascript: | imageUrl không được là javascript: URL | expected 'javascript:alert(1)' to not include 'javascript:' |
| TC-PRODUPD-205 · bước 3: PUT sản phẩm trỏ vào **danh mục đã xoá** | status thuộc [400,422] | expected [ 400, 422 ] to include 200 |
| TC-PRODUPD-206 · **hệ quả** TC-205: sản phẩm có bị gắn danh mục không tồn tại | category_id không trỏ danh mục đã bị xoá | expected '4' to not deeply equal '4' |
