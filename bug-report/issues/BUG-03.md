<!-- title: [BUG][module: products/detail] GET /api/products/:id không tồn tại trả 200 {} thay vì 404 -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-PRODLIST-023, 033, 034, 035, 036

## Requirement liên quan
spec §3.2

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -i http://localhost:3000/api/products/999999   # → 200 {}
curl -i http://localhost:3000/api/products/abc      # → 200 {}
curl -i http://localhost:3000/api/products/-1       # → 200 {}
curl -i http://localhost:3000/api/products/0        # → 200 {}
```

## Expected result
404 + `{error}` — spec §3.2 định nghĩa *xem chi tiết MỘT sản phẩm*; không có sản phẩm thì không có đối tượng để trả 200.

## Actual result
`server.js:160` `if (!row) return res.status(200).json({})`. Client không phân biệt được *không tồn tại* với *tồn tại nhưng rỗng*, và `:id` sai kiểu cũng không bị từ chối.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 03`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-01-products-search.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
