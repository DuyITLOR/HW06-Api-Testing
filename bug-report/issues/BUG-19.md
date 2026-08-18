<!-- title: [BUG][module: users] GET /api/users/me trả về mật khẩu dạng plaintext -->
<!-- sev: Critical pri: P1 -->

## Found by Test Case
phát hiện khi dựng setup login cho API-02/API-03; tái hiện: `bash bug-report/verify-bugs.sh 19`

## Requirement liên quan
SEC-01

## Severity / Priority
**Critical / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
TOKEN=... # token user thường
curl localhost:3000/api/users/me -H "Authorization: Bearer $TOKEN"
# → {"id":2,"name":"Test User","email":"test@eshop.com","password":"Test1234!","role":"user",
#     "login_attempts":0,"locked_until":null,"reset_token":null,...}
```

## Expected result
Mật khẩu **không** được lưu plaintext (SEC-01) và tuyệt đối không được trả về cho client. `reset_token` cũng không.

## Actual result
`server.js:112-116` dùng `SELECT * FROM users` rồi `res.json(user)`. Mật khẩu là plaintext trong CSDL
(`:20-30` insert thẳng, `:32-51` so sánh trực tiếp) → vi phạm SEC-01 ở **cả hai mặt**: lưu trữ và phơi bày.

**Ngoài phạm vi 3 API của bài** — báo vì đề yêu cầu *report any genuine bugs you find*.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 19`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
