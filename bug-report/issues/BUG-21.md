<!-- title: [BUG][module: cart] Giỏ hàng giữ giá cũ sau khi admin đổi giá sản phẩm -->
<!-- sev: High pri: P1 -->

## Found by Test Case
TC-CART-201 → 202 → 203 (case do sinh viên chọn, §6.3)

## Requirement liên quan
FR-08 · FR-07

## Severity / Priority
**High / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
TOKEN=$(curl -s -X POST localhost:3000/api/login -H 'Content-Type: application/json' \
  -d '{"email":"test@eshop.com","password":"Test1234!"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

# 1. san pham gia 111000 -> them vao gio
curl -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"id":7,"name":"HW06-Cart-Fixture","price":111000,"quantity":1}'

# 2. admin doi gia san pham do len 222000
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \
  -d '{"name":"HW06-Cart-Fixture","price":222000,"description":"doi gia","imageUrl":"","category_id":1}'

# 3. doc lai gio
curl -s localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"
# -> van "price":111000
```

## Expected result
Giỏ phải phản ánh giá hiện tại của catalog (222000), hoặc báo cho người dùng biết giá đã thay đổi.

## Actual result
`server.js:290-295` lưu **bản chụp** `req.body` vào giỏ, không tham chiếu bảng `products`. Giá trong giỏ
đứng yên kể từ lúc thêm.

Hệ quả nghiệp vụ: FR-08 tính tiền đơn hàng từ giỏ, nên khách để hàng trong giỏ rồi quay lại sau khi shop tăng
giá sẽ **trả giá cũ**; ngược lại nếu shop giảm giá thì khách bị tính cao hơn giá đang niêm yết.

Bug này do **case sinh viên chọn** tìm ra: nó nằm trên trục *thời gian* (giá đổi **sau khi** hàng đã vào giỏ),
không nằm trên trục phân hoạch tham số — 136 case sinh từ đặc tả không có case nào loại này.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 21`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-02-cart-add.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
