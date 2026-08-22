#!/usr/bin/env node
// ============================================================================
// mark-reviewed.mjs — đánh dấu human review (§6.2) cho những lượt SINH VIÊN đã tự đọc.
//
//   node tools/mark-reviewed.mjs 4 5              # đánh dấu Interaction #4 và #5
//   node tools/mark-reviewed.mjs --list           # xem lượt nào còn chưa kiểm
//   node tools/mark-reviewed.mjs --all
//
// Vì sao là script riêng chứ không sửa tay, và vì sao nó HỎI LẠI:
//
//   Nhãn *(SV đã kiểm)* là một **lời khai**: nó nói rằng sinh viên đã tự đọc và chịu trách nhiệm về
//   test case đó (§6.2 — "You are fully responsible for the final test cases"). §11 phạt đúng loại
//   bằng chứng được dựng. Nên script này:
//     · không tự chạy trong bất kỳ pipeline nào;
//     · in ra CHÍNH XÁC những gì sắp được khai, kèm đường dẫn file cần đọc;
//     · đòi người dùng tự gõ một câu xác nhận;
//     · ghi ngày và ghi rõ "SV tự đọc và xác nhận" vào audit.
//   Nó chỉ thay việc sửa tay 6 chỗ trong file, không thay việc đọc.
// ============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const FILE = "ai-audit/ai-audit-report.md";
const WHAT = {
  1: ["chọn API cho 3 pool", "docs/api-selection.md"],
  2: ["dựng khung repo + tooling", "README.md §5–§6"],
  3: ["probe SUT kiểm giả thuyết bug", "bug-report/verify-bugs-output.txt"],
  4: ["sinh 136 test case (5 bước)", "test-cases/*/generated.md"],
  5: ["audit + 22 case tự thêm", "test-cases/*/audit.md và extended.md"],
  6: ["thực thi Newman", "test-cases/test-summary/summary.md"],
  7: ["bug report 19 bug", "bug-report/bug-report.md"],
  8: ["báo cáo, traceability, Excel", "report/main-report.md §11, §12"],
  9: ["kiểm tính tái lập", "report/main-report.md §6"],
  10: ["tự chấm theo §15", "report/main-report.md §11 bảng lỗi"],
  11: ["regression suite + 2 lượt CI", "ci/ci-report.md §3"],
  12: ["soát lại lần hai", "ci/ci-report.md §3 (hash commit) + report §11"],
};

const args = process.argv.slice(2);
let src = readFileSync(FILE, "utf8");
const blocks = src.split(/(?=^### Interaction #)/m);
const pending = [];
for (const b of blocks) {
  const m = b.match(/^### Interaction #(\d+)/);
  if (m && (b.includes("phần đọc của SV: **chưa**") || b.includes("(SV chưa tự kiểm)"))) pending.push(Number(m[1]));
}

if (!args.length || args.includes("--list")) {
  console.log(`\n  Lượt CÒN CHƯA kiểm (${pending.length}): ${pending.join(", ")}\n`);
  for (const n of pending) console.log(`   #${n.toString().padEnd(2)} ${WHAT[n]?.[0] ?? "?"}\n       cần đọc: ${WHAT[n]?.[1] ?? "?"}`);
  console.log(`\n  Đánh dấu:  node tools/mark-reviewed.mjs ${pending.join(" ")}\n`);
  process.exit(0);
}

// npm truyền cả comment `# ...` vào argv, nên args có thể toàn rác. Rác thì coi như không truyền gì
// và hiện danh sách — báo lỗi rồi thoát chỉ làm người dùng tưởng script hỏng.
const want = args.includes("--all") ? pending : args.map(Number).filter((n) => pending.includes(n));
if (!want.length) {
  console.log(`\n  Không nhận ra số lượt nào trong: ${args.join(" ")}`);
  console.log(`  Lượt còn chưa kiểm: ${pending.join(", ")}`);
  console.log(`  Ví dụ:  npm run review 5 8      (đừng thêm comment # phía sau — npm coi nó là tham số)\n`);
  process.exit(1);
}

console.log("\n  Sắp KHAI rằng bạn đã tự đọc và chịu trách nhiệm về:\n");
for (const n of want) console.log(`   #${n} — ${WHAT[n]?.[0]}\n       ${WHAT[n]?.[1]}`);
console.log("\n  Chỉ gõ xác nhận nếu bạn ĐÃ đọc thật. Đây là lời khai trong bài nộp (§6.2, §11).\n");

if (!process.stdin.isTTY) { console.log("  [DUNG] Cần chạy trực tiếp trong terminal để xác nhận."); process.exit(1); }
const norm = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
  .toLowerCase().replace(/\s+/g, " ").trim();
const OK = "toi da doc";
const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = (attempt, done) => rl.question(`  Gõ "toi da doc" rồi Enter: `, (ans) => {
  if (norm(ans) === OK) return done(true);
  if (attempt === 1) {
    console.log(`\n  Bạn gõ "${ans.trim()}" — chưa đúng. Cần đúng ba chữ: toi da doc  (gõ có dấu cũng được)\n`);
    return ask(2, done);
  }
  done(false);
});

ask(1, (confirmed) => {
  rl.close();
  if (!confirmed) { console.log("\n  Huỷ — không thay đổi gì. Chạy lại khi bạn đã đọc.\n"); process.exit(1); }
  const today = new Date().toISOString().slice(0, 10).split("-").reverse().join("/");
  let n_done = 0;
  const out = blocks.map((b) => {
    const m = b.match(/^### Interaction #(\d+)/);
    if (!m || !want.includes(Number(m[1]))) return b;
    n_done++;
    const note = `***(SV đã kiểm)*** — SV tự đọc \`${WHAT[Number(m[1])]?.[1]}\` và xác nhận ngày ${today}. `;
    if (b.includes("phần đọc của SV: **chưa**")) return b.replace("*(phần đọc của SV: **chưa**)* —", note + "—");
    return b.replace("***(SV chưa tự kiểm)***", note);
  });
  writeFileSync(FILE, out.join(""), "utf8");
  console.log(`\n  Đã đánh dấu ${n_done} lượt. Còn lại: ${pending.filter((x) => !want.includes(x)).join(", ") || "không còn"}`);
  console.log(`  Nhớ: npm run pdf && bash tools/commit-plan.sh log\n`);
});
