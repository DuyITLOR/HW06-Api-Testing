#!/usr/bin/env node
// ============================================================================
// coverage-gaps.mjs — in ra Ô CÒN TRỐNG của ma trận phủ, để sinh viên tự chọn case mà viết.
//
//   npm run gaps
//
// Vì sao là script chứ không phải danh sách case gợi ý: §6.3 đòi *"five test cases of **your own**"*.
// Nếu AI viết sẵn case rồi bảo "chép vào own.md" thì vẫn là case của AI, chỉ đổi chỗ. Script này
// chỉ chỉ ra **chỗ chưa được phủ** (tham số × loại phân vùng, và endpoint/quyền chưa ai chạm) —
// còn nghĩ ra case, đặt expected và ghi căn cứ là việc của người.
// ============================================================================
const SLUGS = ["api-01-products-search", "api-02-cart-add", "api-03-product-update"];
const KINDS = ["hợp lệ điển hình","biên dưới","biên dưới - 1","biên trên","rỗng","thiếu hẳn","sai kiểu",
               "quá dài","ký tự đặc biệt","Unicode/có dấu","giá trị mang nghĩa với tầng dưới (% _ ')"];

for (const slug of SLUGS) {
  const spec = (await import(`../generator/specs/${slug}.mjs`)).default;
  const text = spec.cases.map((c) => `${c.part} ${c.expect} ${c.basis}`).join(" ").toLowerCase();
  console.log(`\n══ ${spec.label}`);
  const missing = KINDS.filter((k) => {
    const key = k.split(" ")[0].toLowerCase();
    return !text.includes(key);
  });
  console.log(`  Loại phân hoạch chưa thấy xuất hiện: ${missing.length ? missing.join(" · ") : "(không còn)"}`);
  const techs = ["Domain", "State", "Security", "Schema"];
  for (const t of techs) {
    const n = spec.cases.filter((c) => String(c.tech).startsWith(t)).length;
    console.log(`  ${t.padEnd(9)} ${String(n).padStart(2)} case`);
  }
  const secs = ["SEC-01","SEC-02","SEC-03","SEC-04","SEC-05","SEC-06","SEC-07"];
  const covered = secs.filter((s) => spec.cases.some((c) => `${c.tech} ${c.basis}`.includes(s)));
  console.log(`  SEC đã chạm: ${covered.join(", ") || "—"}`);
  console.log(`  SEC CHƯA chạm ở API này: ${secs.filter((s) => !covered.includes(s)).join(", ") || "—"}`);
}
console.log(`
  Cách dùng: chọn một ô trống ở trên → tự nghĩ case → thêm vào test-cases/<api>/own.md
  (mỗi case ghi đủ: TC ID, tham số & phân vùng, request, auth, expected, **căn cứ** trỏ spec §/FR/SEC).
  Rồi chạy: npm run verify
`);
