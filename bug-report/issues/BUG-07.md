<!-- title: [BUG][module: cart] POST /api/cart không validate bất kỳ field nào -->
<!-- sev: High pri: P1 -->

## Found by Test Case
TC-CART-003…015, 021…023, 107

## Requirement liên quan
FR-07 · spec §4.2

## Severity / Priority
**High / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
TOKEN=$(curl -s -X POST localhost:3000/api/login -H 'Content-Type: application/json' \
  -d '{"email":"test@eshop.com","password":"Test1234!"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')
for body in '{"id":1,"name":"x","price":200000,"quantity":0}' \
            '{"id":1,"name":"x","price":200000,"quantity":-5}' \
            '{"id":1,"name":"x","price":200000,"quantity":1.5}' \
            '{"id":1,"name":"x","price":200000,"quantity":"abc"}' \
            '{}'; do
  curl -s -o /dev/null -w "%{http_code} " -X POST localhost:3000/api/cart \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$body"
done                                  # → 200 200 200 200 200
```

## Expected result
Từ chối (400) mọi input trên: `quantity` phải là số nguyên ≥ 1 (spec §4.2 `quantity: 2`), 4 field là bắt buộc.

## Actual result
`server.js:290-295` là `userCarts[userId].push(req.body)` — không có tầng validate nào. Giỏ hàng chứa được dòng `quantity = -5` và cả dòng rỗng `{}` (TC-CART-107 chứng minh trạng thái giỏ sau đó không còn hợp lệ).

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 07`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
