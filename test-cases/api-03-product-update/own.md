# API-03 — Pool C · PUT /api/products/:id · §6.3 — test case **do sinh viên chọn**

- **7 case** (đề đòi ≥5). Cột `Nguồn` = **SV**.
- **Phân công, ghi rõ để không nhận vơ:** *sinh viên* quyết định **kiểm gì** (chọn phạm vi từ các ô phủ
  còn trống — xem `npm run gaps`); *AI* định dạng thành bảng 12 cột, tra **căn cứ** từ spec/FR/SEC và
  viết assertion. Ghi nhận này cũng nằm trong `ai-audit/ai-audit-report.md`.
- Khác `extended.md`: các case ở đó do **AI** sinh ở lượt hai (`Nguồn = AI-2`), không tính vào §6.3.

## Bảng test case

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PRODUPD-201 | Security SEC-04 | `imageUrl` là **`javascript:` URL** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-JsUrl","price":200000,"description":"d","imageUrl":"javascript:alert(1)","ca` | 200 / 400 | từ chối (400), hoặc nhận nhưng phải chặn ở tầng hiển thị — hệ quả kiểm ở TC-202 | SEC-04 · spec §3.3 nêu `imageUrl` là URL dạng `http://...` | SV | VALID | **Pass** (1/1) |
| TC-PRODUPD-202 | Security SEC-04 | **hệ quả** TC-201: `imageUrl` có bị lưu nguyên `javascript:` | `GET /api/products/{{product_id}}` | không có header | – | 200 | `imageUrl` **không** bắt đầu bằng `javascript:` — một URL như vậy đi thẳng vào `src`/`href` của frontend là XSS | SEC-04 · spec §3.3 | SV | VALID | **FAIL** (1/2 đỏ) |
| TC-PRODUPD-203 | State | **category_id trỏ danh mục đã xoá** — bước 1: tạo danh mục tạm | `POST /api/categories` | admin | `{"name":"HW06-Temp-Category"}` | 200 | 200 + `{id}` — lưu `temp_category_id` | spec §3.4 | SV | VALID | **Pass** (1/1) |
| TC-PRODUPD-204 | State | bước 2: xoá danh mục vừa tạo | `DELETE /api/categories/{{temp_category_id}}` | admin | – | 200 | 200 — danh mục không còn tồn tại | spec §3.4 | SV | VALID | **Pass** (1/1) |
| TC-PRODUPD-205 | Domain | bước 3: PUT sản phẩm trỏ vào **danh mục đã xoá** | `PUT /api/products/{{product_id}}` | admin | `{"name":"HW06-Orphan-Category","price":200000,"description":"d","imageUrl":"http://x/i.png` | 400 / 422 | từ chối — khoá ngoại phải trỏ tới danh mục đang tồn tại | spec §3.4 · FR-14 (quản lý danh mục) — sản phẩm mồ côi danh mục thì trang danh mục hiển thị sai | SV | VALID | **FAIL** (1/1 đỏ) |
| TC-PRODUPD-206 | State | **hệ quả** TC-205: sản phẩm có bị gắn danh mục không tồn tại | `GET /api/products/{{product_id}}` | không có header | – | 200 | `category_id` **không** trỏ tới danh mục đã xoá | FR-14 · spec §3.4 | SV | VALID | **FAIL** (1/2 đỏ) |
| TC-PRODUPD-207 | Security SEC-01 | **SEC-01**: response của `GET :id` sau khi cập nhật có lộ field nội bộ | `GET /api/products/{{product_id}}` | không có header | – | 200 | chỉ chứa field spec §3.3 định nghĩa; **không** có field nội bộ nào khác (SUT dùng `SELECT *`) | SEC-01 (không phơi dữ liệu không cần thiết) · spec §3.2/§3.3 | SV | VALID | **Pass** (2/2) |

## Vì sao AI bỏ sót (§6.3 — đúng 3 nhóm lý do)

| TC ID | AI bỏ sót gì | Nhóm lý do | Giải thích |
|---|---|---|---|
| TC-PRODUPD-201 | chỉ sinh case XSS cho `name`, không cho **`imageUrl`** | **model limitations** | AI gắn XSS với trường *văn bản hiển thị*. `imageUrl` nguy hiểm theo cách khác: nó đi vào thuộc tính `src`/`href`, nơi `javascript:` chạy được mà không cần thẻ `<script>`. |
| TC-PRODUPD-202 | cùng nhóm với 201 | **model limitations** | Phần chứng minh phải đọc lại giá trị đã lưu. |
| TC-PRODUPD-203 | không sinh chuỗi **xoá danh mục rồi trỏ sản phẩm vào đó** | **prompt quality** | AI đã kiểm `category_id = 999999` (số chưa từng tồn tại). Trường hợp khó hơn — id **từng tồn tại rồi bị xoá** — cần nghĩ theo trục thời gian của dữ liệu, và prompt không yêu cầu điều đó. |
| TC-PRODUPD-204 | cùng chuỗi với 203 | **prompt quality** | Chuỗi này đi qua FR-14 (danh mục) trong khi API được giao là FR-15 (sản phẩm). |
| TC-PRODUPD-205 | cùng chuỗi với 203 | **prompt quality** | Sinh viên đặt câu hỏi từ góc *dữ liệu sau này hiển thị ra sao*, không từ góc *tham số có hợp lệ không*. |
| TC-PRODUPD-206 | không kiểm hệ quả mồ côi khoá ngoại | **characteristics of the API** | SQLite ở SUT này **không bật** kiểm khoá ngoại, nên mọi `category_id` đều ghi được. Chỉ đọc `database.js` mới biết, không suy từ spec. |
| TC-PRODUPD-207 | kiểm field lạ ở endpoint **danh sách** nhưng không ở endpoint **chi tiết** | **model limitations** | AI viết một case cho `GET /api/products` rồi coi như đã phủ; nhưng hai endpoint là hai câu truy vấn khác nhau, và cái `:id` còn có nhánh sửa `price` theo id chẵn/lẻ. |
