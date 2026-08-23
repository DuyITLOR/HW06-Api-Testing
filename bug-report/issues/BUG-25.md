<!-- title: [BUG][module: products/admin] category_id trỏ tới danh mục đã bị xoá vẫn được chấp nhận -->
<!-- sev: Medium pri: P2 -->

## Found by Test Case
TC-PRODUPD-203 → 206 (case do sinh viên chọn, §6.3)

## Requirement liên quan
FR-14 · spec §3.4

## Severity / Priority
**Medium / P2**

## Environment
`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64

## Steps to reproduce
```bash
# 1. tao danh muc tam roi xoa no
CID=$(curl -s -X POST localhost:3000/api/categories -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"HW06-Temp-Category"}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
curl -X DELETE "localhost:3000/api/categories/$CID" -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. gan san pham vao danh muc vua xoa
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \
  -d "{"name":"HW06-Orphan","price":200000,"description":"d","imageUrl":"","category_id":$CID}"
# -> 200 {"message":"Product updated"}
curl -s localhost:3000/api/products/7
```

## Expected result
**400** — khoá ngoại phải trỏ tới danh mục đang tồn tại (FR-14).

## Actual result
SQLite ở SUT này **không bật** `PRAGMA foreign_keys`, và tầng API cũng không kiểm. Sản phẩm thành *mồ côi
danh mục*: trang danh mục không liệt kê nó, nhưng nó vẫn xuất hiện ở danh sách sản phẩm với một `category_id`
vô nghĩa.

Bộ test AI đã kiểm `category_id = 999999` (id **chưa từng** tồn tại). Trường hợp khó hơn — id **từng tồn tại
rồi bị xoá** — cần nghĩ theo trục thời gian của dữ liệu.

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh 25`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report](https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main/bug-report/screenshots/newman-api-03-product-update.png)
- Bug report đầy đủ: [`bug-report/bug-report.md`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/bug-report/bug-report.md) · Test case: [`test-cases/`](https://github.com/DuyITLOR/HW06-Api-Testing/blob/main/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing. Số liệu bộ test cập nhật tại `test-cases/test-summary/summary.md` trong repo bài làm (không nhắc con số ở đây để khỏi lệch khi bộ test thay đổi).</sub>
