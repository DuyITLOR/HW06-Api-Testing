<!-- title: [BUG][module: products/search] Ký tự % và _ của LIKE không được escape — input bị dùng như pattern -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-PRODLIST-102, 103

## Requirement liên quan
FR-05 · SEC-05

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
# đã có sản phẩm tên "HW06-Bàn phím 100% cơ"
curl -G --data-urlencode "search=100%" http://localhost:3000/api/products  # → 2 dòng (đúng ra 1)
curl -G --data-urlencode "search=%"    http://localhost:3000/api/products  # → TOÀN BỘ bảng
curl -G --data-urlencode "search=_"    http://localhost:3000/api/products  # → TOÀN BỘ bảng
```

## Expected result
`%` và `_` là **ký tự bình thường** trong tên sản phẩm → khớp đúng nghĩa chữ.

## Actual result
Input được ghép thẳng vào mẫu `LIKE` nên trở thành **wildcard**. Khách tìm “bàn phím 100%” nhận thêm kết quả sai; và đây là dạng nhẹ của cùng gốc rễ với BUG-01. Cần escape `%` `_` `\` kèm `ESCAPE`.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 06`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-01-products-search.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
