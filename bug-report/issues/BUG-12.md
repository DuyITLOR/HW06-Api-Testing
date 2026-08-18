<!-- title: [BUG][module: cart] Thêm cùng một sản phẩm nhiều lần tạo nhiều dòng, không cộng dồn số lượng -->
<!-- sev: Low pri: P3 -->

## Found by Test Case
TC-CART-026, 027

## Requirement liên quan
FR-07

## Severity / Priority
**Low / P3**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -X POST localhost:3000/api/cart ... -d '{"id":7,"name":"x","price":200000,"quantity":1}'
curl -X POST localhost:3000/api/cart ... -d '{"id":7,"name":"x","price":200000,"quantity":3}'
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"   # → 2 dòng cùng id=7
```

## Expected result
Một sản phẩm một dòng, số lượng cộng dồn (giỏ là tập sản phẩm kèm số lượng, không phải log các lần bấm).

## Actual result
`push` không tìm dòng có sẵn. Giao diện giỏ sẽ hiện trùng sản phẩm, và tổng tiền phụ thuộc số lần bấm.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 12`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
