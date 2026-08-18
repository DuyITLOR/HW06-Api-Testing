---
name: api-test-design
description: Design API test cases from an API specification, one technique step at a time — domain partitions on every parameter, state transitions, security SEC-01..SEC-07, and schema validation. Use for HW06 when generating test cases for a chosen EShop API (GET /api/products, POST /api/cart, PUT /api/products/:id) before writing the Postman collection. Produces the 12-column Markdown table the Excel exporter reads.
---

# API Test Design Skill (HW06 §6.1)

Đề §2 **cấm đích danh** một prompt gộp kiểu *"generate all the API test cases from the spec and run
them"*. Skill này chia việc thành **5 bước**, mỗi bước một lượt AI riêng, mỗi bước một mục trong
`ai-audit/ai-audit-report.md`. Đi đủ 5 bước chính là bằng chứng cho §2.

## Trước khi bắt đầu — đọc 3 nguồn, không chỉ 1

| Nguồn | Lấy gì |
|---|---|
| `eshop-sut/api_specification.md` | endpoint, tham số, body mẫu, response thành công |
| `eshop-sut/README.md` (mục FR-xx + SEC-01…SEC-07) | **ràng buộc nghiệp vụ và bảo mật** — spec API không có |
| `eshop-sut/backend/server.js` | hành vi **thật**: status code thật, middleware có/không, câu SQL |

Đọc cả ba vì expected phải bám spec; nhưng khi spec và code lệch nhau thì **chỗ lệch chính là bug** —
và chỉ thấy được nếu đọc cả hai. Ghi rõ trong cột `Căn cứ` là expected đến từ đâu.

## Bước 1 — Rút tham số và ràng buộc

Với API đang làm, lập bảng: tham số · nơi truyền (path/query/body/header) · kiểu · bắt buộc? ·
ràng buộc từ spec · ràng buộc từ FR · **spec có im lặng chỗ nào**.

Chỗ spec im lặng thì **không được bịa expected**. Ghi `spec không định nghĩa` rồi chọn một trong hai:
suy từ FR/SEC (ghi rõ suy từ đâu), hoặc để thành câu hỏi cho giảng viên. Bịa expected sẽ sinh ra
"bug" giả — lỗi nặng nhất mà §10 bắt phải tự soát.

## Bước 2 — Phân hoạch miền cho **từng** tham số

Với mỗi tham số, phân vùng **rời nhau và phủ kín**: hợp lệ điển hình · biên dưới / trên (nếu có
thứ tự) · rỗng · thiếu hẳn · sai kiểu · quá dài · ký tự đặc biệt · Unicode/tiếng Việt có dấu ·
giá trị mang nghĩa đặc biệt với tầng dưới (`%` và `_` với `LIKE`, `'` với SQL, `0`/số âm với số
lượng và giá).

Cho `Authorization`, coi nó là **một tham số**: không có header · sai định dạng · token hết hạn ·
token sai chữ ký · token user thường · token admin · token của user đã bị xoá.

## Bước 3 — State transition

Liệt kê trạng thái và chuyển trạng thái hợp lệ/không hợp lệ, rồi thiết kế **chuỗi** request có thứ
tự (mỗi bước một request, assertion ở từng bước). Với 3 API của bài:
- API-02: giỏ rỗng → thêm → `GET /api/cart` → `POST /api/checkout` → **kiểm giỏ sau khi checkout**.
- API-03: tạo sản phẩm → PUT → `GET` lại để xác nhận **đã đổi thật** (chỉ đọc status 200 là không đủ).
- FR-10 (`pending → confirmed → shipping → delivered`) chỉ liên quan nếu chuỗi có tạo đơn.

## Bước 4 — Security SEC-01…SEC-07

| Mã | Nội dung | Cách kiểm qua API |
|---|---|---|
| SEC-01 | Mật khẩu không lưu plaintext | quan sát response có trả về mật khẩu không (`GET /api/users/me` dùng `SELECT *`) |
| SEC-02 | API bảo mật đòi JWT hợp lệ | gọi **không** token / token rác → phải 401/403 |
| SEC-03 | API admin phải kiểm `role='admin'`, không chỉ kiểm có token | gọi bằng token **user thường** → phải 403 |
| SEC-04 | Escape dữ liệu người dùng | gửi payload `<script>` vào tên sản phẩm rồi xem response trả lại nguyên văn ra sao |
| SEC-05 | Parameterized query | gửi `'`, `%' OR '1'='1`, `; DROP TABLE` vào tham số tìm kiếm; **so số dòng trả về** với lượt không có tham số |
| SEC-06 | Không cho client đổi `role` | ngoài phạm vi 3 API — **ghi là ngoài phạm vi**, đừng nhận vơ |
| SEC-07 | OTP đủ entropy, có hạn, dùng một lần | ngoài phạm vi 3 API |

Nguyên tắc: một test security phải **chứng minh được tác động**, không chỉ "trả về 200". SQLi thì
phải cho thấy dữ liệu trả về **khác** so với truy vấn hợp lệ; role escalation thì phải `GET` lại
để cho thấy dữ liệu **đã bị đổi thật**.

## Bước 5 — Schema validation

So response với **spec**, không so với chính nó: đúng tập field · đúng **kiểu** từng field ·
`Content-Type: application/json` · status code · không có field lộ thông tin nội bộ
(`password`, `reset_token`, stack trace). Dùng `pm.response.to.have.jsonSchema` để assertion nói
được *lệch ở field nào*, thay vì `expect(res.code).to.eql(200)`.

## Đầu ra

Ghi vào `test-cases/<api-slug>/generated.md`, **đúng 12 cột** (script `tools/tc2xlsx.py` đọc bộ cột
này):

`TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả`

Cột `Nguồn` = `AI`; cột `Audit`, `Kết quả` để trống (điền ở bước sau).

## Tiêu chí "đủ"

Đề đòi **≥35 case/API**, nhưng đếm số dòng là tiêu chí sai. Dựng **ma trận phủ**: hàng = tham số,
cột = loại phân vùng, rồi báo **ô còn trống**. 35 case mà bỏ cả nhóm security thì kém 35 case phủ
đều — và ô trống là thứ nhìn ra được, còn "35" thì không.

## Sau khi xong

1. Ghi audit lượt này: skill `ai-audit-logger`.
2. Chuyển sang bước 2 của đề: skill `api-test-audit`.
