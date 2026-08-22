# API-02 — Pool B · POST /api/cart · bước 3 (§6.3): test case sinh viên tự thêm

- **7 case** (đề đòi ≥5).

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-CART-101 | Security | **price tampering**: gửi giá 1 đồng cho sản phẩm 111.000 | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":1,"quantity":1}` | 400/422 | từ chối; nếu nhận thì TC-102 phải chứng minh giá bị ghi đè | FR-07/FR-08 — client không được quyết định giá | SV | VALID | **FAIL** (1/1 đỏ) |
| TC-CART-102 | Security | **hệ quả** của price tampering: giỏ không được chứa giá 1 đồng | `GET /api/cart` | user thường | – | 200 | không dòng nào của `product_id` có `price ≠ 111000` | FR-08 — kiểm **tác động**, không chỉ status code | SV | VALID | **FAIL** (1/2 đỏ) |
| TC-CART-103 | State | **checkout lần hai** ngay sau lần một — không được tạo đơn trùng | `POST /api/checkout` | user thường | `{"total_amount":111000,"shipping_address":"123 Le Loi, Q1, TP.HCM"}` | 400/409 | từ chối vì giỏ đã rỗng sau lần checkout đầu | FR-07 + FR-08 — giỏ rỗng thì không có gì để đặt | SV | VALID | **FAIL** (1/1 đỏ) |
| TC-CART-104 | Security | **hệ quả** của mass assignment: giỏ không được chứa field lạ | `GET /api/cart` | user thường | – | 200 | không dòng nào có field `role` / `isAdmin` | SEC-06 — field ngoài đặc tả không được đi vào state phía server | SV | VALID | **FAIL** (1/2 đỏ) |
| TC-CART-105 | Domain | thêm sản phẩm **đã bị xoá khỏi catalog** (bước 1: xoá) | `DELETE /api/products/{{product_id}}` | admin | – | 200 | 200 — sản phẩm biến mất khỏi catalog | spec §3.3 | SV | VALID | **Pass** (1/1) |
| TC-CART-106 | Domain | bước 2: thêm sản phẩm **vừa bị xoá** vào giỏ | `POST /api/cart` | user thường | `{"id":"{{product_id}}","name":"HW06-Cart-Fixture","price":111000,"quantity":1}` | 400/404 | từ chối — sản phẩm không còn tồn tại | FR-07 (giỏ chỉ chứa sản phẩm đang bán) | SV | VALID | **FAIL** (1/1 đỏ) |
| TC-CART-107 | Schema | **bất biến trạng thái giỏ** sau toàn bộ input sai ở trên | `GET /api/cart` | user thường | – | 200 | không dòng nào có `quantity ≤ 0`, `name` rỗng/thiếu, hoặc `price` thiếu — **bất kể** SUT chọn cách từ chối hay cách lấy dữ liệu từ catalog | FR-07 — trạng thái giỏ phải luôn hợp lệ, kể cả sau khi bị bơm input sai | SV | VALID | **FAIL** (1/2 đỏ) |

## Vì sao AI bỏ sót (§6.3)

| TC ID | AI bỏ sót gì | Nhóm lý do | Giải thích |
|---|---|---|---|
| TC-CART-101 | sinh case `price` sai kiểu / âm, nhưng **không** sinh case giá hợp lệ nhưng **sai so với catalog** | **prompt quality** | Prompt nói *'domain partitions on every parameter'* nên AI phân hoạch theo **kiểu và biên** của từng field. `price = 1` là số dương hợp lệ — nó chỉ sai khi **so với dữ liệu khác** (giá trong bảng `products`). Phân hoạch một tham số độc lập không bao giờ tìm ra loại lỗi này. |
| TC-CART-102 | không kiểm **hệ quả** trong state phía server sau khi gửi giá sai | **model limitations** | AI kết thúc case ở status code. Nhưng SUT trả 200 cho mọi input, nên status code không phân biệt được 'đã validate' với 'nhận bừa' — chỉ đọc lại `GET /api/cart` mới thấy giá 1 đồng nằm trong giỏ. |
| TC-CART-103 | không nghĩ tới **checkout hai lần liên tiếp** | **characteristics of the API** | Đặc điểm riêng của SUT: `POST /api/checkout` chỉ `INSERT` vào `orders` mà không xoá giỏ (`server.js:297-309`), nên giỏ sống sót qua checkout. Không có gì trong spec gợi ý điều này; phải nhìn chuỗi trạng thái giỏ→đơn mới đặt ra câu hỏi. |
| TC-CART-104 | gửi field lạ nhưng không kiểm nó có **được lưu** không | **model limitations** | Cùng họ với 102: AI coi mass assignment là 'gửi field lạ xem có 400 không'. Rủi ro thật là field lạ **đi vào state**; ở đây `push(req.body)` lưu nguyên object nên `role: 'admin'` nằm luôn trong giỏ. |
| TC-CART-105 | không sinh chuỗi **xoá sản phẩm rồi thêm vào giỏ** | **prompt quality** | Prompt tách 'state transitions' thành trạng thái của **đơn hàng** (FR-10 pending→confirmed→…). Không ai nói rằng *catalog* cũng có trạng thái, và sản phẩm bị xoá là một trạng thái hợp lệ của nó. |
| TC-CART-106 | cùng chuỗi với 105 | **prompt quality** | Case này chỉ tồn tại nếu đã nghĩ ra 105. Nó cũng cho thấy ràng buộc *'giỏ chỉ chứa sản phẩm đang bán'* của FR-07 không được kiểm ở bất kỳ đâu trong SUT. |
| TC-CART-107 | không có case kiểm **bất biến của trạng thái giỏ** sau khi bị bơm input sai | **model limitations** | AI viết test theo từng request. Câu hỏi 'sau tất cả những input rác đó, trạng thái giỏ có còn hợp lệ không' là câu hỏi ở mức **hệ thống**, và nó bắt được đúng thứ mà 9 case quantity riêng lẻ chỉ gợi ý. |
