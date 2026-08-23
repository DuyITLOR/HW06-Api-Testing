<!-- title: [BUG][module: cart] Payload <script> được lưu nguyên văn vào giỏ hàng -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-CART-204 → 205 (case do sinh viên chọn, §6.3)

## Requirement liên quan
SEC-04

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"id":7,"name":"<script>alert(1)</script>","price":222000,"quantity":1}'
curl -s localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"
# -> [... {"name":"<script>alert(1)</script>", ...} ...]
```

## Expected result
Từ chối, hoặc escape trước khi lưu — SEC-04 đòi dữ liệu người dùng phải được escape đúng cách.

## Actual result
`push(req.body)` lưu nguyên object. Thẻ script nằm trong state phía server và được trả lại cho mọi client
đọc giỏ. Frontend nào render tên sản phẩm bằng `innerHTML` (SEC-04 cấm đích danh) là chạy script ngay.

Kết luận giới hạn trong phạm vi API: payload **được lưu và trả lại nguyên văn**; việc nó thực thi hay không
phụ thuộc tầng UI — ngoài phạm vi bài kiểm thử API.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 22`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
