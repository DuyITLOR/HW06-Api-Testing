#!/usr/bin/env node
// preflight.mjs — kiểm môi trường TRƯỚC khi chạy bộ API test.
//
//   npm run preflight
//
// Vì sao cần: Newman fail vì SUT chưa lên, vì tài khoản seed đã bị xoá, hay vì token admin
// không có quyền — ba nguyên nhân này cho ra cùng một đống đỏ trong report, và không phân biệt
// được với bug thật của SUT. Kiểm trước thì mỗi lượt đỏ về sau là tín hiệu thật.

const BASE = process.env.BASE_URL || "http://localhost:3000";
const STUDENT_ID = process.env.STUDENT_ID || "23127178";
const ADMIN = { email: "admin@eshop.com", password: "Admin123!" };
const USER = { email: "test@eshop.com", password: "Test1234!" };

let fails = 0;
const ok = (m) => console.log(`  [OK]    ${m}`);
const bad = (m) => { console.log(`  [LOI]   ${m}`); fails++; };
const warn = (m) => console.log(`  [LUU Y] ${m}`);

const req = async (method, path, { body, token } = {}) => {
  const headers = { "X-Student-Id": STUDENT_ID };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* có endpoint trả HTML — đó là bug đang theo dõi */ }
  return { status: res.status, json, text, contentType: res.headers.get("content-type") || "" };
};

console.log(`\n══ Preflight HW06 — API Testing ═════════════════════════════════════════`);
console.log(`   BASE_URL=${BASE}  ·  X-Student-Id=${STUDENT_ID}\n`);

// 1. SUT có sống không
try {
  const r = await req("GET", "/api/products");
  if (r.status === 200 && Array.isArray(r.json)) ok(`SUT sống — GET /api/products trả ${r.json.length} sản phẩm`);
  else bad(`GET /api/products trả ${r.status}, body không phải mảng`);
} catch (e) {
  bad(`Không nối được ${BASE} — chạy SUT trước: bash ../final/eshop.sh --seed   (${e.message})`);
  console.log("\n  Dừng ở đây vì các mục sau đều cần SUT.\n");
  process.exit(1);
}

// 2. Tài khoản seed
let adminToken = null, userToken = null;
for (const [label, cred] of [["admin", ADMIN], ["user", USER]]) {
  const r = await req("POST", "/api/login", { body: cred });
  if (r.status === 200 && r.json?.token) {
    if (label === "admin") adminToken = r.json.token; else userToken = r.json.token;
    ok(`Login ${label} (${cred.email}) — role=${r.json.user?.role ?? "?"}`);
  } else if (r.status === 403) {
    bad(`Login ${label} bị lockout (403). Reset: node tools/reset-lockout.mjs hoặc seed lại DB`);
  } else {
    bad(`Login ${label} trả ${r.status} — seed lại DB: bash ../final/eshop.sh --seed`);
  }
}

// 3. Ba API của bài có đúng phản hồi cơ sở không (chỉ kiểm sống, KHÔNG kết luận đúng/sai)
if (adminToken) {
  const p = await req("POST", "/api/products", {
    token: adminToken,
    body: { name: `PREFLIGHT-${Date.now()}`, price: 1000, description: "preflight", imageUrl: "", category_id: 1 },
  });
  if (p.status === 200 && p.json?.id) {
    ok(`API-03 setup — POST /api/products tạo được id=${p.json.id}`);
    const u = await req("PUT", `/api/products/${p.json.id}`, {
      token: adminToken,
      body: { name: "PREFLIGHT-updated", price: 2000, description: "x", imageUrl: "", category_id: 1 },
    });
    (u.status === 200 ? ok : bad)(`API-03 — PUT /api/products/${p.json.id} trả ${u.status}`);
    const d = await req("DELETE", `/api/products/${p.json.id}`, { token: adminToken });
    (d.status === 200 ? ok : bad)(`API-03 cleanup — DELETE /api/products/${p.json.id} trả ${d.status}`);
  } else {
    bad(`POST /api/products trả ${p.status} — API-03 không có dữ liệu để test`);
  }
}
if (userToken) {
  const c = await req("POST", "/api/cart", { token: userToken, body: { id: 1, name: "preflight", price: 1000, quantity: 1 } });
  (c.status === 200 ? ok : bad)(`API-02 — POST /api/cart trả ${c.status}`);
  const g = await req("GET", "/api/cart", { token: userToken });
  (g.status === 200 && Array.isArray(g.json) ? ok : bad)(`API-02 verify — GET /api/cart trả ${g.status}, ${Array.isArray(g.json) ? g.json.length + " dòng" : "không phải mảng"}`);
}
const s = await req("GET", "/api/products?search=a");
(s.status === 200 ? ok : bad)(`API-01 — GET /api/products?search=a trả ${s.status} (${s.contentType.split(";")[0]})`);

// 4. Công cụ + file cấu hình
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
try {
  const v = execSync("newman --version", { encoding: "utf8" }).trim();
  ok(`newman ${v}`);
} catch { bad("Chưa có newman — cài: npm i -g newman newman-reporter-htmlextra"); }
try { execSync("newman run --help 2>/dev/null | grep -q htmlextra || true"); } catch { /* không quan trọng */ }
const env = "postman/environments/HW06-local.postman_environment.json";
(existsSync(env) ? ok : bad)(`Environment: ${env}`);
const cols = existsSync("postman/collections") ? execSync("ls -1 postman/collections/*.json 2>/dev/null | wc -l", { encoding: "utf8", shell: "/bin/bash" }).trim() : "0";
if (Number(cols) >= 1) ok(`Collection: ${cols} file trong postman/collections/`);
else warn("Chưa có collection nào trong postman/collections/ — bước §6.1 chưa làm");

console.log("");
if (fails > 0) { console.log(`  ⚠ ${fails} mục lỗi — sửa trước khi chạy Newman, đừng đọc số liệu từ lượt đỏ vì môi trường.\n`); process.exit(1); }
console.log("  Môi trường sẵn sàng.\n");
