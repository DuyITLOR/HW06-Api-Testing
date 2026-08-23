<!-- title: [BUG][module: products/admin] DoS — khách không đăng nhập làm sập toàn bộ backend bằng 2 request -->
<!-- sev: Critical pri: P0 -->

## Found by Test Case
chuỗi BUG-13 + BUG-15 + BUG-04; tái hiện: `bash bug-report/verify-bugs.sh 14`

## Requirement liên quan
SEC-02 · độ tin cậy

## Severity / Priority
**Critical / P0**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
# KHÔNG cần token. Chọn một sản phẩm có id CHẴN (ví dụ 18).
curl -X PUT http://localhost:3000/api/products/18 \
  -H 'Content-Type: application/json' -d '{"name":"anything"}'
# → 200 {"message":"Product updated"}   (price bị ghi NULL)

curl http://localhost:3000/api/products/18
# → không có phản hồi; tiến trình node đã chết

curl http://localhost:3000/api/products
# → connection refused — TOÀN BỘ hệ thống ngừng phục vụ
```

## Expected result
Request đầu phải 401 (SEC-02). Kể cả khi được phép, một giá trị `NULL` trong CSDL **không được** làm sập tiến trình.

## Actual result
```
TypeError: Cannot read properties of null (reading 'toString')
    at Statement.<anonymous> (backend/server.js:162:49)
    at Statement.replacement (node_modules/sqlite3/lib/trace.js:25:27)
```

`server.js:161-162` chạy `row.price.toString()` khi `id` chẵn. Lỗi ném **trong callback của sqlite3**,
ngoài mọi `try/catch` và ngoài middleware lỗi của Express → Node kết thúc tiến trình. Hệ thống chỉ sống lại
khi có người khởi động lại thủ công, và **lặp lại được ngay** sau mỗi lần restart.

**Ba lỗi hợp thành:** (1) `PUT` không cần token — `server.js:179`; (2) field thiếu → ghi `NULL` đè —
`:180-188`; (3) `price.toString()` không kiểm null — `:161`.

Sửa mắt (3) là hết sập; nhưng phải sửa cả ba, vì (1) và (2) vẫn là lỗ hổng riêng.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 14`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
