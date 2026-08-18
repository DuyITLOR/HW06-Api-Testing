<!-- title: [BUG][module: products/admin] Mất chính xác số tiền lớn hơn 2^53 khi lưu -->
<!-- sev: Low pri: P3 -->

## Found by Test Case
TC-PRODUPD-013, 014

## Requirement liên quan
FR-15

## Severity / Priority
**Low / P3**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \
  -d '{"name":"HW06-BigPrice","price":9007199254740993,"description":"d","imageUrl":"u","category_id":1}'
curl localhost:3000/api/products/7      # → "price":9007199254740992   (lệch 1)
```

## Expected result
Hoặc từ chối giá vượt ngưỡng an toàn, hoặc lưu **đúng** giá trị đã gửi.

## Actual result
Giá đi qua `double` của JS nên bị làm tròn **im lặng**. Ảnh hưởng nhỏ ở dữ liệu thật, nhưng là dấu hiệu tiền tệ đang được lưu dưới dạng số thực thay vì số nguyên đơn vị nhỏ nhất.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 18`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
