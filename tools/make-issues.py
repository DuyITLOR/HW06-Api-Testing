#!/usr/bin/env python3
"""make-issues.py — dựng 19 file nội dung GitHub Issue từ bug-report/bug-report.md.

    python3 tools/make-issues.py            # ghi bug-report/issues/BUG-XX.md
Nội dung theo ĐÚNG thứ tự trường của .github/ISSUE_TEMPLATE/bug_report.md trong repo SUT.
Ảnh nhúng bằng raw URL của repo HW06 (public) — gh CLI không upload được ảnh vào issue.
"""
import pathlib

RAW = "https://raw.githubusercontent.com/DuyITLOR/HW06-Api-Testing/main"
REPO = "https://github.com/DuyITLOR/HW06-Api-Testing/blob/main"
ENV = "`localhost:3000` · SUT commit `f0f3b7b` · Node v22.23.1 · Newman 6.2.2 · macOS 26.1 arm64"
SHOT = {"01": "newman-api-01-products-search.png", "02": "newman-api-02-cart-add.png", "03": "newman-api-03-product-update.png"}

B = [
 dict(id="01", api="01", mod="products/search", sev="Critical", pri="P1", req="SEC-05",
  title="SQL injection qua tham số search — payload vô hiệu hoá điều kiện WHERE",
  tc="TC-PRODLIST-024, 025, 026, 027, 106",
  steps="""```bash
curl 'http://localhost:3000/api/products?search=Laptop'            # → 2 dòng
curl -G --data-urlencode "search=%' OR '1'='1" http://localhost:3000/api/products
# → TOÀN BỘ bảng products
curl -G --data-urlencode "search=' UNION SELECT 1,2,3,4,5--" http://localhost:3000/api/products
# → 500 + "SELECTs to the left and right of UNION do not have the same number of result columns"
```""",
  exp="`search` là **giá trị tìm kiếm**, không phải mã SQL → 0 dòng, status 200.",
  act="""`server.js:143` nối chuỗi trực tiếp:

```js
const query = `SELECT * FROM products WHERE name LIKE '%${searchQuery}%'`;
```

Điều kiện `WHERE` bị vô hiệu hoá (trả toàn bộ bảng), và payload UNION làm lộ **số cột thật** của bảng.

Mức khai thác thực tế đã kiểm: **đọc dữ liệu + dò cấu trúc**. Payload `'; DROP TABLE products--` **không**
xoá được bảng vì `db.all()` chỉ chạy câu đầu (TC-PRODLIST-106 xanh) — ghi rõ để không phóng đại."""),

 dict(id="02", api="01", mod="products/search", sev="High", pri="P1", req="SEC-05 · spec §3.1",
  title="Lỗi CSDL trả về HTML kèm thông báo nội bộ của SQLite",
  tc="TC-PRODLIST-026, 104, 105",
  steps="""```bash
curl -i -G --data-urlencode "search='" http://localhost:3000/api/products
# HTTP/1.1 500 · Content-Type: text/html
# <h1>Database Error</h1><p>SQLITE_ERROR: unrecognized token: "'"</p>
```""",
  exp="API trả JSON ở **mọi** đường (spec §3.1); response lỗi không được chứa chi tiết engine CSDL.",
  act="`server.js:146-149` trả HTML kèm `err.message`. Hai vấn đề: (1) sai schema — client parse JSON sẽ nổ; (2) rò rỉ thông tin nội bộ, hỗ trợ trực tiếp cho việc khai thác BUG-01. Một tên riêng hợp lệ như `O'Brien` cũng kích hoạt lỗi này (TC-PRODLIST-104)."),

 dict(id="03", api="01", mod="products/detail", sev="Medium", pri="P2", req="spec §3.2",
  title="GET /api/products/:id không tồn tại trả 200 {} thay vì 404",
  tc="TC-PRODLIST-023, 033, 034, 035, 036",
  steps="""```bash
curl -i http://localhost:3000/api/products/999999   # → 200 {}
curl -i http://localhost:3000/api/products/abc      # → 200 {}
curl -i http://localhost:3000/api/products/-1       # → 200 {}
curl -i http://localhost:3000/api/products/0        # → 200 {}
```""",
  exp="404 + `{error}` — spec §3.2 định nghĩa *xem chi tiết MỘT sản phẩm*; không có sản phẩm thì không có đối tượng để trả 200.",
  act="`server.js:160` `if (!row) return res.status(200).json({})`. Client không phân biệt được *không tồn tại* với *tồn tại nhưng rỗng*, và `:id` sai kiểu cũng không bị từ chối."),

 dict(id="04", api="01", mod="products/detail", sev="Medium", pri="P2", req="spec §3.2/§3.3",
  title="Kiểu dữ liệu của price phụ thuộc tính chẵn/lẻ của id",
  tc="TC-PRODLIST-107, TC-PRODUPD-038",
  steps="""```bash
curl http://localhost:3000/api/products/1   # → "price": 30000000   (number)
curl http://localhost:3000/api/products/2   # → "price": "28000000" (string)
```""",
  exp="`price` luôn là **number** (spec §3.3 ghi `price: 100000`). Kiểu dữ liệu không được phụ thuộc giá trị khoá.",
  act="`server.js:161`: `if (row.id % 2 === 0) row.price = row.price.toString();`. Client tính toán trên `price` sẽ ra kết quả nối chuỗi với một nửa số sản phẩm. Đây cũng là **mắt thứ ba của BUG-14** (khi `price` là NULL thì lệnh này làm sập tiến trình)."),

 dict(id="05", api="01", mod="products/search", sev="Medium", pri="P2", req="FR-05",
  title="Tìm kiếm tiếng Việt có dấu bị phân biệt hoa/thường",
  tc="TC-PRODLIST-101 (đối chứng: TC-PRODLIST-004/006)",
  steps="""```bash
# đã có sản phẩm tên "HW06-Áo thun cổ tròn"
curl -G --data-urlencode "search=Áo" http://localhost:3000/api/products      # → 1 dòng
curl -G --data-urlencode "search=áo" http://localhost:3000/api/products      # → 0 dòng
# đối chứng ASCII:
curl -G --data-urlencode "search=Laptop" http://localhost:3000/api/products  # → 2 dòng
curl -G --data-urlencode "search=laptop" http://localhost:3000/api/products  # → 2 dòng
```""",
  exp="`áo` và `Áo` cho cùng kết quả. SUT là ứng dụng tiếng Việt, và chính nó **đã** không phân biệt hoa/thường với ASCII.",
  act="`LIKE` của SQLite chỉ không phân biệt hoa/thường trong phạm vi **ASCII**. Người dùng gõ `áo` — cách gõ tự nhiên nhất — không tìm được sản phẩm nào. Cần `LOWER()` có Unicode hoặc cột tìm kiếm đã chuẩn hoá."),

 dict(id="06", api="01", mod="products/search", sev="Medium", pri="P2", req="FR-05 · SEC-05",
  title="Ký tự % và _ của LIKE không được escape — input bị dùng như pattern",
  tc="TC-PRODLIST-102, 103",
  steps="""```bash
# đã có sản phẩm tên "HW06-Bàn phím 100% cơ"
curl -G --data-urlencode "search=100%" http://localhost:3000/api/products  # → 2 dòng (đúng ra 1)
curl -G --data-urlencode "search=%"    http://localhost:3000/api/products  # → TOÀN BỘ bảng
curl -G --data-urlencode "search=_"    http://localhost:3000/api/products  # → TOÀN BỘ bảng
```""",
  exp="`%` và `_` là **ký tự bình thường** trong tên sản phẩm → khớp đúng nghĩa chữ.",
  act="Input được ghép thẳng vào mẫu `LIKE` nên trở thành **wildcard**. Khách tìm “bàn phím 100%” nhận thêm kết quả sai; và đây là dạng nhẹ của cùng gốc rễ với BUG-01. Cần escape `%` `_` `\\` kèm `ESCAPE`."),

 dict(id="07", api="02", mod="cart", sev="High", pri="P1", req="FR-07 · spec §4.2",
  title="POST /api/cart không validate bất kỳ field nào",
  tc="TC-CART-003…015, 021…023, 107",
  steps="""```bash
TOKEN=$(curl -s -X POST localhost:3000/api/login -H 'Content-Type: application/json' \\
  -d '{"email":"test@eshop.com","password":"Test1234!"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')
for body in '{"id":1,"name":"x","price":200000,"quantity":0}' \\
            '{"id":1,"name":"x","price":200000,"quantity":-5}' \\
            '{"id":1,"name":"x","price":200000,"quantity":1.5}' \\
            '{"id":1,"name":"x","price":200000,"quantity":"abc"}' \\
            '{}'; do
  curl -s -o /dev/null -w "%{http_code} " -X POST localhost:3000/api/cart \\
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$body"
done                                  # → 200 200 200 200 200
```""",
  exp="Từ chối (400) mọi input trên: `quantity` phải là số nguyên ≥ 1 (spec §4.2 `quantity: 2`), 4 field là bắt buộc.",
  act="`server.js:290-295` là `userCarts[userId].push(req.body)` — không có tầng validate nào. Giỏ hàng chứa được dòng `quantity = -5` và cả dòng rỗng `{}` (TC-CART-107 chứng minh trạng thái giỏ sau đó không còn hợp lệ)."),

 dict(id="08", api="02", mod="cart", sev="Critical", pri="P1", req="FR-07 · FR-08",
  title="Price tampering — giá sản phẩm trong giỏ do client quyết định",
  tc="TC-CART-025, 101, 102",
  steps="""```bash
# sản phẩm id=7 có giá 200000 trong catalog
curl -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" \\
  -H 'Content-Type: application/json' -d '{"id":7,"name":"HW06-Verify","price":1,"quantity":1}'
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"
# → [{"id":7,"name":"HW06-Verify","price":1,"quantity":1}]
```""",
  exp="Giá trong giỏ phải bằng giá trong bảng `products`, hoặc request bị từ chối.",
  act="""Không đối chiếu catalog. Giá 1 đồng nằm trong giỏ, và `POST /api/checkout` cũng nhận `total_amount`
từ client → **số tiền phải trả do người mua đặt**.

**Ghi chú về căn cứ (đọc kỹ):** spec §4.2 *có* ghi `price` trong body, nên đọc thuần câu chữ thì việc gửi
giá là đúng đặc tả. Kết luận bug dựa trên **FR-07 + FR-08**: giỏ phản ánh sản phẩm thật và FR-08 tính tiền
đơn từ giỏ. Lập luận đầy đủ: [`test-cases/api-02-cart-add/audit.md`](%s/test-cases/api-02-cart-add/audit.md).""" % REPO),

 dict(id="09", api="02", mod="cart/checkout", sev="High", pri="P1", req="FR-07 · FR-08",
  title="Giỏ hàng không được xoá sau khi checkout — đặt lại tạo đơn trùng",
  tc="TC-CART-029, 103",
  steps="""```bash
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"       # → 7 dòng
curl -X POST localhost:3000/api/checkout -H "Authorization: Bearer $TOKEN" \\
  -H 'Content-Type: application/json' -d '{"total_amount":200000,"shipping_address":"123 Le Loi"}'
# → 200 {"message":"Checkout successful","orderId":1}
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"       # → VẪN 7 dòng
```""",
  exp="Sau khi đặt hàng thành công, giỏ rỗng (vòng đời giỏ → đơn).",
  act="`server.js:297-309` chỉ `INSERT INTO orders`, không xoá `userCarts[userId]`. Người dùng bấm Đặt hàng lần nữa (hoặc F5) là tạo **đơn trùng** với cùng số hàng. TC-CART-103 xác nhận lần checkout thứ hai vẫn trả 200."),

 dict(id="10", api="02", mod="cart", sev="Medium", pri="P2", req="SEC-06",
  title="Mass assignment — field ngoài đặc tả được lưu thẳng vào giỏ",
  tc="TC-CART-036, 104",
  steps="""```bash
curl -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \\
  -d '{"id":7,"name":"x","price":200000,"quantity":1,"role":"admin","isAdmin":true}'
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"
# → [... {"id":7,...,"role":"admin","isAdmin":true} ...]
```""",
  exp="Chỉ 4 field trong spec §4.2 được nhận; field lạ bị bỏ hoặc request bị từ chối.",
  act="`push(req.body)` lưu nguyên object → `role: \"admin\"` nằm trong state phía server. Hiện chưa thấy đường leo quyền từ đây, nhưng đây đúng là tiền đề của SEC-06 và sẽ thành lỗ hổng ngay khi có đoạn mã nào đọc field đó."),

 dict(id="11", api="02", mod="cart", sev="Medium", pri="P2", req="FR-07",
  title="Thêm được sản phẩm không tồn tại hoặc đã bị xoá vào giỏ",
  tc="TC-CART-010, 011, 012, 105, 106",
  steps="""```bash
curl -i -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \\
  -d '{"id":999999,"name":"ghost","price":1,"quantity":1}'      # → 200 Added to cart
# và: xoá sản phẩm khỏi catalog rồi thêm chính nó vào giỏ → cũng 200
```""",
  exp="400/404 — giỏ chỉ chứa sản phẩm đang bán (FR-07).",
  act="Không kiểm tồn tại của `id` trong bảng `products`. `id = 0`, `id = -1`, `id` không tồn tại và sản phẩm đã bị `DELETE` đều vào giỏ được, rồi đi tiếp vào đơn hàng ở bước checkout."),

 dict(id="12", api="02", mod="cart", sev="Low", pri="P3", req="FR-07",
  title="Thêm cùng một sản phẩm nhiều lần tạo nhiều dòng, không cộng dồn số lượng",
  tc="TC-CART-026, 027",
  steps="""```bash
curl -X POST localhost:3000/api/cart ... -d '{"id":7,"name":"x","price":200000,"quantity":1}'
curl -X POST localhost:3000/api/cart ... -d '{"id":7,"name":"x","price":200000,"quantity":3}'
curl localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"   # → 2 dòng cùng id=7
```""",
  exp="Một sản phẩm một dòng, số lượng cộng dồn (giỏ là tập sản phẩm kèm số lượng, không phải log các lần bấm).",
  act="`push` không tìm dòng có sẵn. Giao diện giỏ sẽ hiện trùng sản phẩm, và tổng tiền phụ thuộc số lần bấm."),

 dict(id="13", api="03", mod="products/admin", sev="Critical", pri="P1", req="SEC-02, SEC-03 · spec §3.3",
  title="PUT/POST/DELETE /api/products không có tầng xác thực nào",
  tc="TC-PRODUPD-031, 032, 033, 034, 101, 102, 103, 107, 108",
  steps="""```bash
# KHÔNG có Authorization ở bất kỳ request nào dưới đây
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \\
  -d '{"name":"HACKED-anon","price":1,"description":"d","imageUrl":"u","category_id":1}'
curl localhost:3000/api/products/7        # → "name":"HACKED-anon"  ← dữ liệu ĐÃ đổi thật

curl -X POST   localhost:3000/api/products -H 'Content-Type: application/json' \\
  -d '{"name":"HW06-anon-create","price":1,"description":"d","imageUrl":"u","category_id":1}'   # → 200
curl -X DELETE localhost:3000/api/products/999999                                              # → 200

# và với token user role=user: cũng 200, dữ liệu cũng đổi
```""",
  exp="401 khi không có token (SEC-02); **403** khi token có `role='user'` (SEC-03 — spec §3.3 ghi rõ *Dành cho Admin*).",
  act="""Ba route `PUT` (`server.js:179`), `POST` (`:167`), `DELETE` (`:191`) **không gắn** middleware
`authenticateToken`. Không phải thiết kế toàn cục: `POST /api/categories` (`:249`) *có* gắn — nên đây là
thiếu sót cục bộ ở đúng ba route quản lý sản phẩm.

Test case không dừng ở status code: TC-PRODUPD-101/103 `GET` lại sản phẩm để chứng minh **dữ liệu đã bị
đổi thật** — đó là khác biệt giữa “API trả sai mã lỗi” và “người lạ sửa được catalog”."""),

 dict(id="14", api="03", mod="products/admin", sev="Critical", pri="P0", req="SEC-02 · độ tin cậy",
  title="DoS — khách không đăng nhập làm sập toàn bộ backend bằng 2 request",
  tc="chuỗi BUG-13 + BUG-15 + BUG-04; tái hiện: `bash bug-report/verify-bugs.sh 14`",
  steps="""```bash
# KHÔNG cần token. Chọn một sản phẩm có id CHẴN (ví dụ 18).
curl -X PUT http://localhost:3000/api/products/18 \\
  -H 'Content-Type: application/json' -d '{"name":"anything"}'
# → 200 {"message":"Product updated"}   (price bị ghi NULL)

curl http://localhost:3000/api/products/18
# → không có phản hồi; tiến trình node đã chết

curl http://localhost:3000/api/products
# → connection refused — TOÀN BỘ hệ thống ngừng phục vụ
```""",
  exp="Request đầu phải 401 (SEC-02). Kể cả khi được phép, một giá trị `NULL` trong CSDL **không được** làm sập tiến trình.",
  act="""```
TypeError: Cannot read properties of null (reading 'toString')
    at Statement.<anonymous> (backend/server.js:162:49)
    at Statement.replacement (node_modules/sqlite3/lib/trace.js:25:27)
```

`server.js:161-162` chạy `row.price.toString()` khi `id` chẵn. Lỗi ném **trong callback của sqlite3**,
ngoài mọi `try/catch` và ngoài middleware lỗi của Express → Node kết thúc tiến trình. Hệ thống chỉ sống lại
khi có người khởi động lại thủ công, và **lặp lại được ngay** sau mỗi lần restart.

**Ba lỗi hợp thành:** (1) `PUT` không cần token — `server.js:179`; (2) field thiếu → ghi `NULL` đè —
`:180-188`; (3) `price.toString()` không kiểm null — `:161`.

Sửa mắt (3) là hết sập; nhưng phải sửa cả ba, vì (1) và (2) vẫn là lỗ hổng riêng."""),

 dict(id="15", api="03", mod="products/admin", sev="High", pri="P1", req="FR-15",
  title="Partial update ghi NULL đè dữ liệu cũ nhưng vẫn báo thành công",
  tc="TC-PRODUPD-104, 105",
  steps="""```bash
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \\
  -d '{"name":"HW06-Full","price":123456,"description":"desc","imageUrl":"u","category_id":1}'
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \\
  -d '{"name":"HW06-OnlyName"}'          # → 200 {"message":"Product updated"}
curl localhost:3000/api/products/7
# → {"id":7,"name":"HW06-OnlyName","price":null,"description":null,"imageUrl":null,"category_id":null}
```""",
  exp="400 (đòi đủ field) **hoặc** 200 nhưng giữ nguyên các field không gửi.",
  act="`server.js:180-188` luôn `SET name=?, price=?, description=?, imageUrl=?, category_id=?`; field `undefined` → sqlite3 ghi `NULL`. **Mất dữ liệu im lặng** — response nói “Product updated”. Đây là mắt thứ hai của BUG-14."),

 dict(id="16", api="03", mod="products/admin", sev="High", pri="P2", req="FR-15 · đề §6.1 (price > 0)",
  title="Không validate price, name, category_id khi cập nhật sản phẩm",
  tc="TC-PRODUPD-003, 004, 009, 010, 011, 012, 016, 017, 018",
  steps="""```bash
for b in '{"name":"n","price":-100,"description":"d","imageUrl":"u","category_id":1}' \\
         '{"name":"n","price":0,"description":"d","imageUrl":"u","category_id":1}' \\
         '{"name":"n","price":"abc","description":"d","imageUrl":"u","category_id":1}' \\
         '{"name":"","price":1,"description":"d","imageUrl":"u","category_id":1}' \\
         '{"name":"n","price":1,"description":"d","imageUrl":"u","category_id":999999}'; do
  curl -s -o /dev/null -w "%{http_code} " -X PUT localhost:3000/api/products/7 \\
    -H 'Content-Type: application/json' -d "$b"
done      # → 200 200 200 200 200
curl localhost:3000/api/products/7    # giá trị sai đã nằm trong CSDL
```""",
  exp="400: `price > 0` và là số; `name` không rỗng; `category_id` phải tồn tại trong bảng `categories`.",
  act="Không có validate nào ở tầng API, và khoá ngoại không được bật ở SQLite nên `category_id = 999999` cũng ghi được. Sản phẩm giá âm / giá dạng chuỗi / không tên đi thẳng ra danh sách bán."),

 dict(id="17", api="03", mod="products/admin", sev="Medium", pri="P2", req="spec §3.3",
  title="PUT vào :id không tồn tại vẫn trả 200 'Product updated'",
  tc="TC-PRODUPD-020, 021, 022, 023, 029, 106",
  steps="""```bash
curl -i -X PUT localhost:3000/api/products/999999 -H 'Content-Type: application/json' \\
  -d '{"name":"ghost","price":1,"description":"d","imageUrl":"u","category_id":1}'   # → 200
curl -i -X PUT localhost:3000/api/products/abc    ... # → 200
curl -i -X PUT localhost:3000/api/products/0      ... # → 200
```""",
  exp="404 — không có gì để cập nhật (spec §3.3 là *Cập nhật* một sản phẩm đang tồn tại, không phải upsert).",
  act="`server.js:185-187` không dùng `this.changes` nên không phân biệt “đã sửa 1 hàng” với “không sửa hàng nào”. API **báo thành công cho một thao tác không xảy ra** — client tưởng đã lưu. Đã kiểm: không tạo hàng mới (TC-PRODUPD-106), chỉ báo sai."),

 dict(id="18", api="03", mod="products/admin", sev="Low", pri="P3", req="FR-15",
  title="Mất chính xác số tiền lớn hơn 2^53 khi lưu",
  tc="TC-PRODUPD-013, 014",
  steps="""```bash
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \\
  -d '{"name":"HW06-BigPrice","price":9007199254740993,"description":"d","imageUrl":"u","category_id":1}'
curl localhost:3000/api/products/7      # → "price":9007199254740992   (lệch 1)
```""",
  exp="Hoặc từ chối giá vượt ngưỡng an toàn, hoặc lưu **đúng** giá trị đã gửi.",
  act="Giá đi qua `double` của JS nên bị làm tròn **im lặng**. Ảnh hưởng nhỏ ở dữ liệu thật, nhưng là dấu hiệu tiền tệ đang được lưu dưới dạng số thực thay vì số nguyên đơn vị nhỏ nhất."),

 dict(id="19", api="03", mod="users", sev="Critical", pri="P1", req="SEC-01",
  title="GET /api/users/me trả về mật khẩu dạng plaintext",
  tc="phát hiện khi dựng setup login cho API-02/API-03; tái hiện: `bash bug-report/verify-bugs.sh 19`",
  steps="""```bash
TOKEN=... # token user thường
curl localhost:3000/api/users/me -H "Authorization: Bearer $TOKEN"
# → {"id":2,"name":"Test User","email":"test@eshop.com","password":"Test1234!","role":"user",
#     "login_attempts":0,"locked_until":null,"reset_token":null,...}
```""",
  exp="Mật khẩu **không** được lưu plaintext (SEC-01) và tuyệt đối không được trả về cho client. `reset_token` cũng không.",
  act="""`server.js:112-116` dùng `SELECT * FROM users` rồi `res.json(user)`. Mật khẩu là plaintext trong CSDL
(`:20-30` insert thẳng, `:32-51` so sánh trực tiếp) → vi phạm SEC-01 ở **cả hai mặt**: lưu trữ và phơi bày.

**Ngoài phạm vi 3 API của bài** — báo vì đề yêu cầu *report any genuine bugs you find*."""),
 dict(id="20", api="01", mod="products/search", sev="Medium", pri="P2", req="FR-05",
  title="GET /api/products không có giới hạn số dòng — ?limit và ?page bị bỏ qua",
  tc="TC-PRODLIST-201, TC-PRODLIST-202 (case do sinh viên chọn, §6.3)",
  steps="""```bash
curl -s 'http://localhost:3000/api/products'          | python3 -c 'import json,sys;print(len(json.load(sys.stdin)),"dong")'
curl -s 'http://localhost:3000/api/products?limit=1'  | python3 -c 'import json,sys;print(len(json.load(sys.stdin)),"dong")'
curl -s 'http://localhost:3000/api/products?page=2'   | python3 -c 'import json,sys;print(len(json.load(sys.stdin)),"dong")'
# ca ba deu tra CUNG so dong = toan bo bang
```""",
  exp="Hoặc honor `limit`/`page`, hoặc trả **400** cho tham số không hỗ trợ — không được im lặng trả toàn bộ bảng.",
  act="""`server.js:141-157` chỉ đọc `req.query.search`; mọi tham số khác bị bỏ qua và truy vấn luôn là
`SELECT * FROM products`. DB thật của SUT ở bài HW05 có **~900.000 sản phẩm** — một request kéo hết bảng là
vấn đề thật về hiệu năng và bộ nhớ, không phải giả định.

FR-05 gọi đây là *product listing*; spec §3.1 **im lặng** về phân trang, nên issue báo ở mức: API cần một cơ
chế giới hạn, hoặc phải từ chối tham số nó không hỗ trợ."""),

 dict(id="21", api="02", mod="cart", sev="High", pri="P1", req="FR-08 · FR-07",
  title="Giỏ hàng giữ giá cũ sau khi admin đổi giá sản phẩm",
  tc="TC-CART-201 → 202 → 203 (case do sinh viên chọn, §6.3)",
  steps="""```bash
TOKEN=$(curl -s -X POST localhost:3000/api/login -H 'Content-Type: application/json' \\
  -d '{"email":"test@eshop.com","password":"Test1234!"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')

# 1. san pham gia 111000 -> them vao gio
curl -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \\
  -d '{"id":7,"name":"HW06-Cart-Fixture","price":111000,"quantity":1}'

# 2. admin doi gia san pham do len 222000
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \\
  -d '{"name":"HW06-Cart-Fixture","price":222000,"description":"doi gia","imageUrl":"","category_id":1}'

# 3. doc lai gio
curl -s localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"
# -> van "price":111000
```""",
  exp="Giỏ phải phản ánh giá hiện tại của catalog (222000), hoặc báo cho người dùng biết giá đã thay đổi.",
  act="""`server.js:290-295` lưu **bản chụp** `req.body` vào giỏ, không tham chiếu bảng `products`. Giá trong giỏ
đứng yên kể từ lúc thêm.

Hệ quả nghiệp vụ: FR-08 tính tiền đơn hàng từ giỏ, nên khách để hàng trong giỏ rồi quay lại sau khi shop tăng
giá sẽ **trả giá cũ**; ngược lại nếu shop giảm giá thì khách bị tính cao hơn giá đang niêm yết.

Bug này do **case sinh viên chọn** tìm ra: nó nằm trên trục *thời gian* (giá đổi **sau khi** hàng đã vào giỏ),
không nằm trên trục phân hoạch tham số — 136 case sinh từ đặc tả không có case nào loại này."""),

 dict(id="22", api="02", mod="cart", sev="Medium", pri="P2", req="SEC-04",
  title="Payload <script> được lưu nguyên văn vào giỏ hàng",
  tc="TC-CART-204 → 205 (case do sinh viên chọn, §6.3)",
  steps="""```bash
curl -X POST localhost:3000/api/cart -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \\
  -d '{"id":7,"name":"<script>alert(1)</script>","price":222000,"quantity":1}'
curl -s localhost:3000/api/cart -H "Authorization: Bearer $TOKEN"
# -> [... {"name":"<script>alert(1)</script>", ...} ...]
```""",
  exp="Từ chối, hoặc escape trước khi lưu — SEC-04 đòi dữ liệu người dùng phải được escape đúng cách.",
  act="""`push(req.body)` lưu nguyên object. Thẻ script nằm trong state phía server và được trả lại cho mọi client
đọc giỏ. Frontend nào render tên sản phẩm bằng `innerHTML` (SEC-04 cấm đích danh) là chạy script ngay.

Kết luận giới hạn trong phạm vi API: payload **được lưu và trả lại nguyên văn**; việc nó thực thi hay không
phụ thuộc tầng UI — ngoài phạm vi bài kiểm thử API."""),

 dict(id="23", api="02", mod="cart / users", sev="High", pri="P1", req="SEC-02",
  title="Token của người dùng đã bị xoá vẫn mở được giỏ hàng",
  tc="TC-CART-208 → 209 (case do sinh viên chọn, §6.3)",
  steps="""```bash
# 1. user2 dang nhap, lay token va id
U2=$(curl -s -X POST localhost:3000/api/login -H 'Content-Type: application/json' \\
  -d '{"email":"hw06.user2@eshop.com","password":"User2pass!"}')
TOKEN2=$(echo "$U2" | python3 -c 'import json,sys;print(json.load(sys.stdin)["token"])')
ID2=$(echo "$U2"   | python3 -c 'import json,sys;print(json.load(sys.stdin)["user"]["id"])')

# 2. admin xoa user2
curl -X DELETE "localhost:3000/api/admin/users/$ID2" -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. dung token CU cua user da bi xoa
curl -i localhost:3000/api/cart -H "Authorization: Bearer $TOKEN2"
# -> 200 OK, van mo duoc gio
```""",
  exp="**401/403** — SEC-02 đòi JWT **hợp lệ**; token trỏ tới người dùng không còn tồn tại thì không còn hợp lệ.",
  act="""`server.js:104-110`: `authenticateToken` chỉ `jwt.verify` chữ ký rồi gán `req.user`, **không** đối chiếu
bảng `users`. Token của người dùng đã bị xoá vẫn đi qua mọi endpoint bảo mật — mà token ở SUT này được
`jwt.sign` **không có `expiresIn`** (`server.js:51`), tức **không bao giờ hết hạn**.

Hệ quả: xoá tài khoản không thu hồi được quyền truy cập."""),

 dict(id="24", api="03", mod="products/admin", sev="Medium", pri="P2", req="SEC-04 · spec §3.3",
  title="imageUrl chứa javascript: URL được lưu nguyên văn",
  tc="TC-PRODUPD-201 → 202 (case do sinh viên chọn, §6.3)",
  steps="""```bash
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \\
  -d '{"name":"HW06-JsUrl","price":200000,"description":"d","imageUrl":"javascript:alert(1)","category_id":1}'
curl -s localhost:3000/api/products/7
# -> "imageUrl":"javascript:alert(1)"
```""",
  exp="Từ chối giá trị không phải URL http/https — spec §3.3 nêu `imageUrl` dạng `http://...`.",
  act="""Không validate `imageUrl`. Giá trị này đi thẳng vào thuộc tính `src`/`href` của frontend, nơi
`javascript:` **chạy được mà không cần thẻ `<script>`** — một đường XSS khác với BUG-22 và không bị chặn bởi
cùng một bản sửa.

Bộ test do AI sinh có case XSS cho `name` nhưng **không** có cho `imageUrl`: AI gắn XSS với *trường văn bản
hiển thị*, bỏ qua trường URL."""),

 dict(id="25", api="03", mod="products/admin", sev="Medium", pri="P2", req="FR-14 · spec §3.4",
  title="category_id trỏ tới danh mục đã bị xoá vẫn được chấp nhận",
  tc="TC-PRODUPD-203 → 206 (case do sinh viên chọn, §6.3)",
  steps="""```bash
# 1. tao danh muc tam roi xoa no
CID=$(curl -s -X POST localhost:3000/api/categories -H "Authorization: Bearer $ADMIN_TOKEN" \\
  -H 'Content-Type: application/json' -d '{"name":"HW06-Temp-Category"}' \\
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
curl -X DELETE "localhost:3000/api/categories/$CID" -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. gan san pham vao danh muc vua xoa
curl -X PUT localhost:3000/api/products/7 -H 'Content-Type: application/json' \\
  -d "{\"name\":\"HW06-Orphan\",\"price\":200000,\"description\":\"d\",\"imageUrl\":\"\",\"category_id\":$CID}"
# -> 200 {"message":"Product updated"}
curl -s localhost:3000/api/products/7
```""",
  exp="**400** — khoá ngoại phải trỏ tới danh mục đang tồn tại (FR-14).",
  act="""SQLite ở SUT này **không bật** `PRAGMA foreign_keys`, và tầng API cũng không kiểm. Sản phẩm thành *mồ côi
danh mục*: trang danh mục không liệt kê nó, nhưng nó vẫn xuất hiện ở danh sách sản phẩm với một `category_id`
vô nghĩa.

Bộ test AI đã kiểm `category_id = 999999` (id **chưa từng** tồn tại). Trường hợp khó hơn — id **từng tồn tại
rồi bị xoá** — cần nghĩ theo trục thời gian của dữ liệu."""),
]

TPL = """## Found by Test Case
{tc}

## Requirement liên quan
{req}

## Severity / Priority
**{sev} / {pri}**

## Environment
{env}

## Steps to reproduce
{steps}

## Expected result
{exp}

## Actual result
{act}

## Evidence
- Log tái hiện thật (19/19 bug): [`bug-report/verify-bugs-output.txt`]({repo}/bug-report/verify-bugs-output.txt) — chạy lại: `bash bug-report/verify-bugs.sh {n}`
- Báo cáo Newman của lượt nộp (ảnh chụp thật): ![Newman report]({raw}/bug-report/screenshots/{shot})
- Bug report đầy đủ: [`bug-report/bug-report.md`]({repo}/bug-report/bug-report.md) · Test case: [`test-cases/`]({repo}/test-cases)
- Repo bài kiểm thử: https://github.com/DuyITLOR/HW06-Api-Testing

<sub>Báo bởi Lê Nhựt Duy — 23127178 · HW06 API Testing · bộ 136 test case / 329 assertion, 89 assertion đỏ.</sub>
"""

out = pathlib.Path("bug-report/issues"); out.mkdir(exist_ok=True)
for b in B:
    body = TPL.format(tc=b["tc"], req=b["req"], sev=b["sev"], pri=b["pri"], env=ENV,
                      steps=b["steps"], exp=b["exp"], act=b["act"],
                      repo=REPO, raw=RAW, shot=SHOT[b["api"]], n=b["id"])
    title = f'[BUG][module: {b["mod"]}] {b["title"]}'
    (out / f'BUG-{b["id"]}.md').write_text(f"<!-- title: {title} -->\n<!-- sev: {b['sev']} pri: {b['pri']} -->\n\n{body}")
print(f"đã ghi {len(B)} file vào bug-report/issues/")
