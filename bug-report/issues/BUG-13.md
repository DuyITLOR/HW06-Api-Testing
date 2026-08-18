<!-- title: [BUG][module: products/admin] PUT/POST/DELETE /api/products không có tầng xác thực nào -->
<!-- sev: Critical pri: P1 -->

## Found by Test Case
TC-PRODUPD-031, 032, 033, 034, 101, 102, 103, 107, 108

## Requirement liên quan
SEC-02, SEC-03 · spec §3.3

## Severity / Priority
**Critical / P1**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
# KHÔNG có Authorization ở bất kỳ request nào dưới đây
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \
  -d '{"name":"HACKED-anon","price":1,"description":"d","imageUrl":"u","category_id":1}'
curl localhost:3000/api/products/7        # → "name":"HACKED-anon"  ← dữ liệu ĐÃ đổi thật

curl -X POST   localhost:3000/api/products -H 'Content-Type: application/json' \
  -d '{"name":"HW06-anon-create","price":1,"description":"d","imageUrl":"u","category_id":1}'   # → 200
curl -X DELETE localhost:3000/api/products/999999                                              # → 200

# và với token user role=user: cũng 200, dữ liệu cũng đổi
```

## Expected result
401 khi không có token (SEC-02); **403** khi token có `role='user'` (SEC-03 — spec §3.3 ghi rõ *Dành cho Admin*).

## Actual result
Ba route `PUT` (`server.js:179`), `POST` (`:167`), `DELETE` (`:191`) **không gắn** middleware
`authenticateToken`. Không phải thiết kế toàn cục: `POST /api/categories` (`:249`) *có* gắn — nên đây là
thiếu sót cục bộ ở đúng ba route quản lý sản phẩm.

Test case không dừng ở status code: TC-PRODUPD-101/103 `GET` lại sản phẩm để chứng minh **dữ liệu đã bị
đổi thật** — đó là khác biệt giữa “API trả sai mã lỗi” và “người lạ sửa được catalog”.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 13`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
