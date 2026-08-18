// ============================================================================
// API-02 · Pool B · FR-07 — POST /api/cart (+ GET /api/cart, POST /api/checkout để verify)
//
// Căn cứ expected:
//   · spec §4.2 (body mẫu `{id, name, price, quantity: 2}`) — cho biết kiểu và tập field.
//   · FR-07 "Shopping cart" — giỏ hàng phản ánh **sản phẩm thật** và **số lượng dương**.
//   · SEC-02 — API có tính bảo mật đòi JWT hợp lệ.
//
// Một điểm phải nói rõ vì nó quyết định nhiều expected: spec §4.2 CÓ ghi `price` trong body. Bài này
// vẫn khẳng định giá trong giỏ phải **bằng giá trong catalog**, vì FR-08 tính tiền đơn hàng từ giỏ;
// nếu client tự đặt giá thì giá đơn hàng do client quyết định. Tức `price` trong body chỉ được coi
// là dữ liệu hiển thị, không phải nguồn sự thật. Đây là **suy luận từ FR-07/FR-08**, không phải câu
// chữ của spec — và được ghi đúng như vậy ở cột "Căn cứ".
//
// Giỏ hàng lưu **in-memory theo userId** (server.js:284-295) và KHÔNG có endpoint xoá giỏ, nên mọi
// assertion đếm số dòng đều dùng mốc tương đối (`cart_before`), không hard-code.
// ============================================================================
const P = "TC-CART";
const add = (body, extra = {}) => ({ method: "POST", path: "/api/cart", auth: "user", body, ...extra });
const PRICE = 111000;

export default {
  slug: "api-02-cart-add",
  label: "API-02 — Pool B · POST /api/cart",
  pool: "B", fr: "FR-07 Shopping cart", prefix: P,

  setup: [
    { id: "SETUP-01", folder: "00-setup", tech: "Setup", part: "login admin", basis: "-", src: "-",
      method: "POST", path: "/api/login", auth: "none", body: { email: "{{admin_email}}", password: "{{admin_password}}" },
      status: 200, expect: "token admin", checks: [["status", 200], ["saveJson", "admin_token", "token"]] },
    { id: "SETUP-02", folder: "00-setup", tech: "Setup", part: "login user thường", basis: "-", src: "-",
      method: "POST", path: "/api/login", auth: "none", body: { email: "{{user_email}}", password: "{{user_password}}" },
      status: 200, expect: "token user", checks: [["status", 200], ["saveJson", "user_token", "token"]] },
    { id: "SETUP-03", folder: "00-setup", tech: "Setup", part: "login user thứ hai (kiểm cách ly giỏ)", basis: "-", src: "-",
      method: "POST", path: "/api/login", auth: "none", body: { email: "{{user2_email}}", password: "{{user2_password}}" },
      status: 200, expect: "token user2 — nếu chưa có tài khoản: `npm run seed:api`", checks: [["status", 200], ["saveJson", "user2_token", "token"]] },
    { id: "SETUP-04", folder: "00-setup", tech: "Setup", part: `fixture sản phẩm giá ${PRICE}`, basis: "spec §3.3", src: "-",
      method: "POST", path: "/api/products", auth: "admin",
      body: { name: "HW06-Cart-Fixture", price: PRICE, description: "HW06 fixture", imageUrl: "", category_id: 1 },
      status: 200, expect: "lưu `product_id`", checks: [["status", 200], ["hasField", "id"], ["saveJson", "product_id", "id"]] },
    { id: "SETUP-05", folder: "00-setup", tech: "Setup", part: "lưu mốc số dòng trong giỏ trước khi test", basis: "-", src: "-",
      method: "GET", path: "/api/cart", auth: "user", status: 200, expect: "lưu `cart_before`",
      checks: [["status", 200], ["isArray"], ["saveCount", "cart_before"]] },
  ],

  cases: [
    // ── 10-domain-quantity ───────────────────────────────────────────────────
    { id: `${P}-001`, folder: "10-domain-quantity", tech: "Domain", part: "`quantity = 1` — **biên dưới hợp lệ**",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 1 }), status: 200,
      expect: "200 + `{message}`", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["schemaMessage"]] },

    { id: `${P}-002`, folder: "10-domain-quantity", tech: "Domain", part: "`quantity = 2` — giá trị điển hình",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 2 }), status: 200,
      expect: "200 + `{message}`", basis: "spec §4.2 (body mẫu)", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaMessage"]] },

    { id: `${P}-003`, folder: "10-domain-quantity", tech: "Domain", part: "`quantity = 0` — **biên dưới − 1**",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 0 }), status: "400/422",
      expect: "từ chối — thêm 0 sản phẩm vào giỏ là vô nghĩa", basis: "FR-07 (giỏ hàng chứa số lượng ≥ 1)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-004`, folder: "10-domain-quantity", tech: "Domain", part: "`quantity = -5` — **số âm**",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: -5 }), status: "400/422",
      expect: "từ chối", basis: "FR-07", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-005`, folder: "10-domain-quantity", tech: "Domain", part: "`quantity = 1.5` — **số thập phân**",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 1.5 }), status: "400/422",
      expect: "từ chối — số lượng là số nguyên", basis: "spec §4.2 (`quantity: 2` là số nguyên)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-006`, folder: "10-domain-quantity", tech: "Domain", part: "`quantity = \"abc\"` — **sai kiểu**",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: "abc" }), status: "400/422",
      expect: "từ chối", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-007`, folder: "10-domain-quantity", tech: "Domain", part: "**thiếu** `quantity`",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE }), status: "400/422",
      expect: "từ chối — `quantity` là field bắt buộc", basis: "spec §4.2 (body mẫu có `quantity`)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-008`, folder: "10-domain-quantity", tech: "Domain", part: "`quantity = 999999` — **vượt tồn kho**",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 999999 }), status: "400/422",
      expect: "từ chối", basis: "FR-07 (không bán quá tồn kho)", src: "AI",
      audit: "INCOMPLETE: bản AI sinh không nói lấy tồn kho ở đâu. Bảng `products` của SUT **không có** cột tồn kho (`database.js:64-72`), nên đây là ràng buộc FR-07 mà mô hình dữ liệu không đỡ được. Giữ case + ghi rõ hạn chế này trong báo cáo thay vì bỏ.",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-009`, folder: "10-domain-quantity", tech: "Domain", part: "`quantity = null`",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: null }), status: "400/422",
      expect: "từ chối", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    // ── 11-domain-id ─────────────────────────────────────────────────────────
    { id: `${P}-010`, folder: "11-domain-id", tech: "Domain", part: "`id` **không tồn tại** (999999)",
      ...add({ id: 999999, name: "ghost", price: 1000, quantity: 1 }), status: "400/404",
      expect: "từ chối — không thêm được sản phẩm không có trong catalog", basis: "FR-07 (giỏ chứa sản phẩm thật)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-011`, folder: "11-domain-id", tech: "Domain", part: "`id = 0` — biên dưới − 1",
      ...add({ id: 0, name: "x", price: 1000, quantity: 1 }), status: "400/404",
      expect: "từ chối", basis: "FR-07 · `id` là khoá tự tăng ≥ 1", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-012`, folder: "11-domain-id", tech: "Domain", part: "`id = -1` — số âm",
      ...add({ id: -1, name: "x", price: 1000, quantity: 1 }), status: "400/404",
      expect: "từ chối", basis: "FR-07", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-013`, folder: "11-domain-id", tech: "Domain", part: "`id = \"abc\"` — sai kiểu",
      ...add({ id: "abc", name: "x", price: 1000, quantity: 1 }), status: "400/422",
      expect: "từ chối", basis: "spec §4.2 (`id: 1` là số)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-014`, folder: "11-domain-id", tech: "Domain", part: "**thiếu** `id`",
      ...add({ name: "x", price: 1000, quantity: 1 }), status: "400/422",
      expect: "từ chối — không biết thêm sản phẩm nào", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-015`, folder: "11-domain-id", tech: "Domain", part: "**body rỗng** `{}`",
      ...add({}), status: "400/422",
      expect: "từ chối", basis: "spec §4.2 (4 field bắt buộc)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    // ── 12-domain-price ──────────────────────────────────────────────────────
    { id: `${P}-016`, folder: "12-domain-price", tech: "Domain", part: `\`price\` **khớp catalog** (${PRICE})`,
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 1 }), status: 200,
      expect: "200 + `{message}`", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaMessage"]] },

    { id: `${P}-017`, folder: "12-domain-price", tech: "Domain", part: "`price = 0`",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: 0, quantity: 1 }), status: "400/422",
      expect: "từ chối — giá 0 không khớp catalog", basis: "FR-07/FR-08 (giá trong giỏ phải là giá thật)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-018`, folder: "12-domain-price", tech: "Domain", part: "`price = -1000` — âm",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: -1000, quantity: 1 }), status: "400/422",
      expect: "từ chối", basis: "FR-08 (tiền không âm)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-019`, folder: "12-domain-price", tech: "Domain", part: "`price = \"abc\"` — sai kiểu",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: "abc", quantity: 1 }), status: "400/422",
      expect: "từ chối", basis: "spec §4.2 (`price: 100000` là số)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-020`, folder: "12-domain-price", tech: "Domain", part: "**thiếu** `price`",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", quantity: 1 }), status: "400/422",
      expect: "từ chối, **hoặc** lấy giá từ catalog", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    // ── 13-domain-name ───────────────────────────────────────────────────────
    { id: `${P}-021`, folder: "13-domain-name", tech: "Domain", part: "`name` **rỗng**",
      ...add({ id: "{{product_id}}", name: "", price: PRICE, quantity: 1 }), status: "400/422",
      expect: "từ chối, hoặc lấy tên từ catalog", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-022`, folder: "13-domain-name", tech: "Domain", part: "`name` **không khớp** sản phẩm thật",
      ...add({ id: "{{product_id}}", name: "Tên bịa không khớp id", price: PRICE, quantity: 1 }), status: "400/422",
      expect: "từ chối — tên phải khớp `id`, hoặc server tự lấy tên", basis: "FR-07 (giỏ phản ánh sản phẩm thật)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-023`, folder: "13-domain-name", tech: "Domain", part: "`name` **rất dài** (300 ký tự)",
      ...add({ id: "{{product_id}}", name: "N".repeat(300), price: PRICE, quantity: 1 }), status: "400/422",
      expect: "từ chối (tên không khớp catalog)", basis: "FR-07", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    // ── 20-state ─────────────────────────────────────────────────────────────
    { id: `${P}-024`, folder: "20-state-cart", tech: "State", part: "bước 1: thêm 1 sản phẩm rồi **đọc lại giỏ**",
      method: "GET", path: "/api/cart", auth: "user", status: 200,
      expect: "giỏ có nhiều hơn mốc `cart_before` (các case hợp lệ ở trên đã thêm)", basis: "spec §4.1 + §4.2", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"],
        ["raw", `pm.test("giỏ tăng so với mốc cart_before", () => {
  pm.expect(pm.response.json().length).to.be.above(Number(pm.environment.get("cart_before")));
});`],
        ["raw", `pm.environment.set("cart_after_adds", pm.response.json().length);`]] },

    { id: `${P}-025`, folder: "20-state-cart", tech: "State", part: "bước 2: **giá trong giỏ phải bằng giá catalog**",
      method: "GET", path: "/api/cart", auth: "user", status: 200,
      expect: `mọi dòng của \`product_id\` có \`price = ${PRICE}\``, basis: "FR-07/FR-08 — giá đơn hàng không do client quyết định", src: "AI", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("mọi dòng của product_id đều có giá đúng catalog", () => {
  const pid = Number(pm.environment.get("product_id"));
  const rows = pm.response.json().filter(r => Number(r.id) === pid);
  pm.expect(rows.length, "phải có ít nhất 1 dòng").to.be.above(0);
  rows.forEach(r => pm.expect(Number(r.price), "giá bị client sửa").to.eql(${PRICE}));
});`]] },

    { id: `${P}-026`, folder: "20-state-cart", tech: "State", part: "bước 3: thêm **cùng sản phẩm** lần nữa (quantity 3)",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 3 }), status: 200,
      expect: "200", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaMessage"]] },

    { id: `${P}-027`, folder: "20-state-cart", tech: "State", part: "bước 4: **một sản phẩm chỉ một dòng** trong giỏ",
      method: "GET", path: "/api/cart", auth: "user", status: 200,
      expect: "`product_id` xuất hiện **1 dòng** duy nhất (số lượng được cộng dồn)", basis: "FR-07 — giỏ hàng là tập sản phẩm kèm số lượng, không phải log các lần bấm", src: "AI", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("product_id chỉ có 1 dòng trong giỏ", () => {
  const pid = Number(pm.environment.get("product_id"));
  const rows = pm.response.json().filter(r => Number(r.id) === pid);
  pm.expect(rows.length, "giỏ có " + rows.length + " dòng trùng sản phẩm").to.eql(1);
});`]] },

    { id: `${P}-028`, folder: "20-state-cart", tech: "State", part: "bước 5: **checkout** đơn hàng",
      method: "POST", path: "/api/checkout", auth: "user",
      body: { total_amount: PRICE, shipping_address: "123 Le Loi, Q1, TP.HCM" }, status: 200,
      expect: "200 + `{message, orderId}`", basis: "spec §4.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["hasField", "orderId"], ["saveJson", "order_id", "orderId"]] },

    { id: `${P}-029`, folder: "20-state-cart", tech: "State", part: "bước 6: sau checkout **giỏ phải rỗng**",
      method: "GET", path: "/api/cart", auth: "user", status: 200,
      expect: "mảng **rỗng** — hàng đã chuyển thành đơn", basis: "FR-07 + FR-08 (vòng đời giỏ → đơn); nếu giỏ còn nguyên thì lần checkout sau tạo đơn trùng", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"], ["countEq", 0]] },

    { id: `${P}-030`, folder: "20-state-cart", tech: "State", part: "bước 7: **cách ly giỏ** — giỏ của user2 không bị ảnh hưởng",
      method: "GET", path: "/api/cart", auth: "user2", status: 200,
      expect: "giỏ user2 **không** chứa `product_id` của user1", basis: "FR-07 · SEC-02 (dữ liệu theo từng người dùng)", src: "AI", audit: "VALID",
      checks: [["status", 200], ["isArray"],
        ["raw", `pm.test("giỏ user2 không chứa sản phẩm user1 đã thêm", () => {
  const pid = Number(pm.environment.get("product_id"));
  pm.expect(pm.response.json().filter(r => Number(r.id) === pid).length).to.eql(0);
});`]] },

    // ── 30-security ──────────────────────────────────────────────────────────
    { id: `${P}-031`, folder: "30-security-auth", tech: "Security SEC-02", part: "**không có** header `Authorization`",
      ...add({ id: 1, name: "x", price: 1000, quantity: 1 }, { auth: "none" }), status: 401,
      expect: "401 + `{error}`", basis: "SEC-02 · spec §4 (*Yêu cầu Header: Authorization*)", src: "AI", audit: "VALID",
      checks: [["status", 401], ["schemaError"]] },

    { id: `${P}-032`, folder: "30-security-auth", tech: "Security SEC-02", part: "token **rác** (`abc.def.ghi`)",
      ...add({ id: 1, name: "x", price: 1000, quantity: 1 }, { auth: "malformed" }), status: "401/403",
      expect: "401/403 + `{error}`", basis: "SEC-02", src: "AI", audit: "VALID",
      checks: [["statusIn", "401,403"], ["schemaError"]] },

    { id: `${P}-033`, folder: "30-security-auth", tech: "Security SEC-02", part: "**thiếu tiền tố `Bearer`**",
      ...add({ id: 1, name: "x", price: 1000, quantity: 1 }, { auth: "nobearer" }), status: "401/403",
      expect: "401/403", basis: "SEC-02 · spec §2 (`Authorization: Bearer <token>`)", src: "AI", audit: "VALID",
      checks: [["statusIn", "401,403"]] },

    { id: `${P}-034`, folder: "30-security-auth", tech: "Security SEC-02", part: "header `Authorization` **rỗng**",
      ...add({ id: 1, name: "x", price: 1000, quantity: 1 }, { auth: "emptyval" }), status: "401/403",
      expect: "401/403", basis: "SEC-02", src: "AI", audit: "VALID",
      checks: [["statusIn", "401,403"]] },

    { id: `${P}-035`, folder: "30-security-auth", tech: "Security SEC-05", part: "payload **SQLi** trong `name`",
      ...add({ id: "{{product_id}}", name: "x'; DROP TABLE products--", price: PRICE, quantity: 1 }), status: "200/400",
      expect: "không lỗi 500, không lộ chi tiết SQL", basis: "SEC-05", src: "AI", audit: "VALID",
      checks: [["statusIn", "200,400,422"], ["bodyNotContains", "SQLITE"]] },

    { id: `${P}-036`, folder: "30-security-auth", tech: "Security", part: "**mass assignment** — gửi kèm field lạ `role`",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 1, role: "admin", isAdmin: true }), status: "200/400",
      expect: "field lạ **không** được lưu vào giỏ (kiểm ở TC-104)", basis: "SEC-06 (không cho client đặt field ngoài đặc tả)", src: "AI", audit: "VALID",
      checks: [["statusIn", "200,400,422"]] },

    // ── 40-schema ────────────────────────────────────────────────────────────
    { id: `${P}-037`, folder: "40-schema", tech: "Schema", part: "response của thêm giỏ đúng `{message: string}`",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 1 }), status: 200,
      expect: "`{message: string}`, `Content-Type: application/json`", basis: "spec §4.2", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["schemaMessage"], ["msg", "Added to cart"]] },

    { id: `${P}-038`, folder: "40-schema", tech: "Schema", part: "`GET /api/cart` đúng schema giỏ hàng",
      method: "GET", path: "/api/cart", auth: "user", status: 200,
      expect: "mảng object `{id, name, price, quantity}` với `quantity ≥ 1`", basis: "spec §4.1 + §4.2", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["schemaCartArray"]] },

    { id: `${P}-039`, folder: "40-schema", tech: "Schema", part: "`GET /api/cart` **không token** → 401",
      method: "GET", path: "/api/cart", auth: "none", status: 401,
      expect: "401 + `{error}`", basis: "SEC-02 · spec §4", src: "AI", audit: "VALID",
      checks: [["status", 401], ["schemaError"]] },

    // ── 90-sv-extended ───────────────────────────────────────────────────────
    { id: `${P}-101`, folder: "90-sv-extended", tech: "Security", part: "**price tampering**: gửi giá 1 đồng cho sản phẩm 111.000",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: 1, quantity: 1 }), status: "400/422",
      expect: "từ chối; nếu nhận thì TC-102 phải chứng minh giá bị ghi đè", basis: "FR-07/FR-08 — client không được quyết định giá", src: "SV", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-102`, folder: "90-sv-extended", tech: "Security", part: "**hệ quả** của price tampering: giỏ không được chứa giá 1 đồng",
      method: "GET", path: "/api/cart", auth: "user", status: 200,
      expect: `không dòng nào của \`product_id\` có \`price ≠ ${PRICE}\``, basis: "FR-08 — kiểm **tác động**, không chỉ status code", src: "SV", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("không có dòng nào bị sửa giá", () => {
  const pid = Number(pm.environment.get("product_id"));
  const bad = pm.response.json().filter(r => Number(r.id) === pid && Number(r.price) !== ${PRICE});
  pm.expect(bad.length, "có " + bad.length + " dòng giá sai: " + JSON.stringify(bad)).to.eql(0);
});`]] },

    { id: `${P}-103`, folder: "90-sv-extended", tech: "State", part: "**checkout lần hai** ngay sau lần một — không được tạo đơn trùng",
      method: "POST", path: "/api/checkout", auth: "user",
      body: { total_amount: PRICE, shipping_address: "123 Le Loi, Q1, TP.HCM" }, status: "400/409",
      expect: "từ chối vì giỏ đã rỗng sau lần checkout đầu", basis: "FR-07 + FR-08 — giỏ rỗng thì không có gì để đặt", src: "SV", audit: "VALID",
      checks: [["statusIn", "400,409,422"]] },

    { id: `${P}-104`, folder: "90-sv-extended", tech: "Security", part: "**hệ quả** của mass assignment: giỏ không được chứa field lạ",
      method: "GET", path: "/api/cart", auth: "user", status: 200,
      expect: "không dòng nào có field `role` / `isAdmin`", basis: "SEC-06 — field ngoài đặc tả không được đi vào state phía server", src: "SV", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("không dòng nào có field lạ role/isAdmin", () => {
  const bad = pm.response.json().filter(r => "role" in r || "isAdmin" in r);
  pm.expect(bad.length, "có " + bad.length + " dòng mang field lạ").to.eql(0);
});`]] },

    { id: `${P}-105`, folder: "90-sv-extended", tech: "Domain", part: "thêm sản phẩm **đã bị xoá khỏi catalog** (bước 1: xoá)",
      method: "DELETE", path: "/api/products/{{product_id}}", auth: "admin", status: 200,
      expect: "200 — sản phẩm biến mất khỏi catalog", basis: "spec §3.3", src: "SV", audit: "VALID",
      checks: [["status", 200]] },

    { id: `${P}-106`, folder: "90-sv-extended", tech: "Domain", part: "bước 2: thêm sản phẩm **vừa bị xoá** vào giỏ",
      ...add({ id: "{{product_id}}", name: "HW06-Cart-Fixture", price: PRICE, quantity: 1 }), status: "400/404",
      expect: "từ chối — sản phẩm không còn tồn tại", basis: "FR-07 (giỏ chỉ chứa sản phẩm đang bán)", src: "SV", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-107`, folder: "90-sv-extended", tech: "Schema", part: "**giỏ không được chứa dòng có `quantity ≤ 0`** sau tất cả case trên",
      method: "GET", path: "/api/cart", auth: "user", status: 200,
      expect: "không dòng nào `quantity ≤ 0`", basis: "FR-07 — trạng thái giỏ phải luôn hợp lệ, kể cả sau khi bị gửi input sai", src: "SV", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("không dòng nào có quantity <= 0", () => {
  const bad = pm.response.json().filter(r => !(Number(r.quantity) > 0));
  pm.expect(bad.length, "có " + bad.length + " dòng quantity không hợp lệ: " + JSON.stringify(bad.slice(0,3))).to.eql(0);
});`]] },
  ],

  teardown: [
    { id: "TEARDOWN-01", folder: "99-teardown", tech: "Teardown", part: "xoá fixture `HW06-*`", basis: "-", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "đã gửi lệnh xoá",
      checks: [["status", 200], ["cleanupFixtures"]] },
  ],

  auditNotes: [
    "**Sửa 1 case (`TC-CART-008`).** Bản AI sinh ghi expected *'từ chối vì vượt tồn kho'* nhưng bảng `products` của SUT",
    "**không có** cột tồn kho (`database.js:64-72`) — tức ràng buộc FR-07 này không có dữ liệu để kiểm. Giữ lại case (yêu cầu",
    "vẫn tồn tại) nhưng ghi rõ hạn chế, thay vì xoá case cho bảng đẹp hoặc giả vờ có tồn kho.",
    "",
    "**Một điểm cần nói rõ về `price` (ảnh hưởng TC-016…020 và TC-101/102).** spec §4.2 CÓ ghi `price` trong body, nên",
    "đọc thuần câu chữ thì gửi giá là *đúng đặc tả*. Bài này vẫn khẳng định giá trong giỏ phải bằng giá catalog, vì FR-08",
    "tính tiền đơn từ giỏ — nếu client đặt giá thì client đặt luôn số tiền phải trả. Đây là **suy luận từ FR-07/FR-08**,",
    "không phải câu chữ spec, và cột 'Căn cứ' ghi đúng như vậy để người chấm tự đánh giá được lập luận.",
    "",
    "**Giỏ hàng in-memory.** `userCarts` là biến trong RAM (`server.js:284-295`) và **không có endpoint xoá giỏ**, nên mọi",
    "assertion đếm dòng dùng mốc tương đối `cart_before`. Không hard-code số dòng — chạy hai lượt liên tiếp mà không",
    "khởi động lại SUT thì số tuyệt đối sẽ khác.",
  ],

  whyMissed: [
    { id: `${P}-101`, missed: "sinh case `price` sai kiểu / âm, nhưng **không** sinh case giá hợp lệ nhưng **sai so với catalog**", group: "prompt quality", why: "Prompt nói *'domain partitions on every parameter'* nên AI phân hoạch theo **kiểu và biên** của từng field. `price = 1` là số dương hợp lệ — nó chỉ sai khi **so với dữ liệu khác** (giá trong bảng `products`). Phân hoạch một tham số độc lập không bao giờ tìm ra loại lỗi này." },
    { id: `${P}-102`, missed: "không kiểm **hệ quả** trong state phía server sau khi gửi giá sai", group: "model limitations", why: "AI kết thúc case ở status code. Nhưng SUT trả 200 cho mọi input, nên status code không phân biệt được 'đã validate' với 'nhận bừa' — chỉ đọc lại `GET /api/cart` mới thấy giá 1 đồng nằm trong giỏ." },
    { id: `${P}-103`, missed: "không nghĩ tới **checkout hai lần liên tiếp**", group: "characteristics of the API", why: "Đặc điểm riêng của SUT: `POST /api/checkout` chỉ `INSERT` vào `orders` mà không xoá giỏ (`server.js:297-309`), nên giỏ sống sót qua checkout. Không có gì trong spec gợi ý điều này; phải nhìn chuỗi trạng thái giỏ→đơn mới đặt ra câu hỏi." },
    { id: `${P}-104`, missed: "gửi field lạ nhưng không kiểm nó có **được lưu** không", group: "model limitations", why: "Cùng họ với 102: AI coi mass assignment là 'gửi field lạ xem có 400 không'. Rủi ro thật là field lạ **đi vào state**; ở đây `push(req.body)` lưu nguyên object nên `role: 'admin'` nằm luôn trong giỏ." },
    { id: `${P}-105`, missed: "không sinh chuỗi **xoá sản phẩm rồi thêm vào giỏ**", group: "prompt quality", why: "Prompt tách 'state transitions' thành trạng thái của **đơn hàng** (FR-10 pending→confirmed→…). Không ai nói rằng *catalog* cũng có trạng thái, và sản phẩm bị xoá là một trạng thái hợp lệ của nó." },
    { id: `${P}-106`, missed: "cùng chuỗi với 105", group: "prompt quality", why: "Case này chỉ tồn tại nếu đã nghĩ ra 105. Nó cũng cho thấy ràng buộc *'giỏ chỉ chứa sản phẩm đang bán'* của FR-07 không được kiểm ở bất kỳ đâu trong SUT." },
    { id: `${P}-107`, missed: "không có case kiểm **bất biến của trạng thái giỏ** sau khi bị bơm input sai", group: "model limitations", why: "AI viết test theo từng request. Câu hỏi 'sau tất cả những input rác đó, trạng thái giỏ có còn hợp lệ không' là câu hỏi ở mức **hệ thống**, và nó bắt được đúng thứ mà 9 case quantity riêng lẻ chỉ gợi ý." },
  ],
};
