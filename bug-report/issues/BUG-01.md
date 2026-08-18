<!-- title: [BUG][module: products/search] SQL injection qua tham số search — payload vô hiệu hoá điều kiện WHERE -->
<!-- sev: Critical pri: P1 -->

## Found by Test Case
TC-PRODLIST-024, 025, 026, 027, 106

## Requirement liên quan
SEC-05

## Severity / Priority
**Critical / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl 'http://localhost:3000/api/products?search=Laptop'            # → 2 dòng
curl -G --data-urlencode "search=%' OR '1'='1" http://localhost:3000/api/products
# → TOÀN BỘ bảng products
curl -G --data-urlencode "search=' UNION SELECT 1,2,3,4,5--" http://localhost:3000/api/products
# → 500 + "SELECTs to the left and right of UNION do not have the same number of result columns"
```

## Expected result
`search` là **giá trị tìm kiếm**, không phải mã SQL → 0 dòng, status 200.

## Actual result
`server.js:143` nối chuỗi trực tiếp:

```js
const query = `SELECT * FROM products WHERE name LIKE '%${searchQuery}%'`;
```

Điều kiện `WHERE` bị vô hiệu hoá (trả toàn bộ bảng), và payload UNION làm lộ **số cột thật** của bảng.

Mức khai thác thực tế đã kiểm: **đọc dữ liệu + dò cấu trúc**. Payload `'; DROP TABLE products--` **không**
xoá được bảng vì `db.all()` chỉ chạy câu đầu (TC-PRODLIST-106 xanh) — ghi rõ để không phóng đại.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 01`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-01-products-search.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
