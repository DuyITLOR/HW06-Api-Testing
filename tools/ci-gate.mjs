#!/usr/bin/env node
// ============================================================================
// ci-gate.mjs — quyết định build XANH hay ĐỎ từ raw JSON của Newman.
//
//   node tools/ci-gate.mjs reports/newman/*.json
//   node tools/ci-gate.mjs reports/newman/*.json --strict     # đỏ nếu có BẤT KỲ assertion đỏ
//
// Vì sao không dùng thẳng exit code của Newman:
//
//   Bộ test của bài này CỐ Ý bắt bug thật của SUT. Nếu cổng CI là "0 assertion đỏ" thì pipeline
//   đỏ vĩnh viễn và không còn phát hiện được **hồi quy mới** — mọi lượt đều đỏ như nhau, tín hiệu
//   bằng không. Nên cổng ở đây so với **baseline đã ký nhận**: ci/expected-failures.json ghi số
//   assertion đỏ đã biết của từng collection kèm lý do (mỗi dòng trỏ tới một bug trong
//   bug-report.md). Build đỏ khi số đỏ **khác** baseline — nhiều hơn (hồi quy mới) hoặc ít hơn
//   (SUT đã sửa, hoặc test của mình yếu đi) — cả hai đều phải người xem lại.
//
//   Đây cũng chính là cách tạo hai lượt mẫu §6 đòi: một commit giữ đúng baseline (XANH), một
//   commit sửa baseline hoặc thêm test đỏ mới (ĐỎ).
// ============================================================================
import { readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const files = args.filter((a) => !a.startsWith("--"));
const BASELINE = "ci/expected-failures.json";

if (!files.length) { console.error("Dùng: node tools/ci-gate.mjs <newman-*.json ...> [--strict]"); process.exit(2); }

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : { collections: {} };
let red = 0;
const lines = [];

for (const f of files) {
  if (!existsSync(f)) { lines.push(`  [LOI]   không thấy ${f}`); red++; continue; }
  const run = JSON.parse(readFileSync(f, "utf8")).run;
  const name = run.collection?.info?.name || f;
  const slug = Object.keys(baseline.collections || {}).find((k) => f.includes(k) || name.includes(k));
  const failed = run.stats.assertions.failed;
  const total = run.stats.assertions.total;
  const reqFailed = run.stats.requests.failed;

  if (total === 0) { lines.push(`  [LOI]   ${name}: 0 assertion — collection rỗng hay chạy sai file?`); red++; continue; }
  if (reqFailed > 0) { lines.push(`  [LOI]   ${name}: ${reqFailed} request KHÔNG gửi được (SUT chết / sai URL), không phải kết quả test`); red++; }

  if (STRICT) {
    if (failed > 0) { lines.push(`  [DO]    ${name}: ${failed}/${total} assertion đỏ (chế độ --strict)`); red++; }
    else lines.push(`  [XANH]  ${name}: ${total} assertion, 0 đỏ`);
    continue;
  }

  const expected = slug ? baseline.collections[slug].expected_failed : null;
  if (expected === null || expected === undefined) {
    lines.push(`  [LOI]   ${name}: chưa có baseline trong ${BASELINE} — thêm mục cho nó trước khi bật cổng`);
    red++;
  } else if (failed === expected) {
    lines.push(`  [XANH]  ${name}: ${failed}/${total} đỏ, khớp baseline (${expected})`);
  } else {
    const dir = failed > expected ? "TĂNG — hồi quy mới" : "GIẢM — SUT đã sửa hoặc test yếu đi";
    lines.push(`  [DO]    ${name}: ${failed}/${total} đỏ, baseline ${expected} → ${dir}`);
    red++;
  }
}

console.log("\n══ Cổng CI ══════════════════════════════════════════════════════════════");
console.log(lines.join("\n"));
console.log("");
if (red > 0) { console.log(`  Build ĐỎ — ${red} mục không đạt.\n`); process.exit(1); }
console.log("  Build XANH.\n");
