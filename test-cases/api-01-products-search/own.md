# api-01-products-search · §6.3 — test case **do sinh viên tự viết**

> Đề §6.3: *"Add at least **five** test cases of **your own** that the AI missed — and explain **why** the
> AI missed them (prompt quality, model limitations, or characteristics of the API)."*
>
> `extended.md` **không** tính vào yêu cầu này: các case ở đó do AI sinh ở lượt hai (`Nguồn = AI-2`).

## Trạng thái phủ hiện tại của GET /api/products

- Tham số của API này: search (query)
- Số case theo nhóm: **Domain 22 · State 5 · Security 7 · Schema 9**
- SEC đã chạm ở API này: SEC-04, SEC-05
- **SEC chưa chạm ở API này: SEC-01, SEC-02, SEC-03, SEC-06, SEC-07**

## Cách nghĩ ra 5 case trong ~15 phút

Chọn 5 chỗ từ danh sách dưới, mỗi chỗ một case. Đây là **hướng để tìm**, không phải case sẵn:

1. Một **mã SEC chưa chạm** ở trên — hỏi: yêu cầu đó nói gì, và endpoint này có vi phạm được không?
2. Một **tham số** trong danh sách trên mà bạn thấy chưa bị đẩy tới cực trị (rỗng · thiếu hẳn · sai kiểu ·
   rất dài · Unicode có dấu · ký tự đặc biệt của tầng dưới như `%` `_` `'`).
3. Một **chuỗi trạng thái** chưa ai chạy: làm A rồi làm B rồi đọc lại — kết quả có còn hợp lý?
4. Một **hệ quả** chưa được kiểm: request trả 200, nhưng dữ liệu trong CSDL/giỏ sau đó có đúng không?
5. Một **route lân cận** cùng nhóm quyền với endpoint này (xem `eshop-sut/api_specification.md`).

Với mỗi case, bắt buộc có **Căn cứ** trỏ được vào `spec §…` / `FR-…` / `SEC-0…` / `server.js:dòng`.
Không có căn cứ thì expected là suy đoán — và suy đoán sinh ra **bug giả** (xem lỗi #1–#3 ở báo cáo §11).

Xong thì tự chạy bằng `curl` để xác nhận expected, rồi `npm run check:own` và `npm run verify`.

## Bảng test case của sinh viên (điền 5 dòng)

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PRODLIST-201 | | | `GET /api/products` | | | | | | SV | VALID | |
| TC-PRODLIST-202 | | | `GET /api/products` | | | | | | SV | VALID | |
| TC-PRODLIST-203 | | | `GET /api/products` | | | | | | SV | VALID | |
| TC-PRODLIST-204 | | | `GET /api/products` | | | | | | SV | VALID | |
| TC-PRODLIST-205 | | | `GET /api/products` | | | | | | SV | VALID | |

## Vì sao AI bỏ sót (§6.3 — đúng 3 nhóm lý do)

| TC ID | AI bỏ sót gì | Nhóm lý do | Giải thích |
|---|---|---|---|
| TC-PRODLIST-201 | | | |
| TC-PRODLIST-202 | | | |
| TC-PRODLIST-203 | | | |
| TC-PRODLIST-204 | | | |
| TC-PRODLIST-205 | | | |
