<!-- title: [BUG][module: products/admin] imageUrl chứa javascript: URL được lưu nguyên văn -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-PRODUPD-201 → 202 (case do sinh viên chọn, §6.3)

## Requirement liên quan
SEC-04 · spec §3.3

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \
  -d '{"name":"HW06-JsUrl","price":200000,"description":"d","imageUrl":"javascript:alert(1)","category_id":1}'
curl -s localhost:3000/api/products/7
# -> "imageUrl":"javascript:alert(1)"
```

## Expected result
Từ chối giá trị không phải URL http/https — spec §3.3 nêu `imageUrl` dạng `http://...`.

## Actual result
Không validate `imageUrl`. Giá trị này đi thẳng vào thuộc tính `src`/`href` của frontend, nơi
`javascript:` **chạy được mà không cần thẻ `<script>`** — một đường XSS khác với BUG-22 và không bị chặn bởi
cùng một bản sửa.

Bộ test do AI sinh có case XSS cho `name` nhưng **không** có cho `imageUrl`: AI gắn XSS với *trường văn bản
hiển thị*, bỏ qua trường URL.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 24`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
