#!/usr/bin/env node
// ============================================================================
// prep-own.mjs — dựng KHUNG cho test case sinh viên tự viết (§6.3).
//
//   npm run prep:own
//
// Script này điền **cấu trúc**, không điền **nội dung**: TC ID đã đánh số, 5 dòng trống, danh sách ô
// phủ còn thiếu của đúng API đó, và checklist cách nghĩ ra case. Phần phải tự viết: tham số & phân
// vùng · request · expected · **căn cứ**.
//
// Vì sao không sinh luôn nội dung: §6.3 đòi *"five test cases of **your own**"*. AI viết rồi dán nhãn
// `SV` chính là lỗi #23 của bài này (22 case bị gán nhãn sai) — tái phạm thì mất đúng số điểm vừa mất.
// ============================================================================
import { readFileSync, writeFileSync } from "node:fs";

const APIS = [
  ["api-01-products-search", "TC-PRODLIST", "GET /api/products", "search (query)"],
  ["api-02-cart-add", "TC-CART", "POST /api/cart", "id · name · price · quantity · Authorization"],
  ["api-03-product-update", "TC-PRODUPD", "PUT /api/products/:id", ":id · name · price · description · imageUrl · category_id · Authorization"],
];
const SECS = ["SEC-01","SEC-02","SEC-03","SEC-04","SEC-05","SEC-06","SEC-07"];

for (const [slug, prefix, endpoint, params] of APIS) {
  const spec = (await import(`../generator/specs/${slug}.mjs`)).default;
  const covered = SECS.filter((x) => spec.cases.some((c) => `${c.tech} ${c.basis}`.includes(x)));
  const uncovered = SECS.filter((x) => !covered.includes(x));
  const byTech = ["Domain", "State", "Security", "Schema"].map((t) =>
    `${t} ${spec.cases.filter((c) => String(c.tech).startsWith(t)).length}`).join(" · ");

  const rows = [1, 2, 3, 4, 5].map((i) =>
    `| ${prefix}-20${i} | | | \`${endpoint}\` | | | | | | SV | VALID | |`).join("\n");
  const why = [1, 2, 3, 4, 5].map((i) => `| ${prefix}-20${i} | | | |`).join("\n");

  const md = `# ${slug} · §6.3 — test case **do sinh viên tự viết**

> Đề §6.3: *"Add at least **five** test cases of **your own** that the AI missed — and explain **why** the
> AI missed them (prompt quality, model limitations, or characteristics of the API)."*
>
> \`extended.md\` **không** tính vào yêu cầu này: các case ở đó do AI sinh ở lượt hai (\`Nguồn = AI-2\`).

## Trạng thái phủ hiện tại của ${endpoint}

- Tham số của API này: ${params}
- Số case theo nhóm: **${byTech}**
- SEC đã chạm ở API này: ${covered.join(", ") || "—"}
- **SEC chưa chạm ở API này: ${uncovered.join(", ") || "— (đã phủ hết)"}**

## Cách nghĩ ra 5 case trong ~15 phút

Chọn 5 chỗ từ danh sách dưới, mỗi chỗ một case. Đây là **hướng để tìm**, không phải case sẵn:

1. Một **mã SEC chưa chạm** ở trên — hỏi: yêu cầu đó nói gì, và endpoint này có vi phạm được không?
2. Một **tham số** trong danh sách trên mà bạn thấy chưa bị đẩy tới cực trị (rỗng · thiếu hẳn · sai kiểu ·
   rất dài · Unicode có dấu · ký tự đặc biệt của tầng dưới như \`%\` \`_\` \`'\`).
3. Một **chuỗi trạng thái** chưa ai chạy: làm A rồi làm B rồi đọc lại — kết quả có còn hợp lý?
4. Một **hệ quả** chưa được kiểm: request trả 200, nhưng dữ liệu trong CSDL/giỏ sau đó có đúng không?
5. Một **route lân cận** cùng nhóm quyền với endpoint này (xem \`eshop-sut/api_specification.md\`).

Với mỗi case, bắt buộc có **Căn cứ** trỏ được vào \`spec §…\` / \`FR-…\` / \`SEC-0…\` / \`server.js:dòng\`.
Không có căn cứ thì expected là suy đoán — và suy đoán sinh ra **bug giả** (xem lỗi #1–#3 ở báo cáo §11).

Xong thì tự chạy bằng \`curl\` để xác nhận expected, rồi \`npm run check:own\` và \`npm run verify\`.

## Bảng test case của sinh viên (điền 5 dòng)

| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |
|---|---|---|---|---|---|---|---|---|---|---|---|
${rows}

## Vì sao AI bỏ sót (§6.3 — đúng 3 nhóm lý do)

| TC ID | AI bỏ sót gì | Nhóm lý do | Giải thích |
|---|---|---|---|
${why}
`;
  writeFileSync(`test-cases/${slug}/own.md`, md, "utf8");
  console.log(`  → test-cases/${slug}/own.md — 5 dòng trống, SEC chưa chạm: ${uncovered.join(", ") || "—"}`);
}
console.log("\n  Điền xong: npm run check:own\n");
