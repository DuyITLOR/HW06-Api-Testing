<!-- title: [BUG][module: products/search] GET /api/products không có giới hạn số dòng — ?limit và ?page bị bỏ qua -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-PRODLIST-201, TC-PRODLIST-202 (case do sinh viên chọn, §6.3)

## Requirement liên quan
FR-05

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -s 'http://localhost:3000/api/products'          | python3 -c 'import json,sys;print(len(json.load(sys.stdin)),"dong")'
curl -s 'http://localhost:3000/api/products?limit=1'  | python3 -c 'import json,sys;print(len(json.load(sys.stdin)),"dong")'
curl -s 'http://localhost:3000/api/products?page=2'   | python3 -c 'import json,sys;print(len(json.load(sys.stdin)),"dong")'
# ca ba deu tra CUNG so dong = toan bo bang
```

## Expected result
Hoặc honor `limit`/`page`, hoặc trả **400** cho tham số không hỗ trợ — không được im lặng trả toàn bộ bảng.

## Actual result
`server.js:141-157` chỉ đọc `req.query.search`; mọi tham số khác bị bỏ qua và truy vấn luôn là
`SELECT * FROM products`. DB thật của SUT ở bài HW05 có **~900.000 sản phẩm** — một request kéo hết bảng là
vấn đề thật về hiệu năng và bộ nhớ, không phải giả định.

FR-05 gọi đây là *product listing*; spec §3.1 **im lặng** về phân trang, nên issue báo ở mức: API cần một cơ
chế giới hạn, hoặc phải từ chối tham số nó không hỗ trợ.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 20`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-01-products-search.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
