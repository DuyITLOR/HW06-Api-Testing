#!/usr/bin/env node
// ============================================================================
// check-claims.mjs — soát MỌI con số công bố trong tài liệu so với dữ liệu thật.
//
//   node tools/check-claims.mjs
//
// Vì sao cần: bài này có 7 tài liệu cùng nhắc tới một bộ số (136 case · 333 assertion · 89 đỏ ·
// 19 bug · 43/46/47 case mỗi API). Mỗi lần sửa test case là mỗi lần 7 chỗ có thể lệch nhau, và
// người đọc không có cách nào biết chỗ nào đúng. Lượt soát lần hai đã tìm ra 3 lỗi loại này bằng
// mắt; script hoá nó để lần sau không phải trông vào mắt.
// ============================================================================
import { readFileSync, readdirSync, existsSync } from "node:fs";

const read = (f) => (existsSync(f) ? readFileSync(f, "utf8") : "");
let bad = 0, ok = 0;
const check = (what, actual, ...files) => {
  const missing = files.filter((f) => !read(f).includes(String(actual)));
  if (missing.length) { console.log(`  [LECH] ${what} = ${actual} — không thấy trong: ${missing.join(", ")}`); bad++; }
  else { console.log(`  [OK]   ${what} = ${actual}`); ok++; }
};
// Bỏ qua dòng đang **kể lại** một số liệu cũ (bảng lỗi §11 ghi "… 329 assertion (số thật 333)").
// Không có ngoại lệ này thì checker tự báo đỏ vì chính phần tài liệu hoá lỗi — đúng họ lỗi #11:
// phép kiểm nghiêm hơn ý định. Marker: dòng có "(số thật" hoặc "số thật là".
const isHistory = (line) => /\(số thật|số thật là|số lúc đó|lúc đó|bản trước|hạ 3 mục|Interaction #/.test(line);
const forbid = (what, wrong, ...files) => {
  const hit = files.filter((f) => read(f).split("\n").some((L) => L.includes(String(wrong)) && !isHistory(L)));
  if (hit.length) { console.log(`  [LECH] ${what}: còn dấu vết cũ "${wrong}" trong ${hit.join(", ")}`); bad++; }
  else { console.log(`  [OK]   ${what}: không còn "${wrong}"`); ok++; }
};

// ── số liệu thật, rút từ raw JSON của Newman ───────────────────────────────
const SLUGS = ["api-01-products-search", "api-02-cart-add", "api-03-product-update"];
const latest = (slug) => {
  const fs = readdirSync("reports/newman").filter((f) => f.includes(slug) && f.endsWith(".json")).sort();
  return fs.length ? JSON.parse(readFileSync(`reports/newman/${fs[fs.length - 1]}`, "utf8")).run : null;
};
let T = { a: 0, f: 0, r: 0 };
for (const s of SLUGS) { const r = latest(s); T.a += r.stats.assertions.total; T.f += r.stats.assertions.failed; T.r += r.stats.requests.total; }

// ── số test case thật, rút từ generator/specs ─────────────────────────────
const counts = {};
for (const s of SLUGS) {
  const spec = (await import(`../generator/specs/${s}.mjs`)).default;
  counts[s] = { total: spec.cases.length + (spec.own || []).length, sv: (spec.own || []).length };
}
const totalCases = Object.values(counts).reduce((a, c) => a + c.total, 0);

const R = "report/main-report.md", RM = "README.md", SUM = "test-cases/test-summary/summary.md";
console.log("\n══ Soát con số công bố ══════════════════════════════════════════════════");
check("tổng test case", totalCases, R, RM);
check("tổng assertion", T.a, R, RM, SUM);
check("assertion đỏ", T.f, R, RM, SUM);
check("assertion xanh", T.a - T.f, R, RM, SUM);
check("tổng request", T.r, R, RM, SUM);
for (const s of SLUGS) check(`case ${s}`, counts[s].total, R, RM);
check("số bug", 19, R, RM, "bug-report/bug-report.md");
check("regression suite assertion", 216, R, RM, "ci/ci-report.md");

console.log("\n── Dấu vết số liệu cũ ───────────────────────────────────────────────────");
forbid("assertion cũ", "329 assertion", R, RM);
forbid("passed cũ", "240 assertion xanh", R, RM);
forbid("API-02 cũ", "81 assertion", R, RM);
forbid("file lượt chạy cũ", "20260822-2217", R, RM, "ci/ci-report.md");
// Bộ chuỗi số cũ mà lượt soát thứ sáu bắt được — mỗi tài liệu nhắc số phải nhắc số HIỆN TẠI.
const DOCS = [R, RM, SUM, "postman/README.md", "generator/design.md", "generator/diagram/README.md",
              "ci/ci-report.md", "TASKS.md", "test-cases/test-summary/traceability-matrix.md",
              "ai-audit/ai-audit-report.md", "bug-report/bug-report.md"];
forbid("tổng case cũ (136)", "136 case", ...DOCS);
forbid("tổng case cũ (136 test case)", "136 test case", ...DOCS);
forbid("assertion cũ (333)", "333 assertion", ...DOCS);
forbid("assertion cũ (368)", "368 assertion", ...DOCS);
forbid("đỏ cũ (89)", "89 assertion đỏ", ...DOCS);
forbid("đỏ cũ (97)", "97 assertion đỏ", ...DOCS);
forbid("nhãn cũ BUG-20", "BUG-20", ...DOCS);
forbid("nhãn cũ BUG-21", "BUG-21", ...DOCS);
forbid("nhãn cũ BUG-22", "BUG-22", ...DOCS);
forbid("tự chấm cũ (94)", "nguyên trạng → **94**", RM);
forbid("câu 'chưa có bản nộp' (sơ đồ)", "chưa có bản nộp", R, RM, "generator/design.md", "generator/diagram/README.md");

console.log("\n── File được tài liệu trỏ tới có tồn tại không ───────────────────────────");
const refs = [...read(R).matchAll(/\((\.\.\/[^)]+?)\)/g)].map((m) => m[1].replace("../", ""))
  .concat([...read(RM).matchAll(/\]\(((?!http)[^)]+?)\)/g)].map((m) => m[1]))
  .filter((f) => !f.startsWith("#") && !f.includes("://"));
const dead = [...new Set(refs)].filter((f) => !existsSync(f.split("#")[0]));
if (dead.length) { console.log(`  [LECH] ${dead.length} link trỏ tới file không tồn tại:`); dead.forEach((d) => console.log(`         ${d}`)); bad++; }
else { console.log(`  [OK]   ${new Set(refs).size} link nội bộ đều trỏ tới file có thật`); ok++; }

console.log("\n── Hash commit nêu trong tài liệu ───────────────────────────────────────");
import { execSync } from "node:child_process";
const hashes = [...read("ci/ci-report.md").matchAll(/`([0-9a-f]{7})`/g)].map((m) => m[1]);
for (const h of [...new Set(hashes)]) {
  try { execSync(`git cat-file -e ${h}^{commit}`, { stdio: "ignore" }); console.log(`  [OK]   commit ${h} tồn tại`); ok++; }
  catch { console.log(`  [LECH] commit ${h} KHÔNG tồn tại`); bad++; }
}

console.log(`\n  ${ok} khớp · ${bad} lệch\n`);
process.exit(bad ? 1 : 0);
