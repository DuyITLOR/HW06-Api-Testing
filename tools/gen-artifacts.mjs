#!/usr/bin/env node
// ============================================================================
// gen-artifacts.mjs — hiện thực chạy được của AI test generator (§7).
//
//   node tools/gen-artifacts.mjs                 # sinh cho cả 3 API
//   node tools/gen-artifacts.mjs api-01-...      # sinh cho 1 API
//
// Vào : generator/specs/<slug>.mjs — ĐỊNH NGHĨA test case (nguồn sự thật duy nhất)
// Ra  : test-cases/<slug>/generated.md   (case Nguồn=AI)
//       test-cases/<slug>/audit.md       (toàn bộ case AI + nhãn audit)
//       test-cases/<slug>/extended.md    (case Nguồn=SV + bảng "vì sao AI bỏ sót")
//       postman/collections/23127178_<slug>.postman_collection.json
//
// Vì sao một nguồn sinh ra cả bảng lẫn collection: viết tay hai chỗ thì bảng test case và
// collection sẽ lệch nhau ngay lần sửa đầu tiên, và không ai phát hiện được — người chấm đọc bảng,
// Newman chạy collection.
//
// Nếu có `reports/newman/*.json` thì cột "Kết quả" được điền TỪ LƯỢT CHẠY THẬT, không gõ tay.
// ============================================================================
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const MSSV = "23127178";
const ALL = ["api-01-products-search", "api-02-cart-add", "api-03-product-update"];
const targets = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const slugs = targets.length ? targets : ALL;

const PRE = readFileSync("postman/prerequest-collection.js", "utf8").split("\n");

// ── Auth: một tham số như mọi tham số khác ──────────────────────────────────
const AUTH = {
  none:      { label: "không có header", header: null },
  user:      { label: "user thường",     header: "Bearer {{user_token}}" },
  user2:     { label: "user thứ hai",    header: "Bearer {{user2_token}}" },
  admin:     { label: "admin",           header: "Bearer {{admin_token}}" },
  malformed: { label: "token rác",       header: "Bearer abc.def.ghi" },
  nobearer:  { label: "thiếu tiền tố Bearer", header: "{{user_token}}" },
  wrongsig:  { label: "sai chữ ký",      header: "Bearer {{wrong_sig_token}}" },
  emptyval:  { label: "header rỗng",     header: "" },
};

// ── Check DSL → mã pm.test. Mỗi check là MỘT assertion để đếm được. ─────────
const CHECKS = {
  status: (n) => [`pm.test("status = ${n}", () => pm.response.to.have.status(${n}));`],
  statusIn: (list) => [`pm.test("status thuộc [${list}]", () => pm.expect([${list}]).to.include(pm.response.code));`],
  ctJson: () => [`pm.test("Content-Type là application/json", () => pm.expect(pm.response.headers.get("Content-Type") || "").to.include("application/json"));`],
  isArray: () => [`pm.test("body là mảng JSON", () => pm.expect(pm.response.json()).to.be.an("array"));`],
  isObject: () => [`pm.test("body là object JSON", () => pm.expect(pm.response.json()).to.be.an("object"));`],
  countEq: (n) => [`pm.test("trả về đúng ${n} dòng", () => pm.expect(pm.response.json().length).to.eql(${n}));`],
  minCount: (n) => [`pm.test("trả về ≥ ${n} dòng", () => pm.expect(pm.response.json().length).to.be.at.least(${n}));`],
  saveCount: (v) => [`pm.environment.set("${v}", pm.response.json().length);`],
  countEqVar: (v) => [`pm.test("số dòng bằng {{${v}}}", () => pm.expect(pm.response.json().length).to.eql(Number(pm.environment.get("${v}"))));`],
  countLtVar: (v) => [`pm.test("số dòng NHỎ HƠN {{${v}}} (payload không được trả về toàn bộ bảng)", () => pm.expect(pm.response.json().length).to.be.below(Number(pm.environment.get("${v}"))));`],
  emptyObject: () => [`pm.test("body là object rỗng", () => pm.expect(Object.keys(pm.response.json())).to.have.lengthOf(0));`],
  msg: (m) => [`pm.test('message = "${m}"', () => pm.expect(pm.response.json().message).to.eql("${m}"));`],
  hasField: (f) => [`pm.test("có field ${f}", () => pm.expect(pm.response.json()).to.have.property("${f}"));`],
  noField: (f) => [`pm.test("KHÔNG được có field ${f}", () => pm.expect(pm.response.json()).to.not.have.property("${f}"));`],
  // Tên test phải escape: giá trị chuỗi lồng trong tên test có dấu " sẽ vỡ cú pháp JS sinh ra
  // (lỗi "missing ) after argument list" — chính lỗi này đã làm 2 case đỏ oan ở lượt chạy đầu).
  fieldEq: (f, v) => [`pm.test("${f} = ${JSON.stringify(v).replace(/"/g, "'")}", () => pm.expect(pm.response.json().${f}).to.eql(${JSON.stringify(v)}));`],
  fieldType: (f, t) => [`pm.test("${f} phải là ${t}", () => pm.expect(pm.response.json().${f}).to.be.a("${t}"));`],
  fieldNotNull: (f) => [`pm.test("${f} không được null", () => pm.expect(pm.response.json().${f}).to.not.be.null);`],
  bodyNotContains: (s) => [`pm.test('body không được chứa "${s}"', () => pm.expect(pm.response.text()).to.not.include("${s}"));`],
  schemaProductArray: () => [`pm.test("mảng đúng schema product (spec §3.1)", () => pm.response.to.have.jsonSchema({
  type: "array",
  items: { type: "object", required: ["id","name","price"], properties: {
    id: { type: "integer" }, name: { type: "string" }, price: { type: "number" },
    description: { type: ["string","null"] }, imageUrl: { type: ["string","null"] },
    category_id: { type: ["integer","null"] } } }
}));`],
  schemaProduct: () => [`pm.test("object đúng schema product (spec §3.1)", () => pm.response.to.have.jsonSchema({
  type: "object", required: ["id","name","price"], properties: {
    id: { type: "integer" }, name: { type: "string" }, price: { type: "number" },
    description: { type: ["string","null"] }, imageUrl: { type: ["string","null"] },
    category_id: { type: ["integer","null"] } }
}));`],
  schemaMessage: () => [`pm.test("body đúng schema {message: string}", () => pm.response.to.have.jsonSchema({
  type: "object", required: ["message"], properties: { message: { type: "string" } }
}));`],
  schemaError: () => [`pm.test("body lỗi đúng schema {error: string}", () => pm.response.to.have.jsonSchema({
  type: "object", required: ["error"], properties: { error: { type: "string" } }
}));`],
  schemaCartArray: () => [`pm.test("giỏ hàng đúng schema (spec §4.2)", () => pm.response.to.have.jsonSchema({
  type: "array", items: { type: "object", required: ["id","name","price","quantity"], properties: {
    id: { type: "integer" }, name: { type: "string" },
    price: { type: "number" }, quantity: { type: "integer", minimum: 1 } } }
}));`],
  saveJson: (v, f) => [`pm.environment.set("${v}", pm.response.json().${f});`],
  // Dọn fixture của lượt trước / lượt này bằng pm.sendRequest — giữ mỗi lượt chạy độc lập.
  // Fire-and-forget có chủ ý: dùng ở 00-setup (có request kiểm lại ngay sau) và ở 99-teardown
  // (không còn request nào phía sau phụ thuộc vào nó).
  cleanupFixtures: () => [`const left = pm.response.json().filter(p => String(p.name || "").startsWith("HW06-"));
console.log("[HW06] dọn " + left.length + " fixture còn lại");
left.forEach(p => pm.sendRequest({
  url: pm.environment.get("base_url") + "/api/products/" + p.id,
  method: "DELETE",
  header: {
    "X-Student-Id": pm.environment.get("student_id"),
    "Authorization": "Bearer " + pm.environment.get("admin_token"),
  },
}, () => {}));
pm.test("đã gửi lệnh dọn " + left.length + " fixture cũ", () => pm.expect(left.length).to.be.at.least(0));`],
  raw: (js) => js.split("\n"),
};

const buildTests = (c) => {
  const out = [`// ${c.id} · ${c.tech} · ${strip(c.part)}`];
  for (const ch of c.checks || []) {
    const [name, ...args] = ch;
    if (!CHECKS[name]) throw new Error(`check không tồn tại: ${name} (case ${c.id})`);
    out.push(...CHECKS[name](...args));
  }
  return out;
};

const strip = (s) => String(s).replace(/`/g, "").replace(/\|/g, "/");
const urlOf = (c) => {
  let u = `{{base_url}}${c.path}`;
  if (c.query) {
    const qs = Object.entries(c.query).map(([k, v]) => `${k}=${v === null ? "" : encodeURIComponent(v)}`).join("&");
    u += (qs ? "?" + qs : "?");
  }
  return u;
};

const requestOf = (c) => {
  const header = [];
  const a = AUTH[c.auth];
  if (!a) throw new Error(`auth không hợp lệ: ${c.auth} (${c.id})`);
  if (a.header !== null) header.push({ key: "Authorization", value: a.header });
  if (c.body !== undefined) header.push({ key: "Content-Type", value: "application/json" });
  const req = { method: c.method, header, url: urlOf(c) };
  if (c.body !== undefined) {
    req.body = { mode: "raw", raw: typeof c.body === "string" ? c.body : JSON.stringify(c.body, null, 2),
                 options: { raw: { language: "json" } } };
  }
  return req;
};

// ── Kết quả thật từ lượt Newman mới nhất ────────────────────────────────────
const loadResults = (slug) => {
  if (!existsSync("reports/newman")) return null;
  const files = readdirSync("reports/newman").filter((f) => f.includes(slug) && f.endsWith(".json")).sort();
  if (!files.length) return null;
  const run = JSON.parse(readFileSync(join("reports/newman", files[files.length - 1]), "utf8")).run;
  const byId = {};
  for (const ex of run.executions || []) {
    const id = (ex.item?.name || "").split(" · ")[0];
    if (!id) continue;
    const total = (ex.assertions || []).length;
    const failed = (ex.assertions || []).filter((a) => a.error).length;
    byId[id] = { total, failed, pass: total - failed };
  }
  return { file: files[files.length - 1], byId };
};

const resultCell = (res, id) => {
  if (!res) return "";
  const r = res.byId[id];
  if (!r) return "*chưa chạy*";
  return r.failed === 0 ? `**Pass** (${r.pass}/${r.total})` : `**FAIL** (${r.failed}/${r.total} đỏ)`;
};

const HEADER = "| TC ID | Kỹ thuật | Tham số & phân vùng | Request | Auth | Query / Body | Expected status | Expected body / schema | Căn cứ | Nguồn | Audit | Kết quả |";
const SEP = "|---|---|---|---|---|---|---|---|---|---|---|---|";

const row = (c, res, withAudit) => {
  const qb = c.query ? "`" + Object.entries(c.query).map(([k, v]) => `${k}=${v === null ? "(rỗng)" : v}`).join("&") + "`"
            : c.body !== undefined ? "`" + (typeof c.body === "string" ? c.body : JSON.stringify(c.body)).slice(0, 90) + "`" : "–";
  return `| ${c.id} | ${c.tech} | ${c.part} | \`${c.method} ${c.path}\` | ${AUTH[c.auth].label} | ${qb.replace(/\|/g, "\\|")} | ${c.status} | ${c.expect} | ${c.basis} | ${c.src} | ${withAudit ? (c.audit || "") : ""} | ${resultCell(res, c.id)} |`;
};

for (const slug of slugs) {
  const spec = (await import(`../generator/specs/${slug}.mjs`)).default;
  const res = loadResults(slug);
  const all = [...spec.setup, ...spec.cases, ...(spec.teardown || [])];
  const ai = spec.cases.filter((c) => c.src === "AI");
  const sv = spec.cases.filter((c) => c.src === "SV");

  // ── 1. generated.md ───────────────────────────────────────────────────────
  const g = [`# ${spec.label} · bước 1 (§6.1): test case do AI sinh`, "",
    `- **Pool ${spec.pool} · ${spec.fr}** · prefix \`${spec.prefix}-###\` · **${ai.length} test case** (đề đòi ≥35 tính cả case tự thêm)`,
    `- Sinh bằng \`node tools/gen-artifacts.mjs ${slug}\` từ \`generator/specs/${slug}.mjs\` — **đừng sửa file này bằng tay**, sửa spec rồi sinh lại.`,
    `- Quy trình 5 bước của \`/api-test-design\`; mỗi bước một lượt AI riêng, ghi trong \`ai-audit/ai-audit-report.md\`.`, "",
    `## Phân bố theo kỹ thuật`, "", "| Kỹ thuật | Số case |", "|---|---|",
    ...["Domain", "State", "Security", "Schema"].map((t) => `| ${t} | ${ai.filter((c) => c.tech.startsWith(t)).length} |`),
    `| **Tổng** | **${ai.length}** |`, "",
    `## Bảng test case`, "",
    `> Cột \`Kết quả\` điền **tự động** từ \`reports/newman/*.json\`${res ? ` (lượt \`${res.file}\`)` : " — chưa có lượt chạy nào"}.`, "",
    HEADER, SEP, ...ai.map((c) => row(c, res, false)), ""];
  writeFileSync(`test-cases/${slug}/generated.md`, g.join("\n"), "utf8");

  // ── 2. audit.md ───────────────────────────────────────────────────────────
  const counts = { VALID: 0, INVALID: 0, INCOMPLETE: 0 };
  for (const c of ai) counts[(c.audit || "VALID").split(":")[0].trim()]++;
  const a = [`# ${spec.label} · bước 2 (§6.2): audit của sinh viên`, "",
    `- ${ai.length} case AI sinh, đã dán nhãn **VALID / INVALID / INCOMPLETE** kèm lý do.`,
    `- Sinh từ cột \`audit\` trong \`generator/specs/${slug}.mjs\` — nhãn nằm cùng chỗ với định nghĩa case nên không lệch nhau được.`, "",
    `## Thống kê audit`, "", "| Nhãn | Số case |", "|---|---|",
    `| VALID | ${counts.VALID} |`, `| INVALID (đã sửa) | ${counts.INVALID} |`, `| INCOMPLETE (đã bổ sung) | ${counts.INCOMPLETE} |`, "",
    ...(spec.auditNotes ? ["## Ghi chú audit", "", ...spec.auditNotes, ""] : []),
    `## Bảng audit`, "", HEADER, SEP, ...ai.map((c) => row(c, res, true)), ""];
  writeFileSync(`test-cases/${slug}/audit.md`, a.join("\n"), "utf8");

  // ── 3. extended.md ────────────────────────────────────────────────────────
  const e = [`# ${spec.label} · bước 3 (§6.3): test case sinh viên tự thêm`, "",
    `- **${sv.length} case** (đề đòi ≥5).`, "",
    HEADER, SEP, ...sv.map((c) => row(c, res, true)), "",
    `## Vì sao AI bỏ sót (§6.3)`, "",
    "| TC ID | AI bỏ sót gì | Nhóm lý do | Giải thích |", "|---|---|---|---|",
    ...spec.whyMissed.map((w) => `| ${w.id} | ${w.missed} | **${w.group}** | ${w.why} |`), ""];
  writeFileSync(`test-cases/${slug}/extended.md`, e.join("\n"), "utf8");

  // ── 4. Collection Postman ─────────────────────────────────────────────────
  const folders = [];
  for (const c of all) {
    let f = folders.find((x) => x.name === c.folder);
    if (!f) { f = { name: c.folder, item: [] }; folders.push(f); }
    f.item.push({
      name: `${c.id} · ${strip(c.part)}`,
      event: [{ listen: "test", script: { type: "text/javascript", exec: buildTests(c) } }],
      request: requestOf(c),
    });
  }
  folders.sort((x, y) => x.name.localeCompare(y.name));
  const col = {
    info: { name: `${MSSV} · ${spec.label}`, _postman_id: `hw06-${slug}`,
            description: `HW06 §6 — ${spec.label}. Sinh tự động bởi tools/gen-artifacts.mjs từ generator/specs/${slug}.mjs. Đừng sửa file này bằng tay.`,
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
    event: [{ listen: "prerequest", script: { type: "text/javascript", exec: PRE } }],
    item: folders,
  };
  mkdirSync("postman/collections", { recursive: true });
  writeFileSync(`postman/collections/${MSSV}_${slug}.postman_collection.json`, JSON.stringify(col, null, 2), "utf8");

  const nAssert = all.reduce((s, c) => s + (c.checks || []).filter((ch) => ch[0] !== "saveCount" && ch[0] !== "saveJson" && ch[0] !== "raw").length, 0);
  console.log(`  ${slug}: ${ai.length} AI + ${sv.length} SV = ${spec.cases.length} case · ${spec.setup.length} setup · ~${nAssert} assertion · ${folders.length} folder`);
}
console.log("\n  → test-cases/*/{generated,audit,extended}.md + postman/collections/*.json");
