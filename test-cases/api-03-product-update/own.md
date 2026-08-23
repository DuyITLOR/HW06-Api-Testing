# api-03-product-update · §6.3 — test case **do sinh viên tự viết**

> **File này đang TRỐNG, và đó là trạng thái đúng cho tới khi sinh viên tự viết.**
>
> Đề §6.3: *"Add at least **five** test cases of **your own** that the AI missed — and explain **why**
> the AI missed them (prompt quality, model limitations, or characteristics of the API)."*
>
> `extended.md` **không** thoả yêu cầu này: 7–8 case trong đó do **AI sinh ở lượt hai** (cột `Nguồn` =
> `AI-2`), sau khi đọc source và dữ liệu thật. Chúng thoả phần *"mà AI bỏ sót"* nhưng không thoả phần
> *"of your own"*. Trước đây chúng bị dán nhãn `SV` — đã sửa, và `tools/check-cases.mjs` giờ chặn nhãn đó.

## Cách viết (≈20 phút cho 5 case)

1. `npm run gaps` — in ra ô còn trống: loại phân hoạch chưa dùng, mã SEC chưa chạm ở API này.
2. Chọn 5 ô, tự nghĩ case. **Không** chép từ `extended.md`.
3. Điền bảng dưới. Cột **Căn cứ** phải trỏ được vào `spec §…` / `FR-…` / `SEC-0…` / `server.js:dòng` —
   không có căn cứ thì expected là suy đoán, và suy đoán sinh ra **bug giả**.
4. Chạy thử bằng curl để xác nhận expected mình ghi là đúng, rồi `npm run verify`.

## Bảng test case của sinh viên

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | SV | VALID | |

## Vì sao AI bỏ sót (§6.3 đòi phân loại đúng 3 nhóm)

| TC ID | AI bỏ sót gì | Nhóm lý do | Giải thích |
|---|---|---|---|
| | | *(prompt quality / model limitations / characteristics of the API)* | |
