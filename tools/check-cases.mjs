#!/usr/bin/env node
// ============================================================================
// check-cases.mjs — soát NỘI DUNG 136 test case, không chỉ số lượng.
//
//   node tools/check-cases.mjs      (hoặc: npm run check:cases)
//
// Bảy bất biến, mỗi cái tương ứng một cách bài này có thể sai mà vẫn "trông đủ":
//   1. TC ID không trùng trong một API, không dùng lại giữa hai API
//   2. cột `Căn cứ` phải trỏ vào nguồn KIỂM ĐƯỢC (spec §, FR-, SEC-0, đề §, server.js, database.js)
//      — đây là phép kiểm chống đúng loại lỗi #1–#3: expected không có căn cứ
//   3. nhãn audit phải là VALID/INVALID/INCOMPLETE, và INVALID/INCOMPLETE phải kèm lý do
//   4. case nhóm Security phải trỏ tới một SEC-0x, hoặc nói rõ "ngoài SEC-01…07"
//   5. mọi case phải có assertion
//   6. mỗi case sinh viên tự thêm phải có dòng "vì sao AI bỏ sót", nhóm lý do đúng 3 loại §6.3
//   7. mọi case trong bảng phải có mặt trong collection đã sinh (bảng và collection không được lệch)
//
// Lượt chạy đầu tiên của script này tìm ra 2 case (TC-CART-101/102) dán nhãn Security nhưng căn cứ
// chỉ trỏ FR-07/FR-08 — vì **SEC-01…07 của SUT không có mục nào về toàn vẹn giá/tiền**. Đã ghi rõ
// ngoại lệ đó vào spec thay vì đổi nhãn cho script im lặng.
// ============================================================================
// Soát nội dung test case: căn cứ có thật không · nhãn audit có nhất quán không · ID có trùng không
const SLUGS = ["api-01-products-search","api-02-cart-add","api-03-product-update"];
const GROUPS = ["prompt quality","model limitations","characteristics of the API"];
let issues = [];
const allIds = new Map();

for (const slug of SLUGS) {
  const spec = (await import(`../generator/specs/${slug}.mjs`)).default;
  const ids = new Set();
  for (const c of [...spec.setup, ...spec.cases, ...(spec.teardown||[])]) {
    if (ids.has(c.id)) issues.push(`[TRÙNG ID] ${slug}: ${c.id}`);
    ids.add(c.id);
    if (allIds.has(c.id) && c.id.startsWith("TC-")) issues.push(`[ID DÙNG 2 API] ${c.id}`);
    if (c.id.startsWith("TC-")) allIds.set(c.id, slug);
  }
  for (const c of spec.cases) {
    // 1. căn cứ phải trỏ vào nguồn kiểm được
    const b = String(c.basis||"");
    if (!/spec §|FR-\d|SEC-0|server\.js|đề §|database\.js/.test(b))
      issues.push(`[CĂN CỨ MƠ HỒ] ${c.id}: "${b}"`);
    // 2. nhãn audit phải là 1 trong 3, và INVALID/INCOMPLETE phải có lý do
    const a = String(c.audit||"");
    if (!/^(VALID|INVALID|INCOMPLETE)/.test(a)) issues.push(`[NHÃN LẠ] ${c.id}: "${a.slice(0,40)}"`);
    if (/^(INVALID|INCOMPLETE)/.test(a) && a.length < 40) issues.push(`[NHÃN THIẾU LÝ DO] ${c.id}`);
    // 3. case Security phải có SEC-0x trong tech hoặc basis
    if (/^Security/.test(c.tech) && !/SEC-0/.test(c.tech + b) && !/ngoài SEC/.test(c.tech + b)) issues.push(`[SECURITY KHÔNG TRỎ SEC] ${c.id}`);
    // 4. có checks
    if (!c.checks?.length) issues.push(`[KHÔNG CÓ ASSERTION] ${c.id}`);
    // 5. folder phải khớp nhóm kỹ thuật
    const f = String(c.folder||"");
    const t = String(c.tech||"");
    if (/^10-|^11-|^12-|^13-/.test(f) && !/Domain|Security|Schema|State/.test(t)) issues.push(`[FOLDER/TECH LỆCH] ${c.id}: ${f} vs ${t}`);
  }
  // 6. whyMissed: đủ mỗi case SV, và nhóm lý do đúng 3 loại
  // Bất biến chống misattribution: nhãn `SV` chỉ được dùng cho case sinh viên TỰ VIẾT (file own.md).
  // Case do AI sinh ở lượt hai phải là `AI-2`. Bản trước gán `SV` cho 22 case do AI sinh.
  const sv = spec.cases.filter(c=>c.src==="AI-2").map(c=>c.id);
  for (const c of spec.cases) if (c.src === "SV") issues.push(`[NHÃN SV CHO CASE KHÔNG DO SV VIẾT] ${c.id} — dùng "AI-2" hoặc chuyển sang own.md`);
  const wm = new Map((spec.whyMissed||[]).map(w=>[w.id,w]));
  for (const id of sv) if (!wm.has(id)) issues.push(`[THIẾU LÝ DO AI BỎ SÓT] ${id}`);
  for (const [id,w] of wm) {
    if (!sv.includes(id)) issues.push(`[LÝ DO CHO CASE KHÔNG PHẢI SV] ${id}`);
    if (!GROUPS.includes(w.group)) issues.push(`[NHÓM LÝ DO SAI] ${id}: "${w.group}"`);
    if (String(w.why||"").length < 60) issues.push(`[LÝ DO QUÁ NGẮN] ${id}`);
  }
  // 7. mọi case phải có mặt trong collection đã sinh
  const col = JSON.parse((await import("node:fs")).readFileSync(`postman/collections/23127178_${slug}.postman_collection.json`,"utf8"));
  const inCol = new Set();
  const walk = (it)=>it.forEach(x=>x.item?walk(x.item):inCol.add(x.name.split(" · ")[0]));
  walk(col.item);
  for (const c of spec.cases) if (!inCol.has(c.id)) issues.push(`[CÓ TRONG BẢNG, THIẾU TRONG COLLECTION] ${c.id}`);
}
// 8. danh sách case "ĐỎ ở lượt nộp" nêu trong audit.md phải khớp raw JSON của Newman
//    (bản trước ghi sai: liệt kê case XANH và gộp khoảng "101–107")
{
  const { readFileSync, readdirSync } = await import("node:fs");
  for (const slug of SLUGS) {
    const md = readFileSync(`test-cases/${slug}/audit.md`, "utf8");
    const m = md.match(/case dưới đây ĐỎ ở lượt nộp[^`]*`([^`]+)`/);
    if (!m) continue;
    const claimed = new Set(m[1].split("·").map((x) => x.trim()));
    const f = readdirSync("reports/newman").filter((x) => x.includes(slug) && x.endsWith(".json")).sort().pop();
    const run = JSON.parse(readFileSync(`reports/newman/${f}`, "utf8")).run;
    const real = new Set(run.failures.map((fl) => fl.source.name.split(" · ")[0].split("-").pop()));
    const extra = [...claimed].filter((x) => !real.has(x));
    const miss = [...real].filter((x) => !claimed.has(x));
    if (extra.length) issues.push(`[AUDIT NÊU CASE KHÔNG ĐỎ] ${slug}: ${extra.join(", ")}`);
    if (miss.length) issues.push(`[AUDIT THIẾU CASE ĐỎ] ${slug}: ${miss.join(", ")}`);
  }
}

console.log(issues.length ? issues.map(s=>"  "+s).join("\n") : "  không tìm thấy vấn đề");
console.log(`\n  ${allIds.size} test case · ${issues.length} vấn đề`);
