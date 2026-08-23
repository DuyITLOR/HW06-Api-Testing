#!/usr/bin/env node
// ============================================================================
// check-own.mjs — soát case sinh viên tự viết trong own.md (§6.3).
//
//   npm run check:own
//
// Kiểm: đủ 5 dòng có nội dung · mỗi dòng có Căn cứ trỏ nguồn kiểm được · có expected ·
// không trùng TC ID với case AI · **không chép nguyên văn** từ extended.md · có dòng lý do bỏ sót.
// ============================================================================
import { readFileSync, existsSync } from "node:fs";
const APIS = ["api-01-products-search", "api-02-cart-add", "api-03-product-update"];
let bad = 0;
for (const slug of APIS) {
  const f = `test-cases/${slug}/own.md`;
  if (!existsSync(f)) { console.log(`  [LECH] thiếu ${f}`); bad++; continue; }
  const md = readFileSync(f, "utf8");
  const ext = existsSync(`test-cases/${slug}/extended.md`) ? readFileSync(`test-cases/${slug}/extended.md`, "utf8") : "";
  const rows = md.split("\n").filter((l) => /^\| *TC-[A-Z]+-\d+ *\|/.test(l));
  const filled = rows.filter((l) => l.split("|").slice(2, 9).some((c) => c.trim().length > 2));
  const why = md.split("\n").filter((l) => /^\| *TC-[A-Z]+-\d+ *\|/.test(l)).slice(rows.length);
  console.log(`\n  ${slug}: ${filled.length}/5 dòng đã điền`);
  if (filled.length < 5) { console.log(`         → §6.3 đòi ≥5 case của sinh viên`); bad++; }
  for (const r of filled) {
    const c = r.split("|").map((x) => x.trim());
    const id = c[1], basis = c[9] || "", exp = (c[7] || "") + (c[8] || "");
    if (!/spec §|FR-\d|SEC-0|server\.js|đề §|database\.js/.test(basis)) { console.log(`         [LECH] ${id}: cột Căn cứ chưa trỏ nguồn kiểm được ("${basis.slice(0,30)}")`); bad++; }
    if (exp.trim().length < 4) { console.log(`         [LECH] ${id}: chưa có expected`); bad++; }
    const part = c[3] || "";
    if (part.length > 12 && ext.includes(part)) { console.log(`         [LECH] ${id}: phân vùng chép nguyên văn từ extended.md (case AI)`); bad++; }
  }
  const whyFilled = why.filter((l) => l.split("|").slice(2, 5).some((c) => c.trim().length > 2));
  if (filled.length && whyFilled.length < filled.length) { console.log(`         [LECH] bảng "vì sao AI bỏ sót" thiếu ${filled.length - whyFilled.length} dòng`); bad++; }
}
console.log(`\n  ${bad ? bad + " vấn đề" : "đủ và hợp lệ"}\n`);
process.exit(bad ? 1 : 0);
