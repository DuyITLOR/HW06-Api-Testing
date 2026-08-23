<!-- title: [BUG][module: cart] Price tampering — giá sản phẩm trong giỏ do client quyết định -->
<!-- sev: Critical pri: P1 -->

## Found by Test Case
TC-CART-025, 101, 102

## Requirement liên quan
FR-07 · FR-08

## Severity / Priority
**Critical / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
# sản phẩm id=7 có giá 200000 trong catalog
curl -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"id":7,"name":"HW06-Verify","price":1,"quantity":1}'
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"
# → [{"id":7,"name":"HW06-Verify","price":1,"quantity":1}]
```

## Expected result
Giá trong giỏ phải bằng giá trong bảng `products`, hoặc request bị từ chối.

## Actual result
Không đối chiếu catalog. Giá 1 đồng nằm trong giỏ, và `POST /api/checkout` cũng nhận `total_amount`
từ client → **số tiền phải trả do người mua đặt**.

**Ghi chú về căn cứ (đọc kỹ):** spec §4.2 *có* ghi `price` trong body, nên đọc thuần câu chữ thì việc gửi
giá là đúng đặc tả. Kết luận bug dựa trên **FR-07 + FR-08**: giỏ phản ánh sản phẩm thật và FR-08 tính tiền
đơn từ giỏ. Lập luận đầy đủ: [`test-cases/api-02-cart-add/audit.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases/api-02-cart-add/audit.md).

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 08`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
