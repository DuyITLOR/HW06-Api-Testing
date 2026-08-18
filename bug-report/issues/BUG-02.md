<!-- title: [BUG][module: products/search] Lỗi CSDL trả về HTML kèm thông báo nội bộ của SQLite -->
<!-- sev: High pri: P1 -->

## Found by Test Case
TC-PRODLIST-026, 104, 105

## Requirement liên quan
SEC-05 · spec §3.1

## Severity / Priority
**High / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -i -G --data-urlencode "search='" http://localhost:3000/api/products
# HTTP/1.1 500 · Content-Type: text/html
# <h1>Database Error</h1><p>SQLITE_ERROR: unrecognized token: "'"</p>
```

## Expected result
API trả JSON ở **mọi** đường (spec §3.1); response lỗi không được chứa chi tiết engine CSDL.

## Actual result
`server.js:146-149` trả HTML kèm `err.message`. Hai vấn đề: (1) sai schema — client parse JSON sẽ nổ; (2) rò rỉ thông tin nội bộ, hỗ trợ trực tiếp cho việc khai thác BUG-01. Một tên riêng hợp lệ như `O'Brien` cũng kích hoạt lỗi này (TC-PRODLIST-104).

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 02`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-01-products-search.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
