#!/usr/bin/env node
// summarize-newman.mjs — đọc raw JSON của Newman → sinh test-cases/test-summary/summary.md
//
//   npm run summary
//
// Đây là NGUỒN DUY NHẤT của mọi con số "executed / passed / failed" trong README và main-report.
// Gõ tay số liệu là cách nhanh nhất để hai chỗ lệch nhau và mất điểm §11.
// Với mỗi api-slug, chỉ lấy file JSON MỚI NHẤT (lượt được nộp), các lượt cũ vẫn giữ trên repo.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = "reports/newman";
const OUT = "test-cases/test-summary/summary.md";
const SLUGS = ["api-01-products-search", "api-02-cart-add", "api-03-product-update"];
const LABEL = {
  "api-01-products-search": "API-01 · Pool A · GET /api/products",
  "api-02-cart-add": "API-02 · Pool B · POST /api/cart",
  "api-03-product-update": "API-03 · Pool C · PUT /api/products/:id",
};

if (!existsSync(DIR)) { console.error(`Không thấy ${DIR}/ — chưa chạy Newman lần nào.`); process.exit(1); }

const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
const latest = {};
for (const slug of SLUGS) {
  const mine = files.filter((f) => f.includes(slug)).sort();
  if (mine.length) latest[slug] = mine[mine.length - 1];
}
if (!Object.keys(latest).length) { console.error(`Không thấy file JSON nào của 3 api-slug trong ${DIR}/`); process.exit(1); }

const rows = [];
let T = { requests: 0, assertions: 0, failed: 0, passed: 0, ms: 0 };
for (const slug of SLUGS) {
  if (!latest[slug]) { rows.push({ slug, missing: true }); continue; }
  const run = JSON.parse(readFileSync(join(DIR, latest[slug]), "utf8")).run;
  const s = run.stats;
  const assertions = s.assertions.total;
  const failed = s.assertions.failed;
  const r = {
    slug,
    file: latest[slug],
    iterations: s.iterations.total,
    requests: s.requests.total,
    reqFailed: s.requests.failed,
    assertions,
    failed,
    passed: assertions - failed,
    ms: run.timings?.completed && run.timings?.started ? run.timings.completed - run.timings.started : 0,
    started: run.timings?.started ? new Date(run.timings.started).toISOString() : "?",
    // Mỗi test case = 1 request có assertion. Đếm cả hai để §14 báo được "executed".
    failures: (run.failures || []).map((f) => ({
      name: f.source?.name || f.parent?.name || "?",
      test: f.error?.test || "",
      message: (f.error?.message || "").slice(0, 160),
    })),
  };
  rows.push(r);
  T.requests += r.requests; T.assertions += r.assertions;
  T.failed += r.failed; T.passed += r.passed; T.ms += r.ms;
}

const md = [];
md.push("# Test Summary — sinh tự động từ raw JSON của Newman");
md.push("");
md.push("> **Đừng sửa tay.** Sinh lại bằng `npm run summary`. Nguồn: `reports/newman/*.json`.");
md.push("> Mỗi api-slug lấy **lượt mới nhất**. Assertion đỏ ở đây là **kết quả mong đợi** khi test case bắt được bug thật.");
md.push("");
// KHÔNG ghi thời điểm sinh file: nó làm `git status` bẩn sau MỖI lần chạy verify (verifier sinh lại
// summary.md để so với bản trong repo). Mốc thời gian của từng lượt chạy đã có trong bảng bên dưới.
md.push("");
md.push("| API | Lượt chạy (UTC) | Iteration | Request | Assertion | Passed | **Failed** | Thời lượng |");
md.push("|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  if (r.missing) { md.push(`| ${LABEL[r.slug]} | *chưa chạy* | – | – | – | – | – | – |`); continue; }
  md.push(`| ${LABEL[r.slug]} | ${r.started} | ${r.iterations} | ${r.requests} | ${r.assertions} | ${r.passed} | **${r.failed}** | ${(r.ms / 1000).toFixed(1)}s |`);
}
md.push(`| **Tổng** | | | **${T.requests}** | **${T.assertions}** | **${T.passed}** | **${T.failed}** | **${(T.ms / 1000).toFixed(1)}s** |`);
md.push("");
md.push("## Assertion đỏ theo từng API");
md.push("");
md.push("> Mỗi dòng phải map được sang một bug trong `bug-report/bug-report.md`, hoặc được giải thích");
md.push("> là test case của mình viết sai. Không để dòng nào không có kết luận.");
for (const r of rows) {
  if (r.missing) continue;
  md.push("");
  md.push(`### ${LABEL[r.slug]}`);
  md.push(`Raw: \`reports/newman/${r.file}\``);
  md.push("");
  if (!r.failures.length) { md.push("Không có assertion đỏ."); continue; }
  md.push("| Request | Test | Thông báo |");
  md.push("|---|---|---|");
  for (const f of r.failures) md.push(`| ${f.name} | ${f.test.replace(/\|/g, "\\|")} | ${f.message.replace(/\|/g, "\\|").replace(/\n/g, " ")} |`);
}
md.push("");

mkdirSync("test-cases/test-summary", { recursive: true });
writeFileSync(OUT, md.join("\n"), "utf8");
console.log(`  → ${OUT}`);
console.log(`     ${T.requests} request · ${T.assertions} assertion · ${T.passed} passed · ${T.failed} failed`);
