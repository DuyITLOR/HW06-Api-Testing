# API-03 — Pool C · PUT /api/products/:id · bước 1 (§6.1): test case do AI sinh

- **Pool C · FR-15 Product management (admin)** · prefix `TC-PRODUPD-###` · **39 test case** (đề đòi ≥35 tính cả case tự thêm)
- Sinh bằng `node tools/gen-artifacts.mjs api-03-product-update` từ `generator/specs/api-03-product-update.mjs` — **đừng sửa file này bằng tay**, sửa spec rồi sinh lại.
- Quy trình 5 bước của `/api-test-design`; mỗi bước một lượt AI riêng, ghi trong `ai-audit/ai-audit-report.md`.

## Phân bố theo kỹ thuật

| Kỹ thuật | Số case |
|---|---|
| Domain | 19 |
| State | 6 |
| Security | 9 |
| Schema | 5 |
| **Tổng** | **39** |

## Bảng test case

> Cột `Kết quả` điền **tự động** từ `reports/newman/*.json` (lượt `23127178_api-03-product-update_20260822-221740.json`).

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PRODUPD-001 | Domain | cập nhật **hợp lệ đầy đủ 5 field** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd-Valid","price":250000,"description":"d","imageUrl":"http://x/i.png","cat` | 200 | 200 + `{message}` | spec §3.3 | AI |  | **Pass** (3/3) |
| TC-PRODUPD-002 | State | **verify** TC-001: đọc lại thấy giá trị mới | `GET /api/products/{{product_id}}` | không có header | – | 200 | `name = HW06-Upd-Valid`, `price = 250000` | spec §3.2 + §3.3 | AI |  | **Pass** (3/3) |
| TC-PRODUPD-003 | Domain | `name` **rỗng** | `PUT /api/products/{{product_id}}` | admin | `{"name":"","price":200000,"description":"d","imageUrl":"http://x/i.png","category_id":1}` | 400/422 | từ chối — sản phẩm phải có tên | FR-15 · spec §3.3 (body mẫu có `name`) | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-004 | Domain | `name` **chỉ khoảng trắng** | `PUT /api/products/{{product_id}}` | admin | `{"name":"   ","price":200000,"description":"d","imageUrl":"http://x/i.png","category_id":1` | 400/422 | từ chối | FR-15 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-005 | Domain | `name` **rất dài** (300 ký tự) | `PUT /api/products/{{product_id}}` | admin | `{"name":"LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL` | 200 hoặc 400 | hoặc chấp nhận (spec không giới hạn), hoặc 400 — **không** 500 | spec §3.3 **im lặng** về độ dài tối đa | AI |  | **Pass** (2/2) |
| TC-PRODUPD-006 | Security SEC-04 | `name` chứa payload **XSS** | `PUT /api/products/{{product_id}}` | admin | `{"name":"<script>alert(1)</script>","price":200000,"description":"d","imageUrl":"http://x/` | 200/400 | không 500; nếu lưu thì phải trả về dạng **dữ liệu JSON** (kiểm ở TC-007) | SEC-04 | AI |  | **Pass** (1/1) |
| TC-PRODUPD-007 | Schema | **verify** TC-006: response là JSON, không phải HTML | `GET /api/products/{{product_id}}` | không có header | – | 200 | `Content-Type: application/json`; payload nằm trong field JSON | SEC-04 + spec §3.2 | AI |  | **Pass** (3/3) |
| TC-PRODUPD-008 | Domain | `price = 1` — **biên dưới hợp lệ** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":1,"description":"d","imageUrl":"http://x/i.png","category_id":1` | 200 | 200 | FR-15 · đề §6.1 nêu ví dụ ràng buộc `price > 0` | AI |  | **Pass** (2/2) |
| TC-PRODUPD-009 | Domain | `price = 0` — **biên** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":0,"description":"d","imageUrl":"http://x/i.png","category_id":1` | 400/422 | từ chối — giá phải > 0 | đề §6.1 (`price > 0`) · FR-15 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-010 | Domain | `price = -1` — **số âm** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":-1,"description":"d","imageUrl":"http://x/i.png","category_id":` | 400/422 | từ chối | đề §6.1 · FR-15 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-011 | Domain | `price = "abc"` — **sai kiểu** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":"abc","description":"d","imageUrl":"http://x/i.png","category_i` | 400/422 | từ chối | spec §3.3 (`price: 100000` là số) | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-012 | Domain | `price = null` | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":null,"description":"d","imageUrl":"http://x/i.png","category_id` | 400/422 | từ chối | spec §3.3 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-013 | Domain | `price` **rất lớn** (9007199254740993 > 2^53) | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":9007199254740992,"description":"d","imageUrl":"http://x/i.png",` | 200 hoặc 400 | hoặc từ chối, hoặc lưu **đúng** giá trị — không được lặng lẽ làm tròn | FR-15 (không mất dữ liệu tiền tệ) | AI |  | **Pass** (1/1) |
| TC-PRODUPD-014 | Schema | **verify** TC-013: giá đọc lại phải khớp giá đã gửi | `GET /api/products/{{product_id}}` | không có header | – | 200 | `price = 9007199254740993` (nếu TC-013 trả 200) | FR-15 | AI |  | **FAIL** (1/2 đỏ) |
| TC-PRODUPD-015 | Domain | `category_id = 1` — **tồn tại** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":300000,"description":"d","imageUrl":"http://x/i.png","category_` | 200 | 200 | spec §3.4 | AI |  | **Pass** (2/2) |
| TC-PRODUPD-016 | Domain | `category_id = 999999` — **không tồn tại** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"http://x/i.png","category_` | 400/422 | từ chối — khoá ngoại không hợp lệ | spec §3.4 + FR-14 (danh mục phải tồn tại) | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-017 | Domain | `category_id = "abc"` — sai kiểu | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"http://x/i.png","category_` | 400/422 | từ chối | spec §3.3 (`category_id: 1` là số) | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-018 | Domain | `category_id = -1` | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"http://x/i.png","category_` | 400/422 | từ chối | spec §3.4 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-019 | Domain | `imageUrl` **không phải URL** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"not-a-url","category_id":1` | 200 hoặc 400 | không 500; nếu chấp nhận thì đọc lại đúng nguyên văn | spec §3.3 (`imageUrl: "http://..."`) **im lặng** về validate URL | AI |  | **Pass** (2/2) |
| TC-PRODUPD-020 | Domain | `:id` **không tồn tại** (999999) | `PUT /api/products/999999` | admin | `{"name":"HW06-Ghost","price":200000,"description":"d","imageUrl":"http://x/i.png","categor` | 404 | 404 + `{error}` — không có gì để cập nhật | spec §3.3 (*Cập nhật* một sản phẩm đang tồn tại) | AI |  | **FAIL** (2/2 đỏ) |
| TC-PRODUPD-021 | Domain | `:id = abc` — **sai kiểu** | `PUT /api/products/abc` | admin | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"http://x/i.png","category_` | 400/404 | 400/404 | spec §3.3 (`:id` là số) | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-022 | Domain | `:id = 0` — biên dưới − 1 | `PUT /api/products/0` | admin | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"http://x/i.png","category_` | 404 | 404 | spec §3.3 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-023 | Domain | `:id = -1` — số âm | `PUT /api/products/-1` | admin | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"http://x/i.png","category_` | 400/404 | 400/404 | spec §3.3 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-024 | Security SEC-05 | `:id` chứa payload **SQLi** | `PUT /api/products/1%20OR%201=1` | admin | `{"name":"HW06-SQLi-Id","price":200000,"description":"d","imageUrl":"http://x/i.png","categ` | 400/404 | 400/404, **không** cập nhật hàng loạt | SEC-05 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-025 | Security SEC-05 | **verify** TC-024: không sản phẩm nào bị đổi tên hàng loạt | `GET /api/products` | không có header | – | 200 | ≤ 1 sản phẩm có tên `HW06-SQLi-Id` | SEC-05 — kiểm tác động | AI |  | **Pass** (2/2) |
| TC-PRODUPD-026 | State | bước 1: đặt trạng thái biết trước | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-State-Base","price":500000,"description":"desc-base","imageUrl":"http://x/ba` | 200 | 200 | spec §3.3 | AI |  | **Pass** (2/2) |
| TC-PRODUPD-027 | State | bước 2: xác nhận trạng thái nền | `GET /api/products/{{product_id}}` | không có header | – | 200 | 5 field đúng giá trị vừa đặt | spec §3.2 | AI |  | **Pass** (4/4) |
| TC-PRODUPD-028 | State | bước 3: **xoá** sản phẩm | `DELETE /api/products/{{product_id_even}}` | admin | – | 200 | 200 (xoá fixture id chẵn — chuẩn bị cho TC-029) | spec §3.3 | AI |  | **Pass** (2/2) |
| TC-PRODUPD-029 | State | bước 4: cập nhật sản phẩm **đã bị xoá** | `PUT /api/products/{{product_id_even}}` | admin | `{"name":"HW06-Zombie","price":200000,"description":"d","imageUrl":"http://x/i.png","catego` | 404 | 404 — không hồi sinh được sản phẩm đã xoá | spec §3.3 + §3.2 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-030 | State | bước 5: sản phẩm đã xoá **không** được xuất hiện lại trong danh sách | `GET /api/products` | không có header | – | 200 | không có sản phẩm tên `HW06-Zombie` | spec §3.1 + §3.3 | AI |  | **Pass** (2/2) |
| TC-PRODUPD-031 | Security SEC-02 | **không có** header `Authorization` | `PUT /api/products/{{product_id}}` | không có header | `{"name":"HW06-NoAuth-Attempt","price":999,"description":"d","imageUrl":"http://x/i.png","c` | 401 | 401 + `{error}` — endpoint dành cho Admin | **SEC-02** · spec §3.3 *(Dành cho Admin)* | AI |  | **FAIL** (2/2 đỏ) |
| TC-PRODUPD-032 | Security SEC-03 | token **user thường** — role escalation | `PUT /api/products/{{product_id}}` | user thường | `{"name":"HW06-UserToken-Attempt","price":888,"description":"d","imageUrl":"http://x/i.png"` | 403 | 403 — phải kiểm `role='admin'`, không chỉ kiểm có token | **SEC-03** · spec §3.3 | AI |  | **FAIL** (2/2 đỏ) |
| TC-PRODUPD-033 | Security SEC-02 | token **rác** | `PUT /api/products/{{product_id}}` | token rác | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"http://x/i.png","category_` | 401/403 | 401/403 | SEC-02 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-034 | Security SEC-02 | **thiếu tiền tố `Bearer`** | `PUT /api/products/{{product_id}}` | thiếu tiền tố Bearer | `{"name":"HW06-Upd","price":200000,"description":"d","imageUrl":"http://x/i.png","category_` | 401/403 | 401/403 | SEC-02 · spec §2 | AI |  | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-035 | Security SEC-06 | **mass assignment**: gửi kèm `id` và `role` trong body | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-MassAssign","price":200000,"description":"d","imageUrl":"http://x/i.png","ca` | 200/400 | không 500; `:id` trong URL là nguồn duy nhất xác định hàng cần sửa | SEC-06 | AI |  | **Pass** (1/1) |
| TC-PRODUPD-036 | Security SEC-06 | **verify** TC-035: sản phẩm `id=1` (dữ liệu seed) **không** bị sửa | `GET /api/products/1` | không có header | – | 200 | `name ≠ HW06-MassAssign` | SEC-06 — `id` trong body không được ghi đè `:id` trong URL | AI |  | **Pass** (2/2) |
| TC-PRODUPD-037 | Schema | response cập nhật đúng `{message: string}` | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Schema-Check","price":123456,"description":"d","imageUrl":"http://x/i.png","` | 200 | `{message: string}` + `Content-Type: application/json` | spec §3.3 | AI |  | **Pass** (3/3) |
| TC-PRODUPD-038 | Schema | sau cập nhật, `GET` trả object đúng schema product | `GET /api/products/{{product_id}}` | không có header | – | 200 | `id` integer, `name` string, `price` **number** | spec §3.2 + §3.3 | AI |  | **Pass** (3/3) |
| TC-PRODUPD-039 | Schema | response **không** được lộ field nội bộ | `GET /api/products/{{product_id}}` | không có header | – | 200 | không có field ngoài tập của spec | spec §3.2 | AI |  | **Pass** (2/2) |
