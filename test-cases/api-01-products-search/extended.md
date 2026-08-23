# API-01 — Pool A · GET /api/products · bước 3 (§6.3): test case bổ sung ở LƯỢT HAI

- **7 case**, cột `Nguồn` = **AI-2**: do AI sinh ở **lượt thứ hai**, sau khi đọc `server.js` và
  dữ liệu fixture thật — khác lượt một chỉ đọc `api_specification.md`.

> **Đọc kỹ chỗ này — nó ảnh hưởng cách chấm §6.3.** Đề đòi *"Add at least five test cases of **your own**
> that the AI missed"*. Các case dưới đây **KHÔNG** phải do sinh viên tự nghĩ ra: chúng do AI sinh ở lượt hai.
> Chúng thoả phần *"mà AI (lượt một) bỏ sót"* và có bảng lý do bỏ sót, nhưng **không** thoả phần *"of your own"*.
> Ghi đúng như vậy ở đây thay vì dán nhãn `SV`: bản trước ghi `SV` và gọi là "sinh viên tự thêm" — đó là
> misattribution, và §11 phạt đúng loại đó. Case do sinh viên tự viết (nếu có) nằm ở `own.md`.

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PRODLIST-101 | Domain | tiếng Việt **chữ thường có dấu** — `áo` (cách người Việt gõ thật) | `GET /api/products` | không có header | `search=áo` | 200 | 1 dòng — **bằng** kết quả của `Áo` ở TC-006 | FR-05 *tìm kiếm theo tên*; TC-006 đã chứng minh SUT tự nhận là không phân biệt hoa/thường với ASCII | AI-2 | VALID | **FAIL** (1/3 đỏ) |
| TC-PRODLIST-102 | Domain | `%` nằm trong **dữ liệu hợp lệ** — `100%` | `GET /api/products` | không có header | `search=100%` | 200 | đúng **1** dòng (`Bàn phím 100% cơ`) — `%` phải được hiểu là ký tự, không phải wildcard | FR-05; `%` là ký tự hợp pháp trong tên sản phẩm | AI-2 | VALID | **Pass** (3/3) |
| TC-PRODLIST-103 | Domain | chỉ **một ký tự `%`** — không phải payload tấn công | `GET /api/products` | không có header | `search=%` | 200 | 0 dòng (không sản phẩm nào **tên** là `%`); **không** được trả toàn bộ bảng | FR-05 | AI-2 | VALID | **FAIL** (2/4 đỏ) |
| TC-PRODLIST-104 | Domain | **dấu nháy đơn trong dữ liệu hợp lệ** — `O'Brien` | `GET /api/products` | không có header | `search=O'Brien` | 200 | 1 dòng — đây là **tên riêng bình thường**, không phải tấn công | FR-05; SEC-05 (parameterized query xử lý được `'`) | AI-2 | VALID | **FAIL** (4/4 đỏ) |
| TC-PRODLIST-105 | Schema | **response lỗi** phải là JSON và không lộ chi tiết engine | `GET /api/products` | không có header | `search='` | 200 | `Content-Type: application/json`; body **không** chứa `SQLITE_ERROR` / `<h1>` | spec §3.1 (API trả JSON) · SEC-05 · nguyên tắc không rò rỉ thông tin nội bộ | AI-2 | VALID | **FAIL** (3/3 đỏ) |
| TC-PRODLIST-106 | Security SEC-05 | **hệ quả** của stacked query: bảng `products` phải còn nguyên | `GET /api/products` | không có header | – | 200 | số dòng = `total_products` (bảng không bị DROP sau TC-027) | SEC-05 — kiểm **tác động**, không chỉ status code | AI-2 | VALID | **Pass** (3/3) |
| TC-PRODLIST-107 | Schema | chi tiết **id chẵn** (id=2): `price` vẫn phải là number | `GET /api/products/2` | không có header | – | 200 | `price` là **number** — kiểu dữ liệu không được phụ thuộc tính chẵn/lẻ của `id` | spec §3.2 + §3.3 (`price: 100000` là số) | AI-2 | VALID | **FAIL** (2/4 đỏ) |

## Vì sao lượt một bỏ sót (§6.3)

| TC ID | AI bỏ sót gì | Nhóm lý do | Giải thích |
|---|---|---|---|
| TC-PRODLIST-101 | chỉ sinh case tiếng Việt **đúng hoa/thường** (`Áo`), không sinh biến thể chữ thường `áo` | **characteristics of the API** | `LIKE` của SQLite chỉ không phân biệt hoa/thường với **ASCII**; với ký tự Unicode có dấu thì phân biệt. Đặc điểm này nằm ở engine CSDL, không có trong spec — AI suy từ spec nên không thấy. |
| TC-PRODLIST-102 | coi `%` chỉ là payload tấn công, không nghĩ `%` là **ký tự hợp lệ trong tên sản phẩm** | **model limitations** | AI gắn `%` với ngữ cảnh SQL injection nên đặt nó vào nhóm security; bỏ mất phân vùng *dữ liệu hợp lệ chứa ký tự đặc biệt của LIKE*. Hai chuyện khác nhau: một cái là tấn công, một cái là khách hàng tìm 'bàn phím 100%'. |
| TC-PRODLIST-103 | không kiểm `search=%` một mình | **model limitations** | Cùng nguyên nhân với 102, và đây là case rẻ nhất để phát hiện wildcard injection: nếu trả toàn bộ bảng thì input đang được dùng như **pattern**, không phải như **giá trị**. |
| TC-PRODLIST-104 | chỉ sinh `'` dưới dạng payload SQLi, không sinh `'` trong **tên riêng hợp lệ** | **prompt quality** | Prompt yêu cầu *'security: SQL injection'* nên AI sinh payload tấn công. Không ai nói với nó rằng `O'Brien` là dữ liệu bình thường — mà chính case này mới cho thấy lỗi ảnh hưởng **người dùng thật**, không chỉ kẻ tấn công. |
| TC-PRODLIST-105 | không kiểm **response lỗi**: content-type và nội dung khi truy vấn thất bại | **prompt quality** | Prompt chỉ nói *'schema validation: response shape matches the spec'*, AI hiểu là response **thành công**. Đường lỗi là nơi rò rỉ thông tin nội bộ, và ở SUT này nó trả HTML kèm thông báo của SQLite. |
| TC-PRODLIST-106 | kiểm stacked query bằng status code, không kiểm **hệ quả** lên dữ liệu | **model limitations** | AI đánh giá test security qua status code. Một test SQLi chỉ có nghĩa nếu chứng minh được tác động — ở đây là bảng `products` còn nguyên sau `DROP TABLE`. |
| TC-PRODLIST-107 | không nghĩ tới việc kiểu dữ liệu phụ thuộc **tính chẵn/lẻ của `id`** | **characteristics of the API** | Không có đặc tả nào gợi ý điều này; nó nằm ở `server.js:161` (`if (row.id % 2 === 0) row.price = row.price.toString()`). Chỉ đọc source mới ra, và cũng là lý do bộ test phải kiểm **cả** id lẻ lẫn id chẵn. |
