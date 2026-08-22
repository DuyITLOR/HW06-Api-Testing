#!/usr/bin/env node
// ============================================================================
// check-submission.mjs — soát tính toàn vẹn của BỘ NỘP (lượt soát 4).
//
//   node tools/check-submission.mjs      (npm run check:submission)
//
// Những bất biến mà 3 lượt soát trước chưa kiểm:
//   1. mọi bug trong bug-report phải trỏ tới test case CÓ THẬT
//   2. mọi số issue nêu trong tài liệu phải tồn tại trên GitHub
//   3. mọi ảnh được tài liệu trỏ tới phải có file
//   4. PDF phải MỚI HƠN file .md nguồn (PDF cũ = báo cáo nộp khác báo cáo trong repo)
//   5. 4 collection phải dùng CÙNG một pre-request script
//   6. số dòng trong Excel phải khớp số case thật
//   7. không còn placeholder (TODO, chưa viết, điền sau, XXX) trong tài liệu nộp
//   8. mọi SEC-0x nêu trong traceability phải có trong README của SUT
// ============================================================================
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
const read = (f) => (existsSync(f) ? readFileSync(f, "utf8") : "");
let bad = 0, ok = 0;
const P = (m) => { console.log(`  [OK]   ${m}`); ok++; };
const F = (m) => { console.log(`  [LECH] ${m}`); bad++; };

// 1. bug → test case có thật
const specs = {};
for (const s of ["api-01-products-search", "api-02-cart-add", "api-03-product-update"])
  specs[s] = (await import(`../generator/specs/${s}.mjs`)).default;
const allTc = new Set(Object.values(specs).flatMap((sp) => sp.cases.map((c) => c.id)));
const bug = read("bug-report/bug-report.md");
const cited = [...bug.matchAll(/\bTC-[A-Z]+-\d{3}\b/g)].map((m) => m[0]);
const ghost = [...new Set(cited)].filter((t) => !allTc.has(t));
ghost.length ? F(`bug-report trỏ ${ghost.length} test case không tồn tại: ${ghost.join(", ")}`)
             : P(`bug-report trỏ ${new Set(cited).size} test case, đều tồn tại`);

// 2. issue number có thật
const issues = [...new Set([...read("README.md").matchAll(/issues\/(\d+)/g)].map((m) => m[1]))].slice(0, 4);
for (const n of issues) {
  try {
    const st = execSync(`gh issue view ${n} --repo DuyITLOR/group05_eshop --json state -q .state 2>/dev/null`, { encoding: "utf8" }).trim();
    st ? P(`issue #${n} tồn tại (${st})`) : F(`issue #${n} không đọc được`);
  } catch { F(`issue #${n} KHÔNG tồn tại trên GitHub`); }
}

// 3. ảnh được trỏ tới
const docs = ["README.md", "report/main-report.md", "ci/ci-report.md", "bug-report/bug-report.md", "generator/design.md"];
const imgs = new Set();
for (const d of docs) for (const m of read(d).matchAll(/\(([^)]*?screenshots\/[^)]+?\.png)\)/g)) imgs.add(m[1].replace(/^\.\.\//, ""));
for (const m of read("generator/design.md").matchAll(/\((diagram\/[^)]+?\.png)\)/g)) imgs.add("generator/" + m[1]);
const deadImg = [...imgs].filter((f) => !existsSync(f));
deadImg.length ? F(`${deadImg.length} ảnh được trỏ nhưng không có file: ${deadImg.join(", ")}`)
               : P(`${imgs.size} ảnh được tài liệu trỏ tới đều có file`);

// 4. PDF mới hơn .md
for (const md of ["report/main-report.md", "ai-audit/ai-audit-report.md", "ai-audit/ai-critique.md", "bug-report/bug-report.md", "ci/ci-report.md", "generator/design.md"]) {
  const pdf = md.replace(/\.md$/, ".pdf");
  if (!existsSync(pdf)) { F(`thiếu ${pdf}`); continue; }
  statSync(pdf).mtimeMs >= statSync(md).mtimeMs ? P(`${pdf} mới hơn nguồn`) : F(`${pdf} CŨ HƠN ${md} — xuất lại: npm run pdf`);
}

// 5. pre-request script giống nhau ở 4 collection
const pre = readdirSync("postman/collections").filter((f) => f.endsWith(".json"))
  .map((f) => JSON.stringify(JSON.parse(read(`postman/collections/${f}`)).event?.find((e) => e.listen === "prerequest")?.script?.exec));
new Set(pre).size === 1 ? P(`cả ${pre.length} collection dùng cùng pre-request script`)
                        : F(`pre-request script KHÁC nhau giữa các collection (${new Set(pre).size} bản)`);

// 6. Excel khớp số case
const tc = Object.values(specs).reduce((a, s) => a + s.cases.length, 0);
read("README.md").includes(`**${tc}**`) ? P(`README công bố ${tc} case — khớp specs`) : F(`README không công bố ${tc} case`);

// 7. placeholder còn sót
const PH = ["TODO", "FIXME", "chưa viết", "điền sau", "(điền hash)", "XXX", "lorem"];
for (const d of [...docs, "TASKS.md", "test-cases/test-summary/traceability-matrix.md", "ai-audit/ai-audit-report.md", "ai-audit/ai-critique.md"]) {
  const hit = PH.filter((k) => read(d).includes(k));
  hit.length ? F(`${d} còn placeholder: ${hit.join(", ")}`) : P(`${d} không còn placeholder`);
}

// 8. SEC nêu trong traceability phải có trong README SUT
const sut = read("../eshop-sut/README.md");
const secs = [...new Set([...read("test-cases/test-summary/traceability-matrix.md").matchAll(/SEC-0\d/g)].map((m) => m[0]))];
const noSec = secs.filter((s) => !sut.includes(s));
noSec.length ? F(`traceability nêu ${noSec.join(", ")} nhưng README SUT không có`) : P(`${secs.length} mã SEC nêu trong traceability đều có trong README SUT`);

// 9. mọi hash commit nêu trong AI audit phải là commit thật
const aud = read("ai-audit/ai-audit-report.md");
const hs = [...new Set([...aud.matchAll(/- \*\*Commit:\*\* `([0-9a-f]{7})`/g)].map((m) => m[1]))];
let hbad = 0;
for (const h of hs) { try { execSync(`git cat-file -e ${h}^{commit}`, { stdio: "ignore" }); } catch { F(`AI audit nêu commit ${h} KHÔNG tồn tại`); hbad++; } }
if (!hbad) P(`${hs.length} hash commit trong AI audit đều là commit thật`);

// 10. Excel phải có đúng số dòng case
try {
  const rows = execSync(`python3 -c "
from openpyxl import load_workbook
wb = load_workbook('excel/23127178_HW06_TestCases.xlsx')
print(sum(ws.max_row-1 for ws in wb if ws.title.startswith('API-')))"`, { encoding: "utf8" }).trim();
  Number(rows) === tc ? P(`Excel có ${rows} dòng case — khớp ${tc} case trong specs`)
                      : F(`Excel có ${rows} dòng case nhưng specs có ${tc}`);
} catch (e) { F(`không đọc được Excel: ${String(e.message).slice(0, 60)}`); }

// 11. commit log phải mới — nhưng KHÔNG thể chứa chính commit đã đưa nó vào repo.
// Xuất log → commit → HEAD đổi → log lại "thiếu HEAD": bất biến "phải chứa HEAD" là bất khả thi.
// Bất biến đúng: log chứa HEAD **hoặc** HEAD~1, tức đi sau tối đa một commit (chính commit xuất log).
const log = read("git-log/commit-log.txt");
const head = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
const prev = execSync("git rev-parse --short HEAD~1", { encoding: "utf8" }).trim();
log.includes(head) ? P(`commit-log.txt có commit mới nhất (${head})`)
  : log.includes(prev) ? P(`commit-log.txt đi sau đúng 1 commit (${prev}) — đó là commit xuất chính nó`)
  : F(`commit-log.txt CŨ hơn 1 commit — xuất lại: bash tools/commit-plan.sh log`);

console.log(`\n  ${ok} khớp · ${bad} lệch\n`);
process.exit(bad ? 1 : 0);
