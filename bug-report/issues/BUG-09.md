<!-- title: [BUG][module: cart/checkout] Giỏ hàng không được xoá sau khi checkout — đặt lại tạo đơn trùng -->
<!-- sev: High pri: P1 -->

## Found by Test Case
TC-CART-029, 103

## Requirement liên quan
FR-07 · FR-08

## Severity / Priority
**High / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"       # → 7 dòng
curl -X POST localhost:3000/api/checkout -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"total_amount":200000,"shipping_address":"123 Le Loi"}'
# → 200 {"message":"Checkout successful","orderId":1}
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"       # → VẪN 7 dòng
```

## Expected result
Sau khi đặt hàng thành công, giỏ rỗng (vòng đời giỏ → đơn).

## Actual result
`server.js:297-309` chỉ `INSERT INTO orders`, không xoá `userCarts[userId]`. Người dùng bấm Đặt hàng lần nữa (hoặc F5) là tạo **đơn trùng** với cùng số hàng. TC-CART-103 xác nhận lần checkout thứ hai vẫn trả 200.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 09`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
