<!-- title: [BUG][module: products/search] Tìm kiếm tiếng Việt có dấu bị phân biệt hoa/thường -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-PRODLIST-101 (đối chứng: TC-PRODLIST-004/006)

## Requirement liên quan
FR-05

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
# đã có sản phẩm tên "HW06-Áo thun cổ tròn"
curl -G --data-urlencode "search=Áo" http://localhost:3000/api/products      # → 1 dòng
curl -G --data-urlencode "search=áo" http://localhost:3000/api/products      # → 0 dòng
# đối chứng ASCII:
curl -G --data-urlencode "search=Laptop" http://localhost:3000/api/products  # → 2 dòng
curl -G --data-urlencode "search=laptop" http://localhost:3000/api/products  # → 2 dòng
```

## Expected result
`áo` và `Áo` cho cùng kết quả. SUT là ứng dụng tiếng Việt, và chính nó **đã** không phân biệt hoa/thường với ASCII.

## Actual result
`LIKE` của SQLite chỉ không phân biệt hoa/thường trong phạm vi **ASCII**. Người dùng gõ `áo` — cách gõ tự nhiên nhất — không tìm được sản phẩm nào. Cần `LOWER()` có Unicode hoặc cột tìm kiếm đã chuẩn hoá.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 05`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-01-products-search.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
