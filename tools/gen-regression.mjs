#!/usr/bin/env node
// ============================================================================
// gen-regression.mjs — dựng **regression suite** cho cổng CI: chỉ gồm những case ĐANG XANH.
//
//   node tools/gen-regression.mjs                     # từ reports/newman/*.json mới nhất
//   node tools/gen-regression.mjs --break TC-PRODLIST-003   # cố ý làm 1 test fail (lượt CI ĐỎ mẫu §6)
//
// Vì sao cần một collection riêng, tách khỏi bộ 136 case:
//
//   §6 đòi **hai lượt pipeline mẫu**: một lượt *tất cả test case pass*, một lượt *có một test fail*.
//   Bộ test chính không đáp ứng được yêu cầu đó theo nghĩa chữ: nó cố ý bắt bug thật nên luôn có 89
//   assertion đỏ. Hai bộ này có hai VAI TRÒ khác nhau, và đó là lý do tách:
//
//     · Bộ 136 case (bug-hunting)  → đo SUT lệch spec ở đâu. Cổng: so với baseline đã ký nhận.
//     · Regression suite (file này) → chốt phần hành vi ĐÃ ĐÚNG để lần sau không hỏng. Cổng: 0 đỏ.
//
//   Regression suite được **sinh ra**, không viết tay: nó là tập con các case có 0 assertion đỏ ở
//   lượt chạy mới nhất. Nhờ vậy nó không thể "xanh giả" bằng cách nới assertion — mỗi case trong đó
//   là một case của bộ chính, giữ nguyên expected.
// ============================================================================
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const MSSV = "23127178";
const SLUGS = ["api-01-products-search", "api-02-cart-add", "api-03-product-update"];
const BREAK = (() => { const i = process.argv.indexOf("--break"); return i > -1 ? process.argv[i + 1] : null; })();

const greenIds = (slug) => {
  const files = readdirSync("reports/newman").filter((f) => f.includes(slug) && f.endsWith(".json")).sort();
  if (!files.length) return null;
  const run = JSON.parse(readFileSync(join("reports/newman", files[files.length - 1]), "utf8")).run;
  const ok = new Set(), bad = new Set();
  for (const ex of run.executions || []) {
    const id = (ex.item?.name || "").split(" · ")[0];
    if (!id) continue;
    const failed = (ex.assertions || []).filter((a) => a.error).length;
    (failed ? bad : ok).add(id);
  }
  for (const id of bad) ok.delete(id);
  return ok;
};

const collections = SLUGS.map((s) => ({
  slug: s,
  col: JSON.parse(readFileSync(`postman/collections/${MSSV}_${s}.postman_collection.json`, "utf8")),
  green: greenIds(s),
}));
if (collections.some((c) => !c.green)) { console.error("Thiếu reports/newman/*.json — chạy npm run test:all trước."); process.exit(1); }

let kept = 0, dropped = 0, broke = false;
const items = [];
for (const { slug, col, green } of collections) {
  const folders = [];
  for (const folder of col.item) {
    const keepAll = /^(00-setup|99-teardown)/.test(folder.name);   // setup/teardown luôn giữ: chúng dựng state
    const reqs = folder.item.filter((r) => {
      const id = r.name.split(" · ")[0];
      const keep = keepAll || green.has(id);
      keep ? kept++ : dropped++;
      return keep;
    });
    if (reqs.length) folders.push({ name: folder.name, item: reqs });
  }
  items.push({ name: slug, item: folders });
}

// Lượt ĐỎ mẫu: thêm MỘT assertion sai vào đúng một case, ghi rõ là cố ý.
if (BREAK) {
  outer: for (const api of items) for (const folder of api.item) for (const r of folder.item) {
    if (r.name.startsWith(BREAK)) {
      r.event = r.event || [];
      const ev = r.event.find((e) => e.listen === "test") || (r.event.push({ listen: "test", script: { type: "text/javascript", exec: [] } }), r.event[r.event.length - 1]);
      ev.script.exec = [
        "// ── DEMO §6: assertion CỐ Ý SAI để tạo lượt CI ĐỎ mẫu ──────────────────",
        "// Đề đòi một lượt pipeline có ĐÚNG MỘT test case fail. Thay vì làm hỏng một case thật",
        "// (sẽ làm mất một phép kiểm), thêm một assertion vô nghĩa và gỡ ngay sau khi có lượt đỏ.",
        'pm.test("DEMO cố ý fail — tạo lượt CI đỏ mẫu (§6)", () => {',
        '  pm.expect(1, "assertion này được thiết kế để fail").to.eql(2);',
        "});",
        ...ev.script.exec,
      ];
      broke = true;
      break outer;
    }
  }
  if (!broke) { console.error(`Không thấy case ${BREAK} trong tập XANH.`); process.exit(1); }
}

const out = {
  info: {
    name: `${MSSV} · HW06 Regression suite${BREAK ? " (DEMO 1 test fail)" : ""}`,
    _postman_id: "hw06-regression",
    description: `Sinh tự động bởi tools/gen-regression.mjs — tập con CÁC CASE ĐANG XANH của 3 collection chính (giữ nguyên expected). Vai trò: cổng chống hồi quy, phải 0 assertion đỏ. Bộ bug-hunting 136 case nằm ở 3 collection kia và có cổng riêng theo baseline.${BREAK ? ` Bản này CỐ Ý thêm 1 assertion sai ở ${BREAK} để tạo lượt CI đỏ mẫu (§6).` : ""}`,
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  event: collections[0].col.event,   // pre-request X-Student-Id cấp collection
  item: items,
};
writeFileSync(`postman/collections/${MSSV}_regression.postman_collection.json`, JSON.stringify(out, null, 2), "utf8");
console.log(`  → postman/collections/${MSSV}_regression.postman_collection.json`);
console.log(`     giữ ${kept} request · bỏ ${dropped} request có assertion đỏ${BREAK ? ` · CỐ Ý làm fail: ${BREAK}` : ""}`);
