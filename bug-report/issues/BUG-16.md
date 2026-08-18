<!-- title: [BUG][module: products/admin] Không validate price, name, category_id khi cập nhật sản phẩm -->
<!-- sev: High pri: P2 -->

## Found by Test Case
TC-PRODUPD-003, 004, 009, 010, 011, 012, 016, 017, 018

## Requirement liên quan
FR-15 · đề §6.1 (price > 0)

## Severity / Priority
**High / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
for b in '{"name":"n","price":-100,"description":"d","imageUrl":"u","category_id":1}' \
         '{"name":"n","price":0,"description":"d","imageUrl":"u","category_id":1}' \
         '{"name":"n","price":"abc","description":"d","imageUrl":"u","category_id":1}' \
         '{"name":"","price":1,"description":"d","imageUrl":"u","category_id":1}' \
         '{"name":"n","price":1,"description":"d","imageUrl":"u","category_id":999999}'; do
  curl -s -o /dev/null -w "%{http_code} " -X PUT localhost:3000/api/products/7 \
    -H 'Content-Type: application/json' -d "$b"
done      # → 200 200 200 200 200
curl localhost:3000/api/products/7    # giá trị sai đã nằm trong CSDL
```

## Expected result
400: `price > 0` và là số; `name` không rỗng; `category_id` phải tồn tại trong bảng `categories`.

## Actual result
Không có validate nào ở tầng API, và khoá ngoại không được bật ở SQLite nên `category_id = 999999` cũng ghi được. Sản phẩm giá âm / giá dạng chuỗi / không tên đi thẳng ra danh sách bán.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 16`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
