<!-- title: [BUG][module: products/admin] PUT vào :id không tồn tại vẫn trả 200 'Product updated' -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-PRODUPD-020, 021, 022, 023, 029, 106

## Requirement liên quan
spec §3.3

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -i -X PUT localhost:3000/api/products/999999 -H 'Content-Type: application/json' \
  -d '{"name":"ghost","price":1,"description":"d","imageUrl":"u","category_id":1}'   # → 200
curl -i -X PUT localhost:3000/api/products/abc    ... # → 200
curl -i -X PUT localhost:3000/api/products/0      ... # → 200
```

## Expected result
404 — không có gì để cập nhật (spec §3.3 là *Cập nhật* một sản phẩm đang tồn tại, không phải upsert).

## Actual result
`server.js:185-187` không dùng `this.changes` nên không phân biệt “đã sửa 1 hàng” với “không sửa hàng nào”. API **báo thành công cho một thao tác không xảy ra** — client tưởng đã lưu. Đã kiểm: không tạo hàng mới (TC-PRODUPD-106), chỉ báo sai.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 17`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
