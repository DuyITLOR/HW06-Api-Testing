---
name: api-test-audit
description: Audit AI-generated API test cases for HW06 — label each case VALID / INVALID / INCOMPLETE with a reason, correct the bad ones, then add at least five cases the AI missed and classify why it missed them (prompt quality, model limitation, or API characteristics). Use after api-test-design has produced test-cases/<api>/generated.md.
---

# API Test Audit Skill (HW06 §6.2 + §6.3)

§6.2: *"Label each AI-generated test case VALID / INVALID / INCOMPLETE with reasoning, and correct
the invalid or incomplete ones. **You are fully responsible for the final test cases.**"*
Nhãn không kèm lý do **không tính** là audit.

## Định nghĩa 3 nhãn — dùng đúng nghĩa này

| Nhãn | Khi nào | Phải làm gì |
|---|---|---|
| **VALID** | Expected bám spec/FR/SEC, assertion đủ mạnh để phát hiện sai lệch, case chạy độc lập | không sửa |
| **INVALID** | Expected **sai** (bịa status code, sai hiểu spec), hoặc case không kiểm đúng thứ nó nói kiểm | **sửa** và ghi lý do sai |
| **INCOMPLETE** | Đúng nhưng **thiếu**: assertion chỉ kiểm status mà không kiểm body, thiếu bước verify, thiếu cleanup, thiếu phân vùng liền kề | **bổ sung** và ghi thiếu gì |

## Bốn lỗi hay gặp nhất — soát đúng bốn cái này trước

1. **Expected bịa theo lẽ thường.** Ví dụ ghi `404` cho id không tồn tại trong khi SUT trả `200 {}`.
   Cách xử lý đúng: expected ghi theo **spec**, rồi nếu SUT lệch thì đó là **bug** — ghi vào
   `bug-report/bug-report.md`, không phải im lặng sửa expected cho khớp SUT. Sửa expected cho khớp
   hành vi sai của SUT là cách làm mất sạch giá trị của bộ test.
2. **Assertion quá yếu.** `pm.response.to.have.status(200)` cho một case đáng lẽ kiểm schema.
3. **Case không độc lập.** Dựa vào dữ liệu case trước để lại → chạy lẻ là đỏ, chạy CI trên DB sạch
   là đỏ. Mỗi case tự tạo state của nó, hoặc nằm trong folder state có thứ tự rõ ràng.
4. **Case security không chứng minh tác động.** "Gửi payload SQLi → 200" không chứng minh gì; phải
   so **dữ liệu trả về** với truy vấn hợp lệ, hoặc `GET` lại để cho thấy dữ liệu đã bị đổi.

## Quy trình

1. Đọc `test-cases/<api-slug>/generated.md`.
2. Với **từng** dòng, điền cột `Audit`: `VALID` · `INVALID: <lý do>` · `INCOMPLETE: <thiếu gì>`.
3. Ghi bản đã sửa vào `test-cases/<api-slug>/audit.md` + bảng thống kê 3 nhãn.
4. **Tự chạy 2–3 case bằng curl/Postman** để xác nhận mình audit đúng — audit bằng suy luận thuần
   là cách sinh ra một tầng sai mới trên tầng sai cũ.

## §6.3 — thêm ≥5 case AI bỏ sót, kèm lý do

Ghi vào `test-cases/<api-slug>/extended.md`, và phân loại lý do theo **đúng 3 nhóm đề nêu**:

| Nhóm | Nghĩa | Ví dụ hay gặp ở bài này |
|---|---|---|
| **prompt quality** | prompt thiếu ngữ cảnh nên AI không thể biết | không đưa SEC-01…SEC-07 vào prompt → không có case role escalation |
| **model limitations** | có ngữ cảnh nhưng AI vẫn suy luận hụt | không nghĩ tới `%`/`_` là wildcard của `LIKE`; không nghĩ tới cart-not-cleared sau checkout |
| **characteristics of the API** | đặc điểm riêng của API mà spec không nói | giỏ hàng in-memory theo `userId`; `price` đổi kiểu theo tính chẵn/lẻ của `id`; route thiếu middleware auth |

Mỗi dòng phải trả lời được *"vì sao **AI** không thấy, chứ không phải vì sao case này đúng"*.

## Sau khi xong

1. Ghi audit lượt này: skill `ai-audit-logger`.
2. Dựng collection: skill `postman-newman`.
