#!/usr/bin/env node
// ============================================================================
// check-expect-vs-checks.mjs — bắt đúng loại lỗi #12: **assertion nghiêm hơn expected đã ghi**.
//
//   node tools/check-expect-vs-checks.mjs
//
// Vì sao cần script thay vì đọc mắt: lỗi #12 (TC-CART-020/021) sống sót qua cả lượt AI tự audit,
// và chỉ lộ ra khi đọc lại bài với vai người chấm. Một test mà cột `status`/`expect` cho phép N
// hành vi nhưng `checks` chỉ nhận M < N hành vi sẽ **đỏ oan** nếu SUT chọn hành vi còn lại — và đỏ
// oan thì bị báo thành bug của SUT. Đây là bất biến kiểm được, nên phải kiểm bằng máy.
//
// Cách kiểm: rút tập status code nêu trong cột `status` (dạng "200 / 400 / 422", "400/422", 404…)
// rồi so với tập status mà `checks` thực sự chấp nhận (`status` hoặc `statusIn`).
// ============================================================================
const SLUGS = ["api-01-products-search", "api-02-cart-add", "api-03-product-update"];
const nums = (s) => [...String(s).matchAll(/\b([1-5]\d\d)\b/g)].map((m) => Number(m[1]));

let problems = 0, checked = 0;
for (const slug of SLUGS) {
  const spec = (await import(`../generator/specs/${slug}.mjs`)).default;
  for (const c of spec.cases) {
    const declared = new Set(nums(c.status));
    if (!declared.size) continue;                       // status kiểu "400/422" không số → bỏ
    const accepted = new Set();
    for (const ch of c.checks || []) {
      if (ch[0] === "status") accepted.add(Number(ch[1]));
      if (ch[0] === "statusIn") nums(ch[1]).forEach((n) => accepted.add(n));
    }
    if (!accepted.size) continue;                        // case không assert status → bỏ
    checked++;
    const missing = [...declared].filter((n) => !accepted.has(n));
    if (missing.length) {
      problems++;
      console.log(`  [LECH] ${c.id}`);
      console.log(`         cột status ghi : ${c.status}`);
      console.log(`         assertion nhận : ${[...accepted].join(", ")}`);
      console.log(`         → thiếu        : ${missing.join(", ")} (SUT trả mã này thì test đỏ OAN)`);
    }
  }
}
console.log(`\n  đã kiểm ${checked} case có assert status · ${problems} case lệch`);
process.exit(problems ? 1 : 0);
