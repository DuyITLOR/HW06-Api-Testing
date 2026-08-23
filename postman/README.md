# Postman — collection, environment, và danh sách feature đã dùng (§6, §14)

- **Workspace:** HW06 — API Testing (23127178)
- **Environment:** [`environments/HW06-local.postman_environment.json`](environments/HW06-local.postman_environment.json)
- **Pre-request script cấp collection:** [`prerequest-collection.js`](prerequest-collection.js) — gắn `X-Student-Id` cho **mọi** request (§6.4) và in ra console để chụp ảnh bằng chứng (§11)

## Quy ước tên file

```
collections/23127178_api-01-products-search.postman_collection.json
collections/23127178_api-02-cart-add.postman_collection.json
collections/23127178_api-03-product-update.postman_collection.json
collections/23127178_regression.postman_collection.json        ← sinh tự động, cổng CI 0 đỏ
```

`tools/run-newman.sh <api-slug>` tìm collection theo đúng mẫu tên này — đổi tên là script không thấy.

## Cấu trúc trong mỗi collection

| Folder | Việc |
|---|---|
| `00-setup` | login admin / user / user2 → lưu token vào environment · tạo fixture riêng cho API đó |
| `10-domain-*` | phân hoạch miền theo từng tham số (§6.1) |
| `20-state-*` | state transition — chuỗi request có thứ tự (§6.1) |
| `30-security-*` | SEC-01…SEC-07: thiếu token · token sai · role escalation · IDOR · SQL injection |
| `40-schema-*` | schema validation — so response với spec (`pm.response.to.have.jsonSchema`) |
| `99-teardown` | xoá fixture đã tạo để lượt sau chạy lại được từ đầu |

## Danh sách Postman feature đã dùng (§6 đòi liệt kê trong báo cáo)

> Cột **Trạng thái** cập nhật khi làm thật, **đừng** đánh dấu trước.

| # | Feature | Dùng ở đâu | Trạng thái |
|---|---|---|---|
| 1 | Workspace | Workspace riêng cho HW06 | [x] |
| 2 | Collection + folder lồng nhau | **4** collection · 27 folder (`00-setup` → `99-teardown`) · regression suite lồng 3 tầng (api → folder → request) | [x] |
| 3 | Environment + biến | `HW06-local-23127178`, 17 biến | [x] đã tạo |
| 4 | Biến **secret** | `admin_password`, `user_password` đặt type `secret` | [x] đã tạo |
| 5 | Collection-level **pre-request script** | header `X-Student-Id` (§6.4) | [x] đã viết |
| 6 | Test script (`pm.test`) | 372 assertion trên 192 request (+253 ở regression suite) | [x] |
| 7 | **JSON schema validation** (`pm.response.to.have.jsonSchema`) | folder `40-schema` của cả 3 API | [x] |
| 8 | **Data-driven** với Collection Runner + file CSV | `postman/data/*.csv` (sinh bằng `npm run seed:api`) | [x] |
| 16 | **Collection sinh tự động từ một nguồn** | `tools/gen-artifacts.mjs` + `tools/gen-regression.mjs` — bảng test case và collection không thể lệch nhau | [x] |
| 9 | Biến động giữa request (`pm.environment.set`) | token, `product_id`, `total_products`, `cart_before` | [x] |
| 10 | `pm.sendRequest` (setup trong script) | dọn fixture ở `00-setup` và `99-teardown` | [x] |
| 11 | Newman CLI + **htmlextra** reporter | `tools/run-newman.sh` · 4 report HTML | [x] |
| 12 | Newman trong **CI/CD** (GitHub Actions) | `.github/workflows/api-tests.yml` — 2 lượt mẫu §6 | [x] |
| 13 | **Mock server** | **KHÔNG dùng** — cần Postman Cloud; `tools/gen-artifacts.mjs` giữ vai trò nguồn spec | [ ] |
| 14 | **Monitor** | **KHÔNG dùng** — cần Postman Cloud; lịch chạy do GitHub Actions đảm nhiệm | [ ] |
| 15 | **Examples** / tài liệu collection | mỗi collection có `description` ghi rõ được sinh từ spec nào | [x] |

## Cách chạy

```bash
npm run preflight            # SUT sống? tài khoản seed còn? 3 API phản hồi?
npm run seed:api             # fixture + CSV data-driven
npm run test:api1            # hoặc test:api2 / test:api3 / test:all
npm run summary              # reports/newman/*.json -> test-cases/test-summary/summary.md
```

Chạy data-driven bằng tay:

```bash
newman run postman/collections/23127178_api-01-products-search.postman_collection.json \
  -e postman/environments/HW06-local.postman_environment.json \
  -d postman/data/search-terms.csv \
  --reporters cli,htmlextra --reporter-htmlextra-export reports/newman/api-01-datadriven.html
```
