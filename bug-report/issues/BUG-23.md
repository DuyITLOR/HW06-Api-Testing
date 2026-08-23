<!-- title: [BUG][module: cart / users] Token của người dùng đã bị xoá vẫn mở được giỏ hàng -->
<!-- sev: High pri: P1 -->

## Found by Test Case
TC-CART-208 → 209 (case do sinh viên chọn, §6.3)

## Requirement liên quan
SEC-02

## Severity / Priority
**High / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
# 1. user2 dang nhap, lay token va id
U2=$(curl -s -X POST localhost:3000/api/login -H 'Content-Type: application/json' \
  -d '{"email":"hw06.user2@eshop.com","password":"User2pass!"}')
TOKEN2=$(echo "$U2" | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')
ID2=$(echo "$U2"   | python3 -c 'import json,sys;print(json.load(sys.stdin)["user"]["id"])')

# 2. admin xoa user2
curl -X DELETE "localhost:3000/api/admin/users/$ID2" -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. dung token CU cua user da bi xoa
curl -i localhost:3000/api/cart -H "Authorization: Bearer $TOKEN2"
# -> 200 OK, van mo duoc gio
```

## Expected result
**401/403** — SEC-02 đòi JWT **hợp lệ**; token trỏ tới người dùng không còn tồn tại thì không còn hợp lệ.

## Actual result
`server.js:104-110`: `authenticateToken` chỉ `jwt.verify` chữ ký rồi gán `req.user`, **không** đối chiếu
bảng `users`. Token của người dùng đã bị xoá vẫn đi qua mọi endpoint bảo mật — mà token ở SUT này được
`jwt.sign` **không có `expiresIn`** (`server.js:51`), tức **không bao giờ hết hạn**.

Hệ quả: xoá tài khoản không thu hồi được quyền truy cập.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 23`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
