# API-02 — Pool B · POST /api/cart · §6.3 — test case **do sinh viên chọn**

- **9 case** (đề đòi ≥5). Cột `Nguồn` = **SV**.
- **Phân công, ghi rõ để không nhận vơ:** *sinh viên* quyết định **kiểm gì** (chọn phạm vi từ các ô phủ
  còn trống — xem `npm run gaps`); *AI* định dạng thành bảng 12 cột, tra **căn cứ** từ spec/FR/SEC và
  viết assertion. Ghi nhận này cũng nằm trong `ai-audit/ai-audit-report.md`.
- Khác `extended.md`: các case ở đó do **AI** sinh ở lượt hai (`Nguồn = AI-2`), không tính vào §6.3.

## Bảng test case

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-CART-201 | State | bước 1: thêm sản phẩm vào giỏ với giá catalog hiện tại | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":1}` | 200 | 200 | spec §4.2 | SV | VALID | **Pass** (2/2) |
| TC-CART-202 | State | bước 2: **admin đổi giá sản phẩm** đó lên 222000 | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Cart-Fixture","price":222000,"description":"đổi giá","imageUrl":"","category` | 200 | 200 — giá trong catalog giờ là 222000 | spec §3.3 | SV | VALID | **Pass** (1/1) |
| TC-CART-203 | State | bước 3: **giá trong giỏ sau khi catalog đổi giá** | `GET /api/cart` | user thường | – | 200 | dòng của `product_id` **không được** giữ giá cũ 111000 — hoặc cập nhật 222000, hoặc giỏ phải báo giá đã thay đổi | FR-08 (tiền đơn hàng tính từ giỏ) — nếu giỏ giữ giá cũ thì khách trả giá cũ cho sản phẩm đã tăng giá | SV | VALID | **FAIL** (1/2 đỏ) |
| TC-CART-204 | Security SEC-04 | **XSS**: `name` chứa `<script>` khi thêm vào giỏ | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"<script>alert(1)</script>","price":222000,"quantity":1}` | 200 / 400 | từ chối, hoặc nhận rồi **escape** — hệ quả kiểm ở TC-205 | SEC-04 *dữ liệu người dùng khi hiển thị phải được escape* | SV | VALID | **Pass** (1/1) |
| TC-CART-205 | Security SEC-04 | **hệ quả** TC-204: giỏ không được chứa thẻ script nguyên văn | `GET /api/cart` | user thường | – | 200 | không dòng nào có `name` chứa `<script` | SEC-04 — payload phải là dữ liệu, không phải markup sống | SV | VALID | **FAIL** (1/2 đỏ) |
| TC-CART-206 | Security SEC-03 | **giỏ của admin** — admin thêm hàng, giỏ user không được thấy | `POST /api/cart` | admin | `{"id":"{{product_id}}","name":"HW06-Admin-Cart","price":222000,"quantity":9}` | 200 | 200 — admin có giỏ riêng theo `id` trong token | SEC-03 (phân biệt theo role/định danh) · spec §4.1 | SV | VALID | **Pass** (1/1) |
| TC-CART-207 | Security SEC-03 | **hệ quả** TC-206: giỏ user không chứa dòng admin vừa thêm | `GET /api/cart` | user thường | – | 200 | không dòng nào có `name = HW06-Admin-Cart` | SEC-03 · FR-07 (giỏ theo từng người dùng) | SV | VALID | **Pass** (2/2) |
| TC-CART-208 | Security SEC-02 | **token của user đã bị xoá** — bước 1: admin xoá user thứ hai | `DELETE /api/admin/users/{{user2_id}}` | admin | – | 200 | 200 — user2 bị xoá khỏi hệ thống | spec §6.1 *Xóa người dùng* | SV | VALID | **Pass** (1/1) |
| TC-CART-209 | Security SEC-02 | **hệ quả** TC-208: token cũ của user đã xoá còn dùng được không | `GET /api/cart` | user thứ hai | – | 401 / 403 | 401/403 — JWT của người dùng không còn tồn tại phải bị từ chối | SEC-02 *API bảo mật phải yêu cầu JWT **hợp lệ***; một token trỏ tới user đã bị xoá không còn hợp lệ | SV | VALID | **FAIL** (1/1 đỏ) |

## Vì sao AI bỏ sót (§6.3 — đúng 3 nhóm lý do)

| TC ID | AI bỏ sót gì | Nhóm lý do | Giải thích |
|---|---|---|---|
| TC-CART-201 | không sinh chuỗi **giá catalog đổi sau khi hàng đã vào giỏ** | **prompt quality** | Prompt khoanh state transition vào *một* endpoint. Chuỗi này đi qua **hai feature khác pool** (giỏ ở Pool B, sửa giá ở Pool C) nên không nằm trong phạm vi mà prompt vẽ ra. |
| TC-CART-202 | cùng chuỗi với 201 | **prompt quality** | AI không tự nối hai API của hai pool khác nhau thành một tình huống nghiệp vụ. |
| TC-CART-203 | không kiểm **giá trong giỏ có bị lệch catalog theo thời gian** | **characteristics of the API** | Giỏ ở SUT này lưu **bản chụp** (`push(req.body)`) chứ không tham chiếu `products`. Đặc điểm đó chỉ thấy khi đọc `server.js:290-295` và nghĩ tới trục thời gian: giá đúng lúc thêm, sai lúc thanh toán. |
| TC-CART-204 | không sinh case SEC-04 cho API-02 | **prompt quality** | Bảng phủ SEC của API-02 trống ở SEC-04 — prompt liệt kê SEC-01…07 nhưng AI chỉ sinh case cho những mã nó *thấy liên quan trực tiếp*, và bỏ SEC-04 vì cho rằng escape là việc của UI. |
| TC-CART-205 | cùng nhóm với 204 | **model limitations** | Lại là hệ quả: payload gửi được không có nghĩa gì nếu không đọc lại state. |
| TC-CART-206 | không sinh case SEC-03 cho API-02 | **prompt quality** | AI gán SEC-03 cho *endpoint admin*, mà `/api/cart` không phải endpoint admin — nên nó không hỏi *admin dùng endpoint của user thì sao*. |
| TC-CART-207 | cùng nhóm với 206 | **model limitations** | Phần chứng minh cách ly phải đọc giỏ bằng token khác, AI không tự thêm bước đó. |
| TC-CART-208 | không nghĩ tới **vòng đời của người dùng** ảnh hưởng tới token | **characteristics of the API** | JWT ở SUT này không có cơ chế thu hồi và `authenticateToken` chỉ verify chữ ký, không đối chiếu bảng `users` (`server.js:104-110`). Muốn đặt ra câu hỏi này phải đọc middleware, không suy từ spec. |
| TC-CART-209 | cùng chuỗi với 208 | **characteristics of the API** | Đây là chỗ đáng chú ý: token của một người dùng **đã bị xoá** vẫn mở được giỏ — sinh viên đặt câu hỏi từ góc *nghiệp vụ*, không từ góc *tham số*. |
