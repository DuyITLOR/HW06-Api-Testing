<!-- title: [BUG][module: products/admin] Partial update ghi NULL đè dữ liệu cũ nhưng vẫn báo thành công -->
<!-- sev: High pri: P1 -->

## Found by Test Case
TC-PRODUPD-104, 105

## Requirement liên quan
FR-15

## Severity / Priority
**High / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \
  -d '{"name":"HW06-Full","price":123456,"description":"desc","imageUrl":"u","category_id":1}'
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \
  -d '{"name":"HW06-OnlyName"}'          # → 200 {"message":"Product updated"}
curl localhost:3000/api/products/7
# → {"id":7,"name":"HW06-OnlyName","price":null,"description":null,"imageUrl":null,"category_id":null}
```

## Expected result
400 (đòi đủ field) **hoặc** 200 nhưng giữ nguyên các field không gửi.

## Actual result
`server.js:180-188` luôn `SET name=?, price=?, description=?, imageUrl=?, category_id=?`; field `undefined` → sqlite3 ghi `NULL`. **Mất dữ liệu im lặng** — response nói “Product updated”. Đây là mắt thứ hai của BUG-14.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 15`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
