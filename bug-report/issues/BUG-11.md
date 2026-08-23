<!-- title: [BUG][module: cart] Thêm được sản phẩm không tồn tại hoặc đã bị xoá vào giỏ -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-CART-010, 011, 012, 105, 106

## Requirement liên quan
FR-07

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -i -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"id":999999,"name":"ghost","price":1,"quantity":1}'      # → 200 Added to cart
# và: xoá sản phẩm khỏi catalog rồi thêm chính nó vào giỏ → cũng 200
```

## Expected result
400/404 — giỏ chỉ chứa sản phẩm đang bán (FR-07).

## Actual result
Không kiểm tồn tại của `id` trong bảng `products`. `id = 0`, `id = -1`, `id` không tồn tại và sản phẩm đã bị `DELETE` đều vào giỏ được, rồi đi tiếp vào đơn hàng ở bước checkout.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 11`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
