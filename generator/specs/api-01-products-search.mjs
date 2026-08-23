// ============================================================================
// API-01 · Pool A · FR-05 — GET /api/products (+ GET /api/products/:id để verify)
//
// Expected LẤY TỪ SPEC (`api_specification.md` §3.1/§3.2) và FR-05, KHÔNG lấy từ hành vi thật của
// SUT. Chỗ nào spec im lặng thì ghi rõ trong cột "Căn cứ" và chỉ kiểm những gì spec nói.
// Vì vậy một số case ĐỎ là đúng ý: đỏ = SUT lệch spec = bug.
//
// Fixture: collection tự tạo trong 00-setup. Bắt buộc phải tự tạo — SUT DROP + seed lại toàn bộ
// bảng mỗi lần khởi động (backend/database.js:15-20), nên không được dựa vào dữ liệu có sẵn.
// ============================================================================
const P = "TC-PRODLIST";
const FX = (name, price) => ({
  method: "POST", path: "/api/products", auth: "admin",
  body: { name, price, description: "HW06 fixture", imageUrl: "", category_id: 1 },
  checks: [["status", 200], ["hasField", "id"]],
});

export default {
  slug: "api-01-products-search",
  label: "API-01 — Pool A · GET /api/products",
  pool: "A", fr: "FR-05 Product listing & search", prefix: P,

  setup: [
    { id: "SETUP-00a", folder: "00-setup", tech: "Setup", part: "login admin (cần token để dọn fixture)", basis: "spec §1.2", src: "-",
      method: "POST", path: "/api/login", auth: "none",
      body: { email: "{{admin_email}}", password: "{{admin_password}}" },
      status: 200, expect: "token admin", checks: [["status", 200], ["saveJson", "admin_token", "token"]] },
    { id: "SETUP-00b", folder: "00-setup", tech: "Setup", part: "**dọn fixture `HW06-*` còn lại từ lượt trước** (giữ lượt chạy độc lập)", basis: "-", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "đã gửi lệnh xoá",
      checks: [["status", 200], ["cleanupFixtures"]] },
    { id: "SETUP-00c", folder: "00-setup", tech: "Setup", part: "kiểm lại: không còn fixture `HW06-*`", basis: "-", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "0 fixture còn lại",
      checks: [["status", 200], ["raw", `pm.test("không còn fixture HW06-* nào", () => {
  const left = pm.response.json().filter(p => String(p.name || "").startsWith("HW06-"));
  pm.expect(left.length, "còn " + left.length + " fixture — khởi động lại SUT rồi chạy lại").to.eql(0);
});`]] },
    { id: "SETUP-01", folder: "00-setup", tech: "Setup", part: "login admin", basis: "spec §1.2", src: "-",
      method: "POST", path: "/api/login", auth: "none",
      body: { email: "{{admin_email}}", password: "{{admin_password}}" },
      status: 200, expect: "token admin", checks: [["status", 200], ["saveJson", "admin_token", "token"]] },
    { id: "SETUP-02", folder: "00-setup", tech: "Setup", part: "login user thường", basis: "spec §1.2", src: "-",
      method: "POST", path: "/api/login", auth: "none",
      body: { email: "{{user_email}}", password: "{{user_password}}" },
      status: 200, expect: "token user", checks: [["status", 200], ["saveJson", "user_token", "token"]] },
    { id: "SETUP-03", folder: "00-setup", tech: "Setup", part: "fixture: tên có chữ hoa + thường", ...FX("HW06-Laptop Dell XPS", 25000000), basis: "-", src: "-", status: 200, expect: "tạo được" },
    { id: "SETUP-04", folder: "00-setup", tech: "Setup", part: "fixture: tên IN HOA", ...FX("HW06-LAPTOP ASUS TUF", 18000000), basis: "-", src: "-", status: 200, expect: "tạo được" },
    { id: "SETUP-05", folder: "00-setup", tech: "Setup", part: "fixture: tiếng Việt có dấu", ...FX("HW06-Áo thun cổ tròn size XL", 150000), basis: "-", src: "-", status: 200, expect: "tạo được" },
    { id: "SETUP-06", folder: "00-setup", tech: "Setup", part: "fixture: chứa ký tự % (wildcard của LIKE)", ...FX("HW06-Bàn phím 100% cơ", 1200000), basis: "-", src: "-", status: 200, expect: "tạo được" },
    { id: "SETUP-07", folder: "00-setup", tech: "Setup", part: "fixture: chứa ký tự _ (wildcard 1 ký tự)", ...FX("HW06-Chuot_khong_day", 350000), basis: "-", src: "-", status: 200, expect: "tạo được" },
    { id: "SETUP-08", folder: "00-setup", tech: "Setup", part: "fixture: chứa dấu nháy đơn trong DỮ LIỆU HỢP LỆ", ...FX("HW06-O'Brien Special", 500000), basis: "-", src: "-", status: 200, expect: "tạo được" },
    { id: "SETUP-09", folder: "00-setup", tech: "Setup", part: "lưu tổng số sản phẩm làm mốc so sánh", basis: "-", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "lưu total_products",
      checks: [["status", 200], ["isArray"], ["saveCount", "total_products"]] },
  ],

  cases: [
    // ── 10-domain-search ──────────────────────────────────────────────────────
    { id: `${P}-001`, folder: "10-domain-search", tech: "Domain", part: "**không truyền** `search` — trả toàn bộ",
      method: "GET", path: "/api/products", auth: "none", status: 200,
      expect: "mảng JSON tất cả sản phẩm, đúng schema", basis: "spec §3.1", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isArray"], ["minCount", 7], ["schemaProductArray"]] },

    { id: `${P}-002`, folder: "10-domain-search", tech: "Domain", part: "`search` **rỗng** — coi như không lọc",
      method: "GET", path: "/api/products", query: { search: null }, auth: "none", status: 200,
      expect: "mảng JSON, số dòng = mốc `total_products`", basis: "spec §3.1 (`search` là *tuỳ chọn*)", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEqVar", "total_products"]] },

    { id: `${P}-003`, folder: "10-domain-search", tech: "Domain", part: "khớp **nhiều dòng** — `Laptop`",
      method: "GET", path: "/api/products", query: { search: "Laptop" }, auth: "none", status: 200,
      expect: "≥2 dòng, **mọi** dòng có `Laptop` trong `name`", basis: "spec §3.1 *tìm theo tên*", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["minCount", 2],
        ["raw", `pm.test("mọi dòng đều chứa 'laptop' trong name", () => {
  pm.response.json().forEach(p => pm.expect(String(p.name).toLowerCase()).to.include("laptop"));
});`]] },

    { id: `${P}-004`, folder: "10-domain-search", tech: "Domain", part: "chữ **thường** — `laptop` (không phân biệt hoa/thường)",
      method: "GET", path: "/api/products", query: { search: "laptop" }, auth: "none", status: 200,
      expect: "≥2 dòng — bằng kết quả của `Laptop`", basis: "FR-05 *tìm kiếm theo tên*", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["minCount", 2]] },

    { id: `${P}-005`, folder: "10-domain-search", tech: "Domain", part: "**IN HOA** — `LAPTOP`",
      method: "GET", path: "/api/products", query: { search: "LAPTOP" }, auth: "none", status: 200,
      expect: "≥2 dòng", basis: "FR-05", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["minCount", 2]] },

    { id: `${P}-006`, folder: "10-domain-search", tech: "Domain", part: "tiếng Việt **có dấu**, đúng hoa/thường — `Áo`",
      method: "GET", path: "/api/products", query: { search: "Áo" }, auth: "none", status: 200,
      expect: "1 dòng — fixture áo thun", basis: "FR-05 · SUT là ứng dụng tiếng Việt", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 1]] },

    { id: `${P}-007`, folder: "10-domain-search", tech: "Domain", part: "khớp **giữa từ** — `thun`",
      method: "GET", path: "/api/products", query: { search: "thun" }, auth: "none", status: 200,
      expect: "1 dòng (LIKE `%…%` khớp giữa tên)", basis: "spec §3.1", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 1]] },

    { id: `${P}-008`, folder: "10-domain-search", tech: "Domain", part: "**nhiều từ** — `Dell XPS`",
      method: "GET", path: "/api/products", query: { search: "Dell XPS" }, auth: "none", status: 200,
      expect: "1 dòng", basis: "spec §3.1", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 1]] },

    { id: `${P}-009`, folder: "10-domain-search", tech: "Domain", part: "**không khớp gì** — chuỗi vô nghĩa",
      method: "GET", path: "/api/products", query: { search: "khong-ton-tai-xyz-123" }, auth: "none", status: 200,
      expect: "mảng **rỗng**, không phải 404", basis: "spec §3.1 (danh sách rỗng là hợp lệ)", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 0]] },

    { id: `${P}-010`, folder: "10-domain-search", tech: "Domain", part: "**một ký tự** — `a` (biên dưới độ dài)",
      method: "GET", path: "/api/products", query: { search: "a" }, auth: "none", status: 200,
      expect: "mảng JSON, ≥1 dòng", basis: "spec §3.1 không đặt độ dài tối thiểu", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["minCount", 1]] },

    { id: `${P}-011`, folder: "10-domain-search", tech: "Domain", part: "**chỉ khoảng trắng** — ` `",
      method: "GET", path: "/api/products", query: { search: " " }, auth: "none", status: 200,
      expect: "200 + mảng JSON đúng schema (spec không định nghĩa trim)", basis: "spec §3.1 **im lặng** — chỉ kiểm status + schema, không kiểm số dòng", src: "AI",
      audit: "INCOMPLETE: bản AI sinh ban đầu ghi expected `0 dòng` — đó là **suy đoán**. Đã sửa: spec không nói có trim hay không, nên chỉ khẳng định phần spec bảo đảm.",
      checks: [["status", 200], ["isArray"], ["schemaProductArray"]] },

    { id: `${P}-012`, folder: "10-domain-search", tech: "Domain", part: "**rất dài** — 300 ký tự",
      method: "GET", path: "/api/products", query: { search: "L".repeat(300) }, auth: "none", status: 200,
      expect: "mảng rỗng, không 500", basis: "spec §3.1 không giới hạn độ dài", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isArray"], ["countEq", 0]] },

    { id: `${P}-013`, folder: "10-domain-search", tech: "Domain", part: "chứa `_` trong **dữ liệu hợp lệ** — `Chuot_khong`",
      method: "GET", path: "/api/products", query: { search: "Chuot_khong" }, auth: "none", status: 200,
      expect: "1 dòng", basis: "spec §3.1", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 1]] },

    { id: `${P}-014`, folder: "10-domain-search", tech: "Domain", part: "**emoji / ký tự ngoài BMP** — 🚀",
      method: "GET", path: "/api/products", query: { search: "🚀" }, auth: "none", status: 200,
      expect: "mảng rỗng, không 500", basis: "spec §3.1 không hạn chế bộ ký tự", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isArray"], ["countEq", 0]] },

    { id: `${P}-015`, folder: "10-domain-search", tech: "Domain", part: "**khoảng trắng đầu/cuối** — ` Laptop `",
      method: "GET", path: "/api/products", query: { search: " Laptop " }, auth: "none", status: 200,
      expect: "200 + mảng JSON (spec không định nghĩa trim)", basis: "spec §3.1 **im lặng** về trim", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["schemaProductArray"]] },

    { id: `${P}-016`, folder: "10-domain-search", tech: "Domain", part: "**tham số lạ** — `?foo=bar` (phải bỏ qua)",
      method: "GET", path: "/api/products", query: { foo: "bar" }, auth: "none", status: 200,
      expect: "như không truyền `search`: số dòng = `total_products`", basis: "spec §3.1 chỉ định nghĩa `search`", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEqVar", "total_products"]] },

    { id: `${P}-017`, folder: "10-domain-search", tech: "Domain", part: "endpoint **public** — có token vẫn phải chạy",
      method: "GET", path: "/api/products", query: { search: "Laptop" }, auth: "user", status: 200,
      expect: "200, kết quả như khi không có token", basis: "spec §3 không đòi `Authorization` cho §3.1", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["minCount", 2]] },

    { id: `${P}-018`, folder: "10-domain-search", tech: "Domain", part: "**method không được hỗ trợ** — `PATCH /api/products`",
      method: "PATCH", path: "/api/products", auth: "none", status: "404 hoặc 405",
      expect: "404/405 — không được coi là GET", basis: "spec §3.1 chỉ định nghĩa GET", src: "AI", audit: "VALID",
      checks: [["statusIn", "404,405"]] },

    // ── 20-state ─────────────────────────────────────────────────────────────
    { id: `${P}-019`, folder: "20-state-index", tech: "State", part: "tạo sản phẩm mới → phải xuất hiện trong tìm kiếm (bước 1: tạo)",
      method: "POST", path: "/api/products", auth: "admin",
      body: { name: "HW06-State-Marker", price: 12345, description: "state", imageUrl: "", category_id: 1 },
      status: 200, expect: "`{message, id}`, lưu `state_product_id`", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["hasField", "id"], ["saveJson", "state_product_id", "id"]] },

    { id: `${P}-020`, folder: "20-state-index", tech: "State", part: "bước 2: tìm được sản phẩm vừa tạo",
      method: "GET", path: "/api/products", query: { search: "HW06-State-Marker" }, auth: "none", status: 200,
      expect: "đúng 1 dòng, `name` khớp", basis: "spec §3.1 + §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 1],
        ["raw", `pm.test("name đúng sản phẩm vừa tạo", () => pm.expect(pm.response.json()[0].name).to.eql("HW06-State-Marker"));`]] },

    { id: `${P}-021`, folder: "20-state-index", tech: "State", part: "bước 3: xoá sản phẩm",
      method: "DELETE", path: "/api/products/{{state_product_id}}", auth: "admin", status: 200,
      expect: "`{message: 'Product deleted'}`", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaMessage"]] },

    { id: `${P}-022`, folder: "20-state-index", tech: "State", part: "bước 4: sau khi xoá thì **không** còn trong tìm kiếm",
      method: "GET", path: "/api/products", query: { search: "HW06-State-Marker" }, auth: "none", status: 200,
      expect: "mảng rỗng", basis: "spec §3.1 + §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 0]] },

    { id: `${P}-023`, folder: "20-state-index", tech: "State", part: "bước 5: xem chi tiết sản phẩm **đã xoá**",
      method: "GET", path: "/api/products/{{state_product_id}}", auth: "none", status: 404,
      expect: "404 + `{error}` — tài nguyên không còn tồn tại", basis: "spec §3.2 định nghĩa *xem chi tiết MỘT sản phẩm*; không có sản phẩm thì không có đối tượng để trả 200", src: "AI", audit: "VALID",
      checks: [["status", 404], ["schemaError"]] },

    // ── 30-security ──────────────────────────────────────────────────────────
    { id: `${P}-024`, folder: "30-security-sqli", tech: "Security SEC-05", part: "SQLi **tautology** — `%' OR '1'='1`",
      method: "GET", path: "/api/products", query: { search: "%' OR '1'='1" }, auth: "none", status: 200,
      expect: "coi là **chuỗi tìm kiếm bình thường** → 0 dòng; **không** được trả toàn bộ bảng", basis: "SEC-05 (parameterized query)", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 0], ["countLtVar", "total_products"]] },

    { id: `${P}-025`, folder: "30-security-sqli", tech: "Security SEC-05", part: "SQLi **comment** — `' OR 1=1--`",
      method: "GET", path: "/api/products", query: { search: "' OR 1=1--" }, auth: "none", status: 200,
      expect: "0 dòng, không trả toàn bộ bảng", basis: "SEC-05", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 0], ["countLtVar", "total_products"]] },

    { id: `${P}-026`, folder: "30-security-sqli", tech: "Security SEC-05", part: "SQLi **UNION** — dò số cột",
      method: "GET", path: "/api/products", query: { search: "' UNION SELECT 1,2,3,4,5--" }, auth: "none", status: 200,
      expect: "200 + 0 dòng; **không** lộ lỗi SQL", basis: "SEC-05", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isArray"], ["countEq", 0], ["bodyNotContains", "SQLITE"]] },

    { id: `${P}-027`, folder: "30-security-sqli", tech: "Security SEC-05", part: "SQLi **stacked query** — `'; DROP TABLE products--`",
      method: "GET", path: "/api/products", query: { search: "'; DROP TABLE products--" }, auth: "none", status: 200,
      expect: "200 + 0 dòng", basis: "SEC-05", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 0]] },

    { id: `${P}-028`, folder: "30-security-sqli", tech: "Security SEC-04", part: "payload **XSS** trong `search`",
      method: "GET", path: "/api/products", query: { search: "<script>alert(1)</script>" }, auth: "none", status: 200,
      expect: "200, `Content-Type: application/json` (payload là **dữ liệu**, không phải markup), 0 dòng", basis: "SEC-04", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isArray"], ["countEq", 0]] },

    { id: `${P}-029`, folder: "30-security-sqli", tech: "Security SEC-05", part: "SQLi **boolean-based** — `x' AND '1'='2`",
      method: "GET", path: "/api/products", query: { search: "x' AND '1'='2" }, auth: "none", status: 200,
      expect: "200 + 0 dòng, không 500", basis: "SEC-05", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isArray"], ["countEq", 0]] },

    // ── 40-schema ────────────────────────────────────────────────────────────
    { id: `${P}-030`, folder: "40-schema", tech: "Schema", part: "danh sách: **kiểu** của mọi field",
      method: "GET", path: "/api/products", auth: "none", status: 200,
      expect: "mảng object; `id` integer, `name` string, `price` **number**", basis: "spec §3.1 + body mẫu §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaProductArray"]] },

    { id: `${P}-031`, folder: "40-schema", tech: "Schema", part: "danh sách: **không** được lộ field nội bộ",
      method: "GET", path: "/api/products", auth: "none", status: 200,
      expect: "không có field ngoài tập của spec", basis: "spec §3.1", src: "AI", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("không có field ngoài spec", () => {
  const allowed = ["id","name","price","description","imageUrl","category_id","stock","created_at"];
  pm.response.json().slice(0, 20).forEach(p =>
    Object.keys(p).forEach(k => pm.expect(allowed, "field lạ: " + k).to.include(k)));
});`]] },

    { id: `${P}-032`, folder: "40-schema", tech: "Schema", part: "chi tiết **id lẻ** (id=1): `price` là number",
      method: "GET", path: "/api/products/1", auth: "none", status: 200,
      expect: "object đúng schema, `price` number", basis: "spec §3.2 + §3.3 (`price: 100000`)", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isObject"], ["fieldType", "price", "number"], ["schemaProduct"]] },

    { id: `${P}-033`, folder: "40-schema", tech: "Schema", part: "chi tiết: `id` **không tồn tại** (999999)",
      method: "GET", path: "/api/products/999999", auth: "none", status: 404,
      expect: "404 + `{error}`", basis: "spec §3.2 — *xem chi tiết một sản phẩm*", src: "AI", audit: "VALID",
      checks: [["status", 404], ["schemaError"]] },

    { id: `${P}-034`, folder: "40-schema", tech: "Schema", part: "chi tiết: `id` **sai kiểu** (`abc`)",
      method: "GET", path: "/api/products/abc", auth: "none", status: "400 hoặc 404",
      expect: "400/404, **không** 200", basis: "spec §3.2 — `:id` là số", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-035`, folder: "40-schema", tech: "Schema", part: "chi tiết: `id` **âm** (-1)",
      method: "GET", path: "/api/products/-1", auth: "none", status: "400 hoặc 404",
      expect: "400/404", basis: "spec §3.2 — id là khoá tự tăng, luôn ≥1", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-036`, folder: "40-schema", tech: "Schema", part: "chi tiết: `id = 0` (biên dưới - 1)",
      method: "GET", path: "/api/products/0", auth: "none", status: 404,
      expect: "404", basis: "spec §3.2", src: "AI", audit: "VALID",
      checks: [["status", 404]] },

    // ── 90-sv: case sinh viên tự thêm (§6.3) ─────────────────────────────────
    { id: `${P}-101`, folder: "90-sv-extended", tech: "Domain", part: "tiếng Việt **chữ thường có dấu** — `áo` (cách người Việt gõ thật)",
      method: "GET", path: "/api/products", query: { search: "áo" }, auth: "none", status: 200,
      expect: "1 dòng — **bằng** kết quả của `Áo` ở TC-006", basis: "FR-05 *tìm kiếm theo tên*; TC-006 đã chứng minh SUT tự nhận là không phân biệt hoa/thường với ASCII", src: "AI-2", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 1]] },

    { id: `${P}-102`, folder: "90-sv-extended", tech: "Domain", part: "`%` nằm trong **dữ liệu hợp lệ** — `100%`",
      method: "GET", path: "/api/products", query: { search: "100%" }, auth: "none", status: 200,
      expect: "đúng **1** dòng (`Bàn phím 100% cơ`) — `%` phải được hiểu là ký tự, không phải wildcard", basis: "FR-05; `%` là ký tự hợp pháp trong tên sản phẩm", src: "AI-2", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 1]] },

    { id: `${P}-103`, folder: "90-sv-extended", tech: "Domain", part: "chỉ **một ký tự `%`** — không phải payload tấn công",
      method: "GET", path: "/api/products", query: { search: "%" }, auth: "none", status: 200,
      expect: "0 dòng (không sản phẩm nào **tên** là `%`); **không** được trả toàn bộ bảng", basis: "FR-05", src: "AI-2", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 0], ["countLtVar", "total_products"]] },

    { id: `${P}-104`, folder: "90-sv-extended", tech: "Domain", part: "**dấu nháy đơn trong dữ liệu hợp lệ** — `O'Brien`",
      method: "GET", path: "/api/products", query: { search: "O'Brien" }, auth: "none", status: 200,
      expect: "1 dòng — đây là **tên riêng bình thường**, không phải tấn công", basis: "FR-05; SEC-05 (parameterized query xử lý được `'`)", src: "AI-2", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isArray"], ["countEq", 1]] },

    { id: `${P}-105`, folder: "90-sv-extended", tech: "Schema", part: "**response lỗi** phải là JSON và không lộ chi tiết engine",
      method: "GET", path: "/api/products", query: { search: "'" }, auth: "none", status: 200,
      expect: "`Content-Type: application/json`; body **không** chứa `SQLITE_ERROR` / `<h1>`", basis: "spec §3.1 (API trả JSON) · SEC-05 · nguyên tắc không rò rỉ thông tin nội bộ", src: "AI-2", audit: "VALID",
      checks: [["ctJson"], ["bodyNotContains", "SQLITE_ERROR"], ["bodyNotContains", "<h1>"]] },

    { id: `${P}-106`, folder: "90-sv-extended", tech: "Security SEC-05", part: "**hệ quả** của stacked query: bảng `products` phải còn nguyên",
      method: "GET", path: "/api/products", auth: "none", status: 200,
      expect: "số dòng = `total_products` (bảng không bị DROP sau TC-027)", basis: "SEC-05 — kiểm **tác động**, không chỉ status code", src: "AI-2", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEqVar", "total_products"]] },

    { id: `${P}-107`, folder: "90-sv-extended", tech: "Schema", part: "chi tiết **id chẵn** (id=2): `price` vẫn phải là number",
      method: "GET", path: "/api/products/2", auth: "none", status: 200,
      expect: "`price` là **number** — kiểu dữ liệu không được phụ thuộc tính chẵn/lẻ của `id`", basis: "spec §3.2 + §3.3 (`price: 100000` là số)", src: "AI-2", audit: "VALID",
      checks: [["status", 200], ["isObject"], ["fieldType", "price", "number"], ["schemaProduct"]] },
  ],

  // ── §6.3 — case DO SINH VIÊN CHỌN (SV quyết định kiểm gì; AI định dạng + tra căn cứ) ──────────
  own: [
    { id: `${P}-201`, folder: "91-sv-own", tech: "Domain", part: "`?limit=1` — **ghi nhận hành vi** với tham số spec không định nghĩa",
      method: "GET", path: "/api/products", query: { limit: 1 }, auth: "none", status: 200,
      expect: "200 + mảng JSON đúng schema. **Không** khẳng định phải honor `limit` hay phải trả 400: spec §3.1 chỉ định nghĩa `search`, và bỏ qua query param lạ là hành vi HTTP bình thường",
      basis: "spec §3.1 (chỉ `search` được định nghĩa) — case này là **characterization test**: ghi lại hành vi thật để lần sau đổi thì biết", src: "SV",
      audit: "INVALID: bản đầu đặt expected *'phải honor limit hoặc trả 400'* và báo thành BUG-20. Không có yêu cầu nào trong spec/FR đòi phân trang, nên đó là **kết luận không có căn cứ bắt buộc** — đúng họ lỗi #1–#3 của bài. Đã hạ về ghi nhận hành vi; rủi ro hiệu năng chuyển sang mục **đề xuất cải tiến** ở báo cáo §12, không báo là bug.",
      checks: [["status", 200], ["isArray"], ["schemaProductArray"],
        ["raw", `pm.test("ghi nhận: tham số lạ bị bỏ qua, trả toàn bộ bảng (không phải bug, xem §12)", () => {
  const n = pm.response.json().length, total = Number(pm.environment.get("total_products"));
  pm.expect(n).to.eql(total);
});`]] },

    { id: `${P}-202`, folder: "91-sv-own", tech: "Domain", part: "`?page=2` — ghi nhận hành vi, cùng lý do TC-201",
      method: "GET", path: "/api/products", query: { page: 2 }, auth: "none", status: 200,
      expect: "200 + mảng JSON. Spec §3.1 **im lặng** về phân trang → không khẳng định SUT sai",
      basis: "spec §3.1 — characterization test", src: "SV",
      audit: "INVALID: cùng lỗi với TC-201, đã sửa cùng cách.",
      checks: [["status", 200], ["isArray"],
        ["raw", `pm.test("ghi nhận: page=2 trả y hệt không phân trang", () => {
  pm.expect(pm.response.json().length).to.eql(Number(pm.environment.get("total_products")));
});`]] },

    { id: `${P}-203`, folder: "91-sv-own", tech: "Domain", part: "tìm chuỗi **chỉ có trong `description`**, không có trong `name`",
      method: "GET", path: "/api/products", query: { search: "HW06 fixture" }, auth: "none", status: 200,
      expect: "**0 dòng** — spec §3.1 nói tìm *theo tên*; nếu trả kết quả thì SUT tìm cả `description`, tức lệch spec",
      basis: "spec §3.1 *`?search=keyword` để tìm sản phẩm theo tên*", src: "SV", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 0]] },

    { id: `${P}-204`, folder: "91-sv-own", tech: "Domain", part: "`search` dài **8000 ký tự** (biên giới hạn URL)",
      method: "GET", path: "/api/products", query: { search: "A".repeat(8000) }, auth: "none", status: "200 / 400 / 414",
      expect: "200 (0 dòng), 400, hoặc **414 URI Too Long** — tuyệt đối không 500, và response vẫn là JSON",
      basis: "spec §3.1 không giới hạn độ dài; 500 nghĩa là input người dùng làm nổ tầng dưới", src: "SV", audit: "VALID",
      checks: [["statusIn", "200,400,414"], ["bodyNotContains", "SQLITE"]] },

    { id: `${P}-205`, folder: "91-sv-own", tech: "State", part: "**hệ quả** của TC-204: SUT còn phục vụ bình thường",
      method: "GET", path: "/api/products", auth: "none", status: 200,
      expect: "200 và số dòng = mốc `total_products` — chuỗi 8000 ký tự không được làm chết hay hỏng dữ liệu",
      basis: "spec §3.1 (endpoint phải phục vụ được sau mọi input) · cùng cách kiểm hệ quả đã dùng ở TC-106", src: "SV", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEqVar", "total_products"]] },
  ],

  ownWhyMissed: [
    { id: `${P}-201`, missed: "không sinh case nào cho **tham số lẽ ra nên có nhưng spec không định nghĩa** (`limit`/`page`)", group: "prompt quality", why: "Prompt yêu cầu *domain partitions on every parameter*, và `limit`/`page` không phải tham số trong spec nên không có trong bảng tham số ở bước 1. **Lưu ý về kết luận:** case này chỉ **ghi nhận hành vi**; việc thiếu phân trang được nêu ở §12 như *đề xuất cải tiến*, không báo thành bug — vì không yêu cầu nào trong spec/FR đòi phân trang." },
    { id: `${P}-202`, missed: "cùng nhóm với 201", group: "prompt quality", why: "Sinh viên nêu bối cảnh AI không có: DB thật của SUT ở HW05 có ~900k sản phẩm, nên một endpoint trả toàn bộ bảng là **rủi ro hiệu năng** đáng ghi lại — nhưng vẫn không phải vi phạm yêu cầu nào." },
    { id: `${P}-203`, missed: "không kiểm SUT có tìm **quá phạm vi** spec cho phép hay không", group: "model limitations", why: "AI sinh case theo hướng *tìm có ra kết quả đúng không*. Câu hỏi ngược — *có ra kết quả mà lẽ ra KHÔNG nên ra không* — cần nghĩ theo hướng phủ định phạm vi, và AI không tự đặt ra." },
    { id: `${P}-204`, missed: "chỉ đẩy độ dài tới **300 ký tự**, không tới biên thật của URL", group: "model limitations", why: "AI chọn 300 vì đó là con số 'trông đủ dài'. Biên thật nằm ở giới hạn URL của Node/Express (khoảng 8–16KB), tức phải chọn số theo **tầng dưới**, không theo cảm giác." },
    { id: `${P}-205`, missed: "không kiểm hệ quả sau case biên độ dài", group: "model limitations", why: "Cùng họ với việc AI kiểm SQLi bằng status code: case biên chỉ có nghĩa nếu chứng minh được hệ thống sau đó vẫn nguyên vẹn." },
  ],

  teardown: [
    { id: "TEARDOWN-01", folder: "99-teardown", tech: "Teardown", part: "xoá toàn bộ fixture `HW06-*` do lượt này tạo", basis: "-", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "đã gửi lệnh xoá",
      checks: [["status", 200], ["cleanupFixtures"]] },
  ],

  auditNotes: [
    "**Sửa 1 case (`TC-PRODLIST-011`).** Bản AI sinh đặt expected `0 dòng` cho `search=\" \"`. Spec §3.1 không nói gì về trim,",
    "nên `0 dòng` là suy đoán — nếu SUT trả về nhiều dòng thì đó **chưa chắc** là bug. Đã hạ về đúng phần spec bảo đảm:",
    "status 200 + schema. Đây là kiểu lỗi nguy hiểm nhất khi để AI sinh test: expected trông hợp lý nhưng không có căn cứ,",
    "và nó sinh ra **bug giả** trong báo cáo.",
    "",
    "**Không sửa expected để khớp SUT.** 14 case dưới đây ĐỎ ở lượt nộp — đúng danh sách, không gộp khoảng:",
    "`023 · 024 · 025 · 026 · 027 · 033 · 034 · 035 · 036 · 101 · 103 · 104 · 105 · 107`.",
    "Sửa expected cho khớp hành vi sai của SUT là cách nhanh nhất để bộ test mất hết giá trị — đỏ ở đây là",
    "**phát hiện**, không phải lỗi test. (Danh sách này được `tools/check-cases.mjs` đối chiếu với raw JSON của",
    "lượt chạy, nên nó không thể lệch âm thầm — bản trước ghi `007/…/101–107`, trong đó 007, 102 và 106 thực ra XANH.)",
  ],

  whyMissed: [
    { id: `${P}-101`, missed: "chỉ sinh case tiếng Việt **đúng hoa/thường** (`Áo`), không sinh biến thể chữ thường `áo`", group: "characteristics of the API", why: "`LIKE` của SQLite chỉ không phân biệt hoa/thường với **ASCII**; với ký tự Unicode có dấu thì phân biệt. Đặc điểm này nằm ở engine CSDL, không có trong spec — AI suy từ spec nên không thấy." },
    { id: `${P}-102`, missed: "coi `%` chỉ là payload tấn công, không nghĩ `%` là **ký tự hợp lệ trong tên sản phẩm**", group: "model limitations", why: "AI gắn `%` với ngữ cảnh SQL injection nên đặt nó vào nhóm security; bỏ mất phân vùng *dữ liệu hợp lệ chứa ký tự đặc biệt của LIKE*. Hai chuyện khác nhau: một cái là tấn công, một cái là khách hàng tìm 'bàn phím 100%'." },
    { id: `${P}-103`, missed: "không kiểm `search=%` một mình", group: "model limitations", why: "Cùng nguyên nhân với 102, và đây là case rẻ nhất để phát hiện wildcard injection: nếu trả toàn bộ bảng thì input đang được dùng như **pattern**, không phải như **giá trị**." },
    { id: `${P}-104`, missed: "chỉ sinh `'` dưới dạng payload SQLi, không sinh `'` trong **tên riêng hợp lệ**", group: "prompt quality", why: "Prompt yêu cầu *'security: SQL injection'* nên AI sinh payload tấn công. Không ai nói với nó rằng `O'Brien` là dữ liệu bình thường — mà chính case này mới cho thấy lỗi ảnh hưởng **người dùng thật**, không chỉ kẻ tấn công." },
    { id: `${P}-105`, missed: "không kiểm **response lỗi**: content-type và nội dung khi truy vấn thất bại", group: "prompt quality", why: "Prompt chỉ nói *'schema validation: response shape matches the spec'*, AI hiểu là response **thành công**. Đường lỗi là nơi rò rỉ thông tin nội bộ, và ở SUT này nó trả HTML kèm thông báo của SQLite." },
    { id: `${P}-106`, missed: "kiểm stacked query bằng status code, không kiểm **hệ quả** lên dữ liệu", group: "model limitations", why: "AI đánh giá test security qua status code. Một test SQLi chỉ có nghĩa nếu chứng minh được tác động — ở đây là bảng `products` còn nguyên sau `DROP TABLE`." },
    { id: `${P}-107`, missed: "không nghĩ tới việc kiểu dữ liệu phụ thuộc **tính chẵn/lẻ của `id`**", group: "characteristics of the API", why: "Không có đặc tả nào gợi ý điều này; nó nằm ở `server.js:161` (`if (row.id % 2 === 0) row.price = row.price.toString()`). Chỉ đọc source mới ra, và cũng là lý do bộ test phải kiểm **cả** id lẻ lẫn id chẵn." },
  ],
};
