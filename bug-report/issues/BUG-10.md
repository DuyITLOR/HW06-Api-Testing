<!-- title: [BUG][module: cart] Mass assignment — field ngoài đặc tả được lưu thẳng vào giỏ -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-CART-036, 104

## Requirement liên quan
SEC-06

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"id":7,"name":"x","price":200000,"quantity":1,"role":"admin","isAdmin":true}'
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"
# → [... {"id":7,...,"role":"admin","isAdmin":true} ...]
```

## Expected result
Chỉ 4 field trong spec §4.2 được nhận; field lạ bị bỏ hoặc request bị từ chối.

## Actual result
`push(req.body)` lưu nguyên object → `role: "admin"` nằm trong state phía server. Hiện chưa thấy đường leo quyền từ đây, nhưng đây đúng là tiền đề của SEC-06 và sẽ thành lỗ hổng ngay khi có đoạn mã nào đọc field đó.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 10`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
