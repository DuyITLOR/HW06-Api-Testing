<!-- title: [BUG][module: products/detail] Kiểu dữ liệu của price phụ thuộc tính chẵn/lẻ của id -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-PRODLIST-107, TC-PRODUPD-038

## Requirement liên quan
spec §3.2/§3.3

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl http://localhost:3000/api/products/1   # → "price": 30000000   (number)
curl http://localhost:3000/api/products/2   # → "price": "28000000" (string)
```

## Expected result
`price` luôn là **number** (spec §3.3 ghi `price: 100000`). Kiểu dữ liệu không được phụ thuộc giá trị khoá.

## Actual result
`server.js:161`: `if (row.id % 2 === 0) row.price = row.price.toString();`. Client tính toán trên `price` sẽ ra kết quả nối chuỗi với một nửa số sản phẩm. Đây cũng là **mắt thứ ba của BUG-14** (khi `price` là NULL thì lệnh này làm sập tiến trình).

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 04`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-01-products-search.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
