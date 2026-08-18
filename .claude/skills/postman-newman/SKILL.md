---
name: postman-newman
description: Turn an audited HW06 test-case table into a runnable Postman collection and execute it with Newman — folder layout, collection-level X-Student-Id pre-request script, pm.test assertions, JSON schema checks, data-driven CSV runs, HTML report, and the CI gate against the expected-failures baseline. Use after api-test-audit, or whenever a Newman run needs to be executed or debugged.
---

# Postman + Newman Skill (HW06 §6.4)

## Bất biến — sai một trong ba là mất điểm §11

1. **Mọi** request phải mang header `X-Student-Id: 23127178`. Đặt ở **pre-request script cấp
   collection** (`postman/prerequest-collection.js`), không gắn tay từng request — hơn 100 request,
   sót một cái là mất bằng chứng cho request đó.
2. Hostname trong output Newman phải là `localhost` / `127.0.0.1` — đúng nơi triển khai của mình.
3. Ảnh console Postman chứng minh header có thật: `View → Show Postman Console`, chụp lúc chạy.

## Cấu trúc collection

```
23127178_<api-slug>.postman_collection.json
├── 00-setup             login admin/user/user2 → pm.environment.set(token) · tạo fixture
├── 10-domain-<param>    một folder cho MỖI tham số
├── 20-state-*           chuỗi request có thứ tự
├── 30-security-*        SEC-02/03/04/05 · IDOR · SQLi
├── 40-schema-*          pm.response.to.have.jsonSchema
└── 99-teardown          xoá fixture đã tạo
```

## Viết assertion — mạnh hơn "status 200"

```js
// Yếu: chỉ nói "có phản hồi", không nói "phản hồi đúng"
pm.test("status 200", () => pm.response.to.have.status(200));

// Đủ: status + kiểu + hình dạng, và nói được LỆCH Ở ĐÂU khi đỏ
pm.test("TC-PRODLIST-012 · body là mảng sản phẩm đúng schema", () => {
  pm.response.to.have.status(200);
  pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
  pm.response.to.have.jsonSchema({
    type: "array",
    items: {
      type: "object",
      required: ["id", "name", "price"],
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        price: { type: "number" },   // bug H4: id chẵn trả price dạng string → assertion này đỏ
      },
    },
  });
});
```

Ba mẹo đúng cho bài này:

- **Test security phải chứng minh tác động.** SQLi: lưu số dòng của lượt hợp lệ vào biến, rồi so với
  lượt có payload. Role escalation: sau khi PUT bằng token user thường, `GET` lại để chứng minh dữ
  liệu **đã đổi thật**.
- **Đừng hard-code số dòng.** DB local (đã seed nhiều lần) khác DB sạch trên CI. So **tương đối**
  (trước/sau) trong cùng một lượt.
- **Test bắt bug thì assertion phải đỏ.** Đừng viết `expect(price).to.satisfy(v => true)` cho qua —
  đỏ ở đây là kết quả mong đợi, và `ci/expected-failures.json` là nơi ghi nhận số đỏ đã biết.

## Data-driven (§6 đòi liệt kê feature đã dùng)

CSV sinh bằng `npm run seed:api` → `postman/data/*.csv`. Trong request dùng `{{search_term}}`,
`{{expect_status}}`; assertion đọc `pm.iterationData.get("partition")` để thông báo đỏ nói được
**phân vùng nào** hỏng.

```bash
newman run postman/collections/23127178_api-01-products-search.postman_collection.json \
  -e postman/environments/HW06-local.postman_environment.json \
  -d postman/data/search-terms.csv \
  --reporters cli,htmlextra --reporter-htmlextra-export reports/newman/api-01-datadriven.html
```

## Chạy và lấy số liệu

```bash
npm run preflight     # SUT sống? token seed còn? — môi trường chết thì mọi số liệu vô nghĩa
npm run test:api1     # tools/run-newman.sh: HTML + JSON, tên file có timestamp
npm run summary       # reports/newman/*.json → test-cases/test-summary/summary.md
```

**Không** gõ tay số executed/passed/failed vào README hay báo cáo. `summary.md` là nguồn duy nhất.

## Cổng CI

`tools/ci-gate.mjs` so số assertion đỏ với `ci/expected-failures.json`. Sau lượt chạy đầu tiên: điền
`expected_failed` cho từng collection **kèm `reason` trỏ tới bug**. Đổi số đó về sau là một hành động
có chủ ý và phải đi kèm commit riêng.
