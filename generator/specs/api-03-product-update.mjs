// ============================================================================
// API-03 · Pool C · FR-15 — PUT /api/products/:id (+ POST/GET/DELETE để setup & verify)
//
// Căn cứ expected:
//   · spec §3.3 "Thêm / Sửa / Xóa Sản phẩm **(Dành cho Admin)**" + body mẫu 5 field.
//   · SEC-02 (API bảo mật đòi JWT hợp lệ) và SEC-03 (API admin phải kiểm `role='admin'`).
//   · FR-15 Product management (CRUD).
//
// LƯU Ý AN TOÀN KHI CHẠY — vì sao fixture phải là **id lẻ**:
//   `GET /api/products/:id` chạy `row.price.toString()` khi `id` chẵn (server.js:161). Nếu `price`
//   đã bị ghi NULL (hệ quả của partial update ở TC-PRODUPD-104) thì lệnh đó ném TypeError **không
//   bắt** và **giết cả tiến trình backend**. Vì vậy 00-setup tạo 2 sản phẩm rồi chọn đúng cái có
//   **id lẻ** làm `product_id`; mọi request verify chỉ đọc id lẻ. Chuỗi làm sập SUT được tái hiện
//   riêng trong `bug-report/verify-bugs.sh` (có khởi động lại SUT), KHÔNG đặt trong collection —
//   một lượt Newman làm chết SUT giữa đường sẽ khiến các case sau đỏ vì môi trường, không vì bug.
// ============================================================================
const P = "TC-PRODUPD";
const FULL = (o = {}) => ({ name: "HW06-Upd", price: 200000, description: "d", imageUrl: "http://x/i.png", category_id: 1, ...o });
const put = (body, extra = {}) => ({ method: "PUT", path: "/api/products/{{product_id}}", auth: "admin", body, ...extra });

export default {
  slug: "api-03-product-update",
  label: "API-03 — Pool C · PUT /api/products/:id",
  pool: "C", fr: "FR-15 Product management (admin)", prefix: P,

  setup: [
    { id: "SETUP-01", folder: "00-setup", tech: "Setup", part: "login admin", basis: "-", src: "-",
      method: "POST", path: "/api/login", auth: "none", body: { email: "{{admin_email}}", password: "{{admin_password}}" },
      status: 200, expect: "token admin", checks: [["status", 200], ["saveJson", "admin_token", "token"]] },
    { id: "SETUP-02", folder: "00-setup", tech: "Setup", part: "login user thường (để thử role escalation)", basis: "-", src: "-",
      method: "POST", path: "/api/login", auth: "none", body: { email: "{{user_email}}", password: "{{user_password}}" },
      status: 200, expect: "token user", checks: [["status", 200], ["saveJson", "user_token", "token"]] },
    { id: "SETUP-03", folder: "00-setup", tech: "Setup", part: "dọn fixture `HW06-*` của lượt trước", basis: "-", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "đã gửi lệnh xoá",
      checks: [["status", 200], ["cleanupFixtures"]] },
    { id: "SETUP-04", folder: "00-setup", tech: "Setup", part: "tạo fixture #1", basis: "spec §3.3", src: "-",
      method: "POST", path: "/api/products", auth: "admin", body: FULL({ name: "HW06-Fixture-1" }),
      status: 200, expect: "lưu `fixture_1`", checks: [["status", 200], ["saveJson", "fixture_1", "id"]] },
    { id: "SETUP-05", folder: "00-setup", tech: "Setup", part: "tạo fixture #2 (để chắc chắn có một id LẺ)", basis: "spec §3.3", src: "-",
      method: "POST", path: "/api/products", auth: "admin", body: FULL({ name: "HW06-Fixture-2" }),
      status: 200, expect: "lưu `fixture_2`", checks: [["status", 200], ["saveJson", "fixture_2", "id"]] },
    { id: "SETUP-06", folder: "00-setup", tech: "Setup", part: "**chọn id LẺ** làm `product_id` (tránh nhánh `price.toString()` làm sập SUT)", basis: "server.js:161", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "`product_id` là id lẻ, `product_id_even` là id chẵn",
      checks: [["status", 200],
        ["raw", `const a = Number(pm.environment.get("fixture_1")), b = Number(pm.environment.get("fixture_2"));
const odd = [a, b].find(x => x % 2 === 1), even = [a, b].find(x => x % 2 === 0);
pm.environment.set("product_id", odd);
pm.environment.set("product_id_even", even);
console.log("[HW06] product_id (lẻ) =", odd, " product_id_even =", even);
pm.test("có đúng một id lẻ và một id chẵn trong 2 fixture", () => {
  pm.expect(odd, "không có id lẻ").to.be.a("number");
  pm.expect(even, "không có id chẵn").to.be.a("number");
});`]] },
    { id: "SETUP-07", folder: "00-setup", tech: "Setup", part: "lưu tổng số sản phẩm làm mốc", basis: "-", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "lưu `total_products`",
      checks: [["status", 200], ["isArray"], ["saveCount", "total_products"]] },
  ],

  cases: [
    // ── 10-domain-name ───────────────────────────────────────────────────────
    { id: `${P}-001`, folder: "10-domain-name", tech: "Domain", part: "cập nhật **hợp lệ đầy đủ 5 field**",
      ...put(FULL({ name: "HW06-Upd-Valid", price: 250000 })), status: 200,
      expect: "200 + `{message}`", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["schemaMessage"]] },

    { id: `${P}-002`, folder: "10-domain-name", tech: "State", part: "**verify** TC-001: đọc lại thấy giá trị mới",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "`name = HW06-Upd-Valid`, `price = 250000`", basis: "spec §3.2 + §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["fieldEq", "name", "HW06-Upd-Valid"], ["fieldEq", "price", 250000]] },

    { id: `${P}-003`, folder: "10-domain-name", tech: "Domain", part: "`name` **rỗng**",
      ...put(FULL({ name: "" })), status: "400/422",
      expect: "từ chối — sản phẩm phải có tên", basis: "FR-15 · spec §3.3 (body mẫu có `name`)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-004`, folder: "10-domain-name", tech: "Domain", part: "`name` **chỉ khoảng trắng**",
      ...put(FULL({ name: "   " })), status: "400/422",
      expect: "từ chối", basis: "FR-15", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-005`, folder: "10-domain-name", tech: "Domain", part: "`name` **rất dài** (300 ký tự)",
      ...put(FULL({ name: "L".repeat(300) })), status: "200 hoặc 400",
      expect: "hoặc chấp nhận (spec không giới hạn), hoặc 400 — **không** 500", basis: "spec §3.3 **im lặng** về độ dài tối đa", src: "AI",
      audit: "INCOMPLETE: bản AI sinh ghi cứng `400`. Spec không nêu giới hạn độ dài nên `400` là suy đoán; đã sửa thành 'không được 500' + kiểm response vẫn là JSON.",
      checks: [["statusIn", "200,400,422"], ["ctJson"]] },

    { id: `${P}-006`, folder: "10-domain-name", tech: "Security SEC-04", part: "`name` chứa payload **XSS**",
      ...put(FULL({ name: "<script>alert(1)</script>" })), status: "200/400",
      expect: "không 500; nếu lưu thì phải trả về dạng **dữ liệu JSON** (kiểm ở TC-007)", basis: "SEC-04", src: "AI", audit: "VALID",
      checks: [["statusIn", "200,400,422"]] },

    { id: `${P}-007`, folder: "10-domain-name", tech: "Schema", part: "**verify** TC-006: response là JSON, không phải HTML",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "`Content-Type: application/json`; payload nằm trong field JSON", basis: "SEC-04 + spec §3.2", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["isObject"]] },

    // ── 11-domain-price ──────────────────────────────────────────────────────
    { id: `${P}-008`, folder: "11-domain-price", tech: "Domain", part: "`price = 1` — **biên dưới hợp lệ**",
      ...put(FULL({ price: 1 })), status: 200,
      expect: "200", basis: "FR-15 · đề §6.1 nêu ví dụ ràng buộc `price > 0`", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaMessage"]] },

    { id: `${P}-009`, folder: "11-domain-price", tech: "Domain", part: "`price = 0` — **biên**",
      ...put(FULL({ price: 0 })), status: "400/422",
      expect: "từ chối — giá phải > 0", basis: "đề §6.1 (`price > 0`) · FR-15", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-010`, folder: "11-domain-price", tech: "Domain", part: "`price = -1` — **số âm**",
      ...put(FULL({ price: -1 })), status: "400/422",
      expect: "từ chối", basis: "đề §6.1 · FR-15", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-011`, folder: "11-domain-price", tech: "Domain", part: "`price = \"abc\"` — **sai kiểu**",
      ...put(FULL({ price: "abc" })), status: "400/422",
      expect: "từ chối", basis: "spec §3.3 (`price: 100000` là số)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-012`, folder: "11-domain-price", tech: "Domain", part: "`price = null`",
      ...put(FULL({ price: null })), status: "400/422",
      expect: "từ chối", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-013`, folder: "11-domain-price", tech: "Domain", part: "`price` **rất lớn** (9007199254740993 > 2^53)",
      ...put(FULL({ price: 9007199254740993 })), status: "200 hoặc 400",
      expect: "hoặc từ chối, hoặc lưu **đúng** giá trị — không được lặng lẽ làm tròn", basis: "FR-15 (không mất dữ liệu tiền tệ)", src: "AI", audit: "VALID",
      checks: [["statusIn", "200,400,422"]] },

    { id: `${P}-014`, folder: "11-domain-price", tech: "Schema", part: "**verify** TC-013: giá đọc lại phải khớp giá đã gửi",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "`price = 9007199254740993` (nếu TC-013 trả 200)", basis: "FR-15", src: "AI", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("giá không bị làm tròn khi lưu", () => {
  pm.expect(String(pm.response.json().price)).to.eql("9007199254740993");
});`]] },

    // ── 12-domain-category ───────────────────────────────────────────────────
    { id: `${P}-015`, folder: "12-domain-category", tech: "Domain", part: "`category_id = 1` — **tồn tại**",
      ...put(FULL({ category_id: 1, price: 300000 })), status: 200,
      expect: "200", basis: "spec §3.4", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaMessage"]] },

    { id: `${P}-016`, folder: "12-domain-category", tech: "Domain", part: "`category_id = 999999` — **không tồn tại**",
      ...put(FULL({ category_id: 999999 })), status: "400/422",
      expect: "từ chối — khoá ngoại không hợp lệ", basis: "spec §3.4 + FR-14 (danh mục phải tồn tại)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-017`, folder: "12-domain-category", tech: "Domain", part: "`category_id = \"abc\"` — sai kiểu",
      ...put(FULL({ category_id: "abc" })), status: "400/422",
      expect: "từ chối", basis: "spec §3.3 (`category_id: 1` là số)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-018`, folder: "12-domain-category", tech: "Domain", part: "`category_id = -1`",
      ...put(FULL({ category_id: -1 })), status: "400/422",
      expect: "từ chối", basis: "spec §3.4", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,422"]] },

    { id: `${P}-019`, folder: "12-domain-category", tech: "Domain", part: "`imageUrl` **không phải URL**",
      ...put(FULL({ imageUrl: "not-a-url" })), status: "200 hoặc 400",
      expect: "không 500; nếu chấp nhận thì đọc lại đúng nguyên văn", basis: "spec §3.3 (`imageUrl: \"http://...\"`) **im lặng** về validate URL", src: "AI", audit: "VALID",
      checks: [["statusIn", "200,400,422"], ["ctJson"]] },

    // ── 13-domain-id ─────────────────────────────────────────────────────────
    { id: `${P}-020`, folder: "13-domain-id", tech: "Domain", part: "`:id` **không tồn tại** (999999)",
      method: "PUT", path: "/api/products/999999", auth: "admin", body: FULL({ name: "HW06-Ghost" }), status: 404,
      expect: "404 + `{error}` — không có gì để cập nhật", basis: "spec §3.3 (*Cập nhật* một sản phẩm đang tồn tại)", src: "AI", audit: "VALID",
      checks: [["status", 404], ["schemaError"]] },

    { id: `${P}-021`, folder: "13-domain-id", tech: "Domain", part: "`:id = abc` — **sai kiểu**",
      method: "PUT", path: "/api/products/abc", auth: "admin", body: FULL(), status: "400/404",
      expect: "400/404", basis: "spec §3.3 (`:id` là số)", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-022`, folder: "13-domain-id", tech: "Domain", part: "`:id = 0` — biên dưới − 1",
      method: "PUT", path: "/api/products/0", auth: "admin", body: FULL(), status: 404,
      expect: "404", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["status", 404]] },

    { id: `${P}-023`, folder: "13-domain-id", tech: "Domain", part: "`:id = -1` — số âm",
      method: "PUT", path: "/api/products/-1", auth: "admin", body: FULL(), status: "400/404",
      expect: "400/404", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-024`, folder: "13-domain-id", tech: "Security SEC-05", part: "`:id` chứa payload **SQLi**",
      method: "PUT", path: "/api/products/1%20OR%201=1", auth: "admin", body: FULL({ name: "HW06-SQLi-Id" }), status: "400/404",
      expect: "400/404, **không** cập nhật hàng loạt", basis: "SEC-05", src: "AI", audit: "VALID",
      checks: [["statusIn", "400,404"]] },

    { id: `${P}-025`, folder: "13-domain-id", tech: "Security SEC-05", part: "**verify** TC-024: không sản phẩm nào bị đổi tên hàng loạt",
      method: "GET", path: "/api/products", auth: "none", status: 200,
      expect: "≤ 1 sản phẩm có tên `HW06-SQLi-Id`", basis: "SEC-05 — kiểm tác động", src: "AI", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("payload ở :id không cập nhật hàng loạt", () => {
  const hit = pm.response.json().filter(p => String(p.name) === "HW06-SQLi-Id");
  pm.expect(hit.length, "có " + hit.length + " sản phẩm bị đổi tên").to.be.at.most(1);
});`]] },

    // ── 20-state ─────────────────────────────────────────────────────────────
    { id: `${P}-026`, folder: "20-state-update", tech: "State", part: "bước 1: đặt trạng thái biết trước",
      ...put(FULL({ name: "HW06-State-Base", price: 500000, description: "desc-base", imageUrl: "http://x/base.png", category_id: 1 })), status: 200,
      expect: "200", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaMessage"]] },

    { id: `${P}-027`, folder: "20-state-update", tech: "State", part: "bước 2: xác nhận trạng thái nền",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "5 field đúng giá trị vừa đặt", basis: "spec §3.2", src: "AI", audit: "VALID",
      checks: [["status", 200], ["fieldEq", "name", "HW06-State-Base"], ["fieldEq", "price", 500000], ["fieldEq", "description", "desc-base"]] },

    { id: `${P}-028`, folder: "20-state-update", tech: "State", part: "bước 3: **xoá** sản phẩm",
      method: "DELETE", path: "/api/products/{{product_id_even}}", auth: "admin", status: 200,
      expect: "200 (xoá fixture id chẵn — chuẩn bị cho TC-029)", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaMessage"]] },

    { id: `${P}-029`, folder: "20-state-update", tech: "State", part: "bước 4: cập nhật sản phẩm **đã bị xoá**",
      method: "PUT", path: "/api/products/{{product_id_even}}", auth: "admin", body: FULL({ name: "HW06-Zombie" }), status: 404,
      expect: "404 — không hồi sinh được sản phẩm đã xoá", basis: "spec §3.3 + §3.2", src: "AI", audit: "VALID",
      checks: [["status", 404]] },

    { id: `${P}-030`, folder: "20-state-update", tech: "State", part: "bước 5: sản phẩm đã xoá **không** được xuất hiện lại trong danh sách",
      method: "GET", path: "/api/products", auth: "none", status: 200,
      expect: "không có sản phẩm tên `HW06-Zombie`", basis: "spec §3.1 + §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("không có sản phẩm HW06-Zombie", () => {
  pm.expect(pm.response.json().filter(p => String(p.name) === "HW06-Zombie").length).to.eql(0);
});`]] },

    // ── 30-security ──────────────────────────────────────────────────────────
    { id: `${P}-031`, folder: "30-security-auth", tech: "Security SEC-02", part: "**không có** header `Authorization`",
      ...put(FULL({ name: "HW06-NoAuth-Attempt", price: 999 }), { auth: "none" }), status: 401,
      expect: "401 + `{error}` — endpoint dành cho Admin", basis: "**SEC-02** · spec §3.3 *(Dành cho Admin)*", src: "AI", audit: "VALID",
      checks: [["status", 401], ["schemaError"]] },

    { id: `${P}-032`, folder: "30-security-auth", tech: "Security SEC-03", part: "token **user thường** — role escalation",
      ...put(FULL({ name: "HW06-UserToken-Attempt", price: 888 }), { auth: "user" }), status: 403,
      expect: "403 — phải kiểm `role='admin'`, không chỉ kiểm có token", basis: "**SEC-03** · spec §3.3", src: "AI", audit: "VALID",
      checks: [["status", 403], ["schemaError"]] },

    { id: `${P}-033`, folder: "30-security-auth", tech: "Security SEC-02", part: "token **rác**",
      ...put(FULL(), { auth: "malformed" }), status: "401/403",
      expect: "401/403", basis: "SEC-02", src: "AI", audit: "VALID",
      checks: [["statusIn", "401,403"]] },

    { id: `${P}-034`, folder: "30-security-auth", tech: "Security SEC-02", part: "**thiếu tiền tố `Bearer`**",
      ...put(FULL(), { auth: "nobearer" }), status: "401/403",
      expect: "401/403", basis: "SEC-02 · spec §2", src: "AI", audit: "VALID",
      checks: [["statusIn", "401,403"]] },

    { id: `${P}-035`, folder: "30-security-auth", tech: "Security SEC-06", part: "**mass assignment**: gửi kèm `id` và `role` trong body",
      ...put(FULL({ name: "HW06-MassAssign", id: 1, role: "admin" })), status: "200/400",
      expect: "không 500; `:id` trong URL là nguồn duy nhất xác định hàng cần sửa", basis: "SEC-06", src: "AI", audit: "VALID",
      checks: [["statusIn", "200,400,422"]] },

    { id: `${P}-036`, folder: "30-security-auth", tech: "Security SEC-06", part: "**verify** TC-035: sản phẩm `id=1` (dữ liệu seed) **không** bị sửa",
      method: "GET", path: "/api/products/1", auth: "none", status: 200,
      expect: "`name ≠ HW06-MassAssign`", basis: "SEC-06 — `id` trong body không được ghi đè `:id` trong URL", src: "AI", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("sản phẩm id=1 không bị body ghi đè", () => {
  pm.expect(String(pm.response.json().name)).to.not.eql("HW06-MassAssign");
});`]] },

    // ── 40-schema ────────────────────────────────────────────────────────────
    { id: `${P}-037`, folder: "40-schema", tech: "Schema", part: "response cập nhật đúng `{message: string}`",
      ...put(FULL({ name: "HW06-Schema-Check", price: 123456 })), status: 200,
      expect: "`{message: string}` + `Content-Type: application/json`", basis: "spec §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["ctJson"], ["schemaMessage"]] },

    { id: `${P}-038`, folder: "40-schema", tech: "Schema", part: "sau cập nhật, `GET` trả object đúng schema product",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "`id` integer, `name` string, `price` **number**", basis: "spec §3.2 + §3.3", src: "AI", audit: "VALID",
      checks: [["status", 200], ["schemaProduct"], ["fieldType", "price", "number"]] },

    { id: `${P}-039`, folder: "40-schema", tech: "Schema", part: "response **không** được lộ field nội bộ",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "không có field ngoài tập của spec", basis: "spec §3.2", src: "AI", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("không có field ngoài spec", () => {
  const allowed = ["id","name","price","description","imageUrl","category_id","stock","created_at"];
  Object.keys(pm.response.json()).forEach(k => pm.expect(allowed, "field lạ: " + k).to.include(k));
});`]] },

    // ── 90-sv-extended ───────────────────────────────────────────────────────
    { id: `${P}-101`, folder: "90-sv-extended", tech: "Security SEC-02", part: "**hệ quả** của PUT không token: dữ liệu có bị đổi thật không",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "`name ≠ HW06-NoAuth-Attempt` — request không token ở TC-031 **không được** ghi vào CSDL", basis: "SEC-02 — kiểm **tác động**, không chỉ status code", src: "AI-2", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("request KHÔNG token không được sửa được dữ liệu", () => {
  pm.expect(String(pm.response.json().name), "khách không đăng nhập đã sửa được sản phẩm").to.not.eql("HW06-NoAuth-Attempt");
});`]] },

    { id: `${P}-102`, folder: "90-sv-extended", tech: "Security SEC-03", part: "**hệ quả** của PUT bằng token user thường",
      ...put(FULL({ name: "HW06-EscalationProof", price: 777 }), { auth: "user" }), status: 403,
      expect: "403; nếu 200 thì TC-103 chứng minh dữ liệu đã bị đổi", basis: "SEC-03", src: "AI-2", audit: "VALID",
      checks: [["status", 403]] },

    { id: `${P}-103`, folder: "90-sv-extended", tech: "Security SEC-03", part: "**verify**: user thường có sửa được dữ liệu thật không",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "`name ≠ HW06-EscalationProof`", basis: "SEC-03 — role escalation chỉ được coi là bug khi chứng minh được dữ liệu đổi", src: "AI-2", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("user thường không được sửa sản phẩm", () => {
  pm.expect(String(pm.response.json().name), "user role=user đã sửa được sản phẩm của admin").to.not.eql("HW06-EscalationProof");
});`]] },

    { id: `${P}-104`, folder: "90-sv-extended", tech: "Domain", part: "**partial update**: body chỉ có `name`",
      ...put({ name: "HW06-Partial-Only-Name" }), status: "200/400",
      expect: "hoặc 400 (đòi đủ field), hoặc 200 nhưng **giữ nguyên** các field khác", basis: "FR-15 — cập nhật một field không được **xoá** dữ liệu các field khác", src: "AI-2", audit: "VALID",
      checks: [["statusIn", "200,400,422"]] },

    { id: `${P}-105`, folder: "90-sv-extended", tech: "Domain", part: "**verify** TC-104: các field khác không bị ghi NULL",
      method: "GET", path: "/api/products/{{product_id}}", auth: "none", status: 200,
      expect: "`price`, `description`, `category_id` **không null**", basis: "FR-15 — mất dữ liệu im lặng là lỗi nặng hơn cả từ chối request", src: "AI-2", audit: "VALID",
      checks: [["status", 200], ["fieldNotNull", "price"], ["fieldNotNull", "description"], ["fieldNotNull", "category_id"]] },

    { id: `${P}-106`, folder: "90-sv-extended", tech: "State", part: "PUT vào `:id` không tồn tại **không được tạo hàng mới**",
      method: "GET", path: "/api/products", auth: "none", status: 200,
      expect: "số sản phẩm ≤ mốc `total_products` (TC-020 không được tạo hàng mới)", basis: "spec §3.3 — PUT là *cập nhật*, không phải upsert", src: "AI-2", audit: "VALID",
      checks: [["status", 200],
        ["raw", `pm.test("PUT vào id không tồn tại không tạo thêm sản phẩm", () => {
  pm.expect(pm.response.json().length).to.be.at.most(Number(pm.environment.get("total_products")));
});`],
        ["raw", `pm.test("không có sản phẩm tên HW06-Ghost", () => {
  pm.expect(pm.response.json().filter(p => String(p.name) === "HW06-Ghost").length).to.eql(0);
});`]] },

    { id: `${P}-107`, folder: "90-sv-extended", tech: "Security SEC-02", part: "**route lân cận**: `POST /api/products` cũng không đòi token?",
      method: "POST", path: "/api/products", auth: "none", body: FULL({ name: "HW06-NoAuth-Create" }), status: 401,
      expect: "401 — *Thêm sản phẩm* cũng là API admin", basis: "SEC-02 · spec §3.3 *(Dành cho Admin)*", src: "AI-2", audit: "VALID",
      checks: [["status", 401]] },

    { id: `${P}-108`, folder: "90-sv-extended", tech: "Security SEC-02", part: "**route lân cận**: `DELETE /api/products/:id` không đòi token?",
      method: "DELETE", path: "/api/products/999999", auth: "none", status: "401/404",
      expect: "401 (hoặc 404 nếu đã kiểm quyền trước) — không được 200", basis: "SEC-02 · spec §3.3", src: "AI-2", audit: "VALID",
      checks: [["statusIn", "401,403,404"]] },
  ],

  teardown: [
    { id: "TEARDOWN-01", folder: "99-teardown", tech: "Teardown", part: "xoá fixture `HW06-*`", basis: "-", src: "-",
      method: "GET", path: "/api/products", auth: "none", status: 200, expect: "đã gửi lệnh xoá",
      checks: [["status", 200], ["cleanupFixtures"]] },
  ],

  auditNotes: [
    "**Sửa 1 case (`TC-PRODUPD-005`).** Bản AI sinh ghi expected `400` cho `name` dài 300 ký tự. Spec §3.3 không nêu giới",
    "hạn độ dài, nên `400` là suy đoán — nếu SUT nhận thì **chưa chắc** là bug. Đã hạ về mức spec bảo đảm: không 500 và",
    "response vẫn là JSON.",
    "",
    "**Chuỗi làm sập SUT KHÔNG nằm trong collection — và đó là quyết định có chủ ý.** TC-104/105 chứng minh partial update",
    "ghi NULL vào `price`. Nếu sau đó gọi `GET /api/products/:id` với **id chẵn**, `server.js:161` chạy `row.price.toString()`",
    "trên `null` → TypeError không bắt → **cả tiến trình backend chết**. Một lượt Newman chạm vào chuỗi đó sẽ làm mọi case",
    "phía sau đỏ vì môi trường chứ không vì bug, tức phá luôn giá trị của chính báo cáo. Vì vậy:",
    "  · 00-setup chọn **id lẻ** làm `product_id`, mọi verify chỉ đọc id lẻ;",
    "  · chuỗi gây sập được tái hiện riêng trong `bug-report/verify-bugs.sh` (có khởi động lại SUT sau đó).",
    "Đây là ví dụ cho một điều mà đề chấm: hiểu **giới hạn của công cụ** rồi thiết kế bộ test quanh nó, thay vì để công cụ",
    "quyết định phạm vi.",
  ],

  whyMissed: [
    { id: `${P}-101`, missed: "kiểm PUT không token bằng status code, **không** đọc lại dữ liệu", group: "model limitations", why: "AI coi 401 là điều kiện đủ. Nhưng SUT trả 200 cho request không token, và chỉ `GET` lại mới thấy tên sản phẩm **đã bị đổi thật** — khác biệt giữa 'API trả sai mã' và 'khách không đăng nhập sửa được dữ liệu sản phẩm' là khác biệt giữa severity Medium và Critical." },
    { id: `${P}-102`, missed: "không tách riêng case role escalation **có bằng chứng tác động**", group: "prompt quality", why: "Prompt liệt kê *'security (SEC-01–SEC-07, e.g., SQL injection, IDOR, role escalation)'* dưới dạng danh sách từ khoá, nên AI sinh mỗi từ khoá một case và dừng ở status code. Không có yêu cầu 'chứng minh tác động' thì nó không tự thêm bước verify." },
    { id: `${P}-103`, missed: "cùng chuỗi với 102", group: "prompt quality", why: "Bước verify là phần mang giá trị chứng minh; nó không xuất hiện nếu prompt không đòi." },
    { id: `${P}-104`, missed: "không sinh case **body thiếu field** cho một endpoint PUT", group: "characteristics of the API", why: "AI phân hoạch từng field một cách độc lập (rỗng, sai kiểu, biên) — nhưng *partial update* là câu hỏi về **ngữ nghĩa của PUT** trên chính SUT này: `UPDATE ... SET name=?, price=?, ...` với `undefined` → SQLite ghi NULL (`server.js:180-188`). Phải đọc câu SQL mới đặt ra câu hỏi." },
    { id: `${P}-105`, missed: "không kiểm **mất dữ liệu im lặng** sau partial update", group: "model limitations", why: "Đây là lỗi *không có triệu chứng ở response*: PUT trả 200 `{message: 'Product updated'}` đúng như thành công. Chỉ có bước đọc lại mới thấy `price`, `description`, `category_id` đã thành `null`. Đồng thời chính nó là mắt đầu tiên của chuỗi làm sập SUT." },
    { id: `${P}-106`, missed: "không kiểm PUT vào id không tồn tại có **tạo hàng mới** (upsert) không", group: "model limitations", why: "AI kiểm mã lỗi 404 rồi dừng. Câu hỏi đúng là *nếu không phải 404 thì SUT đã làm gì*: bỏ qua, hay tạo mới? Hai khả năng đó có hệ quả rất khác nhau về dữ liệu." },
    { id: `${P}-107`, missed: "chỉ kiểm **đúng endpoint được giao**, không soát các route lân cận cùng nhóm quyền", group: "prompt quality", why: "Prompt khoanh vùng *'the API you selected'*. Nhưng thiếu middleware là lỗi ở **mức router**: `POST` và `DELETE /api/products` cùng nằm trong mục 'Dành cho Admin' của spec và cùng thiếu `authenticateToken` (`server.js:167`, `:191`). Một báo cáo chỉ nói về PUT sẽ khiến người sửa vá đúng một dòng và để nguyên hai lỗ còn lại." },
    { id: `${P}-108`, missed: "cùng nhóm với 107", group: "prompt quality", why: "`DELETE` không token trả 200 kể cả với `id` không tồn tại — vừa là lỗ hổng quyền, vừa là lỗi luôn báo thành công." },
  ],
};
