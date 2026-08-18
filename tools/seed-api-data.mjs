#!/usr/bin/env node
// ============================================================================
// seed-api-data.mjs — dựng dữ liệu cố định cho 3 API + sinh file CSV data-driven.
//
//   npm run seed:api
//
// Vì sao cần: §6.1 đòi phân hoạch miền trên MỌI tham số. Với `search` của API-01, phần lớn
// phân vùng chỉ kiểm được nếu trong DB có sẵn sản phẩm mang đúng đặc điểm đó (chữ hoa/thường,
// tiếng Việt có dấu, ký tự `%` `_`, tên rất dài). Nếu để dữ liệu seed mặc định, test "tìm theo
// tiếng Việt có dấu" sẽ trả mảng rỗng và ta không phân biệt được "SUT sai" với "DB không có gì
// để tìm" — đúng loại kết luận sai mà §10 bắt phải tự soát.
//
// QUAN TRỌNG — vì sao mặc định KHÔNG tạo sản phẩm nữa:
//   Collection Postman tự tạo fixture của nó trong folder 00-setup (và tự dọn ở 99-teardown), vì
//   SUT DROP + seed lại toàn bộ bảng mỗi lần khởi động (backend/database.js:15-20) nên fixture tạo
//   trước đó không sống sót. Nếu script này CŨNG tạo fixture cùng tên thì mỗi tên có 2 dòng và mọi
//   assertion "đúng 1 dòng" đỏ oan — đỏ vì dữ liệu, không phải vì SUT sai.
//   Chỉ dùng --products khi muốn có fixture để thử tay bằng curl/Postman GUI.
//
//   node tools/seed-api-data.mjs              # CSV + user thứ hai
//   node tools/seed-api-data.mjs --products    # thêm fixture sản phẩm (thử tay)
//   node tools/seed-api-data.mjs --clean       # xoá mọi sản phẩm HW06-*
// ============================================================================
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const STUDENT_ID = process.env.STUDENT_ID || "23127178";
const ADMIN = { email: "admin@eshop.com", password: "Admin123!" };
const CLEAN = process.argv.includes("--clean");
const WITH_PRODUCTS = process.argv.includes("--products");
const PREFIX = "HW06-";

const req = async (method, path, { body, token } = {}) => {
  const headers = { "X-Student-Id": STUDENT_ID };
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
};

// ── Fixture cho API-01: mỗi dòng phục vụ một phân vùng của `search` ─────────
const FIXTURES = [
  { name: `${PREFIX}Laptop Dell XPS`,        price: 25000000, note: "khớp thường + khớp nhiều từ" },
  { name: `${PREFIX}LAPTOP ASUS TUF`,        price: 18000000, note: "chữ IN HOA — kiểm case-insensitive của LIKE" },
  { name: `${PREFIX}Áo thun cổ tròn size XL`, price: 150000,  note: "tiếng Việt CÓ DẤU" },
  { name: `${PREFIX}Bàn phím 100% cơ`,       price: 1200000,  note: "chứa ký tự '%' — wildcard của LIKE" },
  { name: `${PREFIX}Chuột_không_dây`,        price: 350000,   note: "chứa '_' — wildcard 1 ký tự của LIKE" },
  { name: `${PREFIX}Cáp USB-C 100W (đen)`,   price: 250000,   note: "ký tự đặc biệt + ngoặc" },
  { name: `${PREFIX}` + "S".repeat(240),     price: 99000,    note: "tên rất dài (≈250 ký tự) — biên độ dài" },
  { name: `${PREFIX}O'Brien Special`,        price: 500000,   note: "dấu nháy đơn — kiểm escape, KHÔNG phải payload tấn công" },
  { name: `${PREFIX}Zzz Sản phẩm giá 0`,     price: 0,        note: "price = 0 — biên giá trị cho schema/BVA" },
];

// ── CSV data-driven cho Collection Runner (§6 'exercise as many Postman features') ──
const CSVS = {
  "search-terms.csv": [
    "search_term,partition,expect_min_rows,expect_status",
    "Laptop,khớp nhiều dòng (thường),2,200",
    "LAPTOP,khớp hoa-thường,2,200",
    "Áo thun,tiếng Việt có dấu,1,200",
    "khong-ton-tai-xyz,không khớp gì,0,200",
    "a,một ký tự,0,200",
    "%,wildcard % (LIKE),0,200",
    "_,wildcard _ (LIKE),0,200",
    "  ,chỉ khoảng trắng,0,200",
    "O'Brien,dấu nháy đơn trong dữ liệu hợp lệ,0,200",
  ],
  "cart-quantity.csv": [
    "quantity,partition,expect_status,expect_accepted",
    "1,biên dưới hợp lệ,200,true",
    "2,giá trị bình thường,200,true",
    "0,biên dưới - 1 (không hợp lệ),400,false",
    "-1,số âm,400,false",
    "1.5,số thập phân,400,false",
    "abc,sai kiểu,400,false",
    "999999,rất lớn (vượt tồn kho),400,false",
  ],
  "product-update-fields.csv": [
    "field,value,partition,expect_status",
    "price,-1,giá âm,400",
    "price,0,giá bằng 0 (biên),400",
    "price,1,giá dương nhỏ nhất,200",
    "price,abc,giá sai kiểu,400",
    "name,,tên rỗng,400",
    "category_id,999999,category không tồn tại,400",
  ],
};

mkdirSync("postman/data", { recursive: true });
for (const [file, lines] of Object.entries(CSVS)) {
  writeFileSync(`postman/data/${file}`, lines.join("\n") + "\n", "utf8");
  console.log(`  [OK]   postman/data/${file} (${lines.length - 1} dòng dữ liệu)`);
}

// ── Nói chuyện với SUT ──────────────────────────────────────────────────────
const login = await req("POST", "/api/login", { body: ADMIN });
if (login.status !== 200 || !login.json?.token) {
  console.error(`  [LOI] Không login được admin (${login.status}). Chạy SUT + seed DB trước:`);
  console.error(`        bash ../final/eshop.sh --seed`);
  process.exit(1);
}
const token = login.json.token;

const all = await req("GET", "/api/products");
const existing = (all.json || []).filter((p) => String(p.name || "").startsWith(PREFIX));

if (CLEAN) {
  for (const p of existing) await req("DELETE", `/api/products/${p.id}`, { token });
  console.log(`  [OK]   đã xoá ${existing.length} sản phẩm ${PREFIX}*`);
  process.exit(0);
}

if (!WITH_PRODUCTS) {
  console.log(`  [BO QUA] fixture sản phẩm — collection tự tạo trong 00-setup (dùng --products nếu muốn thử tay)`);
} else {
let created = 0, skipped = 0;
for (const f of FIXTURES) {
  if (existing.some((p) => p.name === f.name)) { skipped++; continue; }
  const r = await req("POST", "/api/products", {
    token,
    body: { name: f.name, price: f.price, description: f.note, imageUrl: "", category_id: 1 },
  });
  if (r.status === 200) created++;
  else console.log(`  [LOI]   không tạo được "${f.name.slice(0, 40)}…" (${r.status})`);
}
console.log(`  [OK]   fixture sản phẩm: ${created} tạo mới, ${skipped} đã có`);
}

// User thứ hai để kiểm cách ly giỏ hàng / IDOR của API-02.
const U2 = { name: "HW06 User Two", email: "hw06.user2@eshop.com", password: "User2pass!" };
const reg = await req("POST", "/api/register", { body: U2 });
if (reg.status === 200) console.log(`  [OK]   tạo user thứ hai ${U2.email} (kiểm cách ly giỏ hàng)`);
else console.log(`  [LUU Y] user thứ hai đã tồn tại hoặc bị từ chối (${reg.status}) — dùng lại tài khoản cũ`);

console.log("");
console.log("  Xong. Kiểm lại bằng: npm run preflight");
