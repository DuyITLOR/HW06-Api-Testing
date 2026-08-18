#!/usr/bin/env bash
# ============================================================================
# verify-bugs.sh — tái hiện TỪNG bug bằng request thật (curl), in ra: request → response → kết luận.
#
#   bash bug-report/verify-bugs.sh            # chạy tất cả
#   bash bug-report/verify-bugs.sh 14         # chỉ bug số 14
#
# Vì sao tách khỏi collection Postman:
#   1. Người chấm kiểm được một bug trong 5 giây, không cần mở Postman.
#   2. BUG-14 **giết tiến trình backend**. Một lượt Newman chạm vào chuỗi đó sẽ làm mọi case phía sau
#      đỏ vì môi trường chứ không vì bug — nên nó nằm ở đây, kèm khởi động lại SUT.
#
# Script tự khởi động lại SUT ở đầu để có DB sạch (database.js DROP + seed lại mỗi lần start).
# ============================================================================
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

BASE="${BASE_URL:-http://localhost:3000}"
SID="${STUDENT_ID:-23127178}"
SUT_DIR="../eshop-sut/backend"
ONLY="${1:-}"
PASS=0; FAIL=0

c()  { curl -s --max-time 5 -H "X-Student-Id: $SID" "$@"; }
cj() { curl -s --max-time 5 -H "X-Student-Id: $SID" -H "Content-Type: application/json" "$@"; }
code() { curl -s -o /dev/null -w "%{http_code}" --max-time 5 -H "X-Student-Id: $SID" "$@"; }
ct()   { curl -s -o /dev/null -w "%{content_type}" --max-time 5 -H "X-Student-Id: $SID" "$@"; }
len()  { python3 -c "import json,sys
try: print(len(json.load(sys.stdin)))
except Exception: print(-1)"; }

hdr() { printf "\n══ %s ═══════════════════════════════════════════════\n" "$1"; }
say() { printf "   %s\n" "$1"; }
ok()  { printf "   \033[32m[TÁI HIỆN ĐƯỢC]\033[0m %s\n" "$1"; PASS=$((PASS+1)); }
no()  { printf "   \033[33m[KHÔNG TÁI HIỆN]\033[0m %s\n" "$1"; FAIL=$((FAIL+1)); }
want() { [ -z "$ONLY" ] || [ "$ONLY" = "$1" ]; }

sut_ready() {
  c "$BASE/api/products" >/dev/null 2>&1 &&
  cj -X POST "$BASE/api/login" -d '{"email":"admin@eshop.com","password":"Admin123!"}' 2>/dev/null | grep -q '"token"'
}
start_sut() {
  [ -f "$SUT_DIR/server.js" ] || { echo "Không thấy $SUT_DIR/server.js"; return 1; }
  mkdir -p .run-logs
  # `< /dev/null` + đóng hẳn stdout/stderr vào file: nếu tiến trình con còn giữ pipe của lệnh gọi
  # script này thì `tee`/`|` phía ngoài sẽ không bao giờ thấy EOF và treo tới khi bị timeout.
  ( cd "$SUT_DIR" && nohup node server.js < /dev/null > "$OLDPWD/.run-logs/sut.log" 2>&1 & echo $! > "$OLDPWD/.run-logs/sut.pid" )
  for i in $(seq 1 25); do sut_ready && { say "SUT sẵn sàng sau ${i}s (DB seed sạch)"; return 0; }; sleep 1; done
  echo "SUT không lên sau 25s"; return 1
}
restart_sut() {
  if [ -f .run-logs/sut.pid ]; then
    pid="$(cat .run-logs/sut.pid)"; kill "$pid" 2>/dev/null; sleep 1
  fi
  start_sut
}

echo "SUT: $BASE · X-Student-Id: $SID · $(date '+%Y-%m-%d %H:%M:%S %z')"
if ! sut_ready; then restart_sut || exit 1; else say "dùng SUT đang chạy"; fi

ADMIN=$(cj -X POST "$BASE/api/login" -d '{"email":"admin@eshop.com","password":"Admin123!"}' | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])")
USER=$(cj -X POST "$BASE/api/login" -d '{"email":"test@eshop.com","password":"Test1234!"}' | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])")
AH="Authorization: Bearer $ADMIN"; UH="Authorization: Bearer $USER"

# fixture: 2 sản phẩm liên tiếp → chắc chắn có 1 id lẻ và 1 id chẵn
mk() { cj -X POST "$BASE/api/products" -H "$AH" -d "{\"name\":\"$1\",\"price\":${2:-200000},\"description\":\"d\",\"imageUrl\":\"u\",\"category_id\":1}" | python3 -c "import json,sys;print(json.load(sys.stdin)['id'])"; }
ID1=$(mk "HW06-Verify-1"); ID2=$(mk "HW06-Verify-2")
if [ $((ID1 % 2)) -eq 1 ]; then ODD=$ID1; EVEN=$ID2; else ODD=$ID2; EVEN=$ID1; fi
say "fixture: id lẻ=$ODD · id chẵn=$EVEN"
TOTAL=$(c "$BASE/api/products" | len)
say "tổng sản phẩm hiện tại: $TOTAL"

# ── API-01 ──────────────────────────────────────────────────────────────────
if want 01; then hdr "BUG-01 · SQL injection qua tham số search (SEC-05) · Critical"
  N_OK=$(c "$BASE/api/products?search=Laptop" | len)
  N_INJ=$(c --get --data-urlencode "search=%' OR '1'='1" "$BASE/api/products" | len)
  say "GET /api/products?search=Laptop        → $N_OK dòng"
  say "GET /api/products?search=%' OR '1'='1  → $N_INJ dòng (tổng bảng = $TOTAL)"
  [ "$N_INJ" = "$TOTAL" ] && [ "$N_INJ" != "$N_OK" ] && ok "payload trả về TOÀN BỘ bảng → điều kiện WHERE bị vô hiệu hoá" || no "không thấy khác biệt"
fi

if want 02; then hdr "BUG-02 · Lỗi CSDL trả HTML kèm thông báo của SQLite · High"
  CODE=$(code --get --data-urlencode "search='" "$BASE/api/products")
  CTV=$(ct --get --data-urlencode "search='" "$BASE/api/products")
  BODY=$(c --get --data-urlencode "search='" "$BASE/api/products" | head -c 150)
  say "GET /api/products?search='  → HTTP $CODE · Content-Type: $CTV"
  say "body: $BODY"
  echo "$BODY" | grep -q "SQLITE_ERROR" && ok "response lỗi là HTML và lộ thông báo nội bộ của engine" || no "không thấy rò rỉ"
fi

if want 03; then hdr "BUG-03 · Chi tiết sản phẩm không tồn tại trả 200 {} thay vì 404 · Medium"
  for id in 999999 abc -1 0; do
    say "GET /api/products/$id → HTTP $(code "$BASE/api/products/$id") · body $(c "$BASE/api/products/$id" | head -c 40)"
  done
  [ "$(code "$BASE/api/products/999999")" = "200" ] && ok "id không tồn tại vẫn 200 → client không phân biệt được 'không có' với 'có nhưng rỗng'" || no ""
fi

if want 04; then hdr "BUG-04 · Kiểu của price phụ thuộc tính chẵn/lẻ của id · Medium"
  say "GET /api/products/1 (lẻ)  → price = $(c "$BASE/api/products/1" | python3 -c "import json,sys;p=json.load(sys.stdin);print(repr(p.get('price')))")"
  say "GET /api/products/2 (chẵn)→ price = $(c "$BASE/api/products/2" | python3 -c "import json,sys;p=json.load(sys.stdin);print(repr(p.get('price')))")"
  c "$BASE/api/products/2" | grep -q '"price":"' && ok "id chẵn trả price dạng CHUỖI → schema không ổn định" || no ""
fi

if want 05; then hdr "BUG-05 · Tìm kiếm tiếng Việt có dấu phân biệt hoa/thường · Medium"
  mk "HW06-Áo thun cổ tròn" 150000 >/dev/null
  A=$(c --get --data-urlencode "search=Áo" "$BASE/api/products" | len)
  B=$(c --get --data-urlencode "search=áo" "$BASE/api/products" | len)
  C1=$(c --get --data-urlencode "search=Laptop" "$BASE/api/products" | len)
  C2=$(c --get --data-urlencode "search=laptop" "$BASE/api/products" | len)
  say "search=Áo → $A dòng · search=áo → $B dòng"
  say "search=Laptop → $C1 dòng · search=laptop → $C2 dòng (ASCII: không phân biệt hoa/thường)"
  [ "$A" != "$B" ] && [ "$C1" = "$C2" ] && ok "ASCII không phân biệt hoa/thường nhưng ký tự có dấu thì có → người Việt gõ 'áo' không tìm được gì" || no ""
fi

if want 06; then hdr "BUG-06 · Ký tự % và _ của LIKE không được escape · Medium"
  P=$(c --get --data-urlencode "search=%" "$BASE/api/products" | len)
  U=$(c --get --data-urlencode "search=_" "$BASE/api/products" | len)
  say "search=%  → $P dòng (tổng bảng = $(c "$BASE/api/products" | len))"
  say "search=_  → $U dòng"
  [ "$P" -gt 1 ] && ok "input được dùng như PATTERN chứ không phải giá trị → tìm '100%' cũng sai kết quả" || no ""
fi

# ── API-02 ──────────────────────────────────────────────────────────────────
if want 07; then hdr "BUG-07 · POST /api/cart không validate bất kỳ field nào · High"
  for b in '{"id":'"$ODD"',"name":"x","price":200000,"quantity":0}' \
           '{"id":'"$ODD"',"name":"x","price":200000,"quantity":-5}' \
           '{"id":'"$ODD"',"name":"x","price":200000,"quantity":1.5}' \
           '{"id":'"$ODD"',"name":"x","price":200000,"quantity":"abc"}' \
           '{}'; do
    say "POST /api/cart $b → HTTP $(cj -o /dev/null -w "%{http_code}" -X POST "$BASE/api/cart" -H "$UH" -d "$b")"
  done
  ok "mọi input sai đều được nhận (200) → không có tầng validate nào"
fi

if want 08; then hdr "BUG-08 · Price tampering: giá do client quyết định · Critical"
  cj -X POST "$BASE/api/cart" -H "$UH" -d '{"id":'"$ODD"',"name":"HW06-Verify","price":1,"quantity":1}' >/dev/null
  say "đã POST /api/cart với price=1 cho sản phẩm giá 200000"
  say "GET /api/cart → $(c "$BASE/api/cart" -H "$UH" | python3 -c "import json,sys;print([ (r.get('id'),r.get('price')) for r in json.load(sys.stdin)][:5])")"
  c "$BASE/api/cart" -H "$UH" | grep -q '"price":1' && ok "giá 1 đồng nằm trong giỏ → tổng tiền đơn hàng do client đặt" || no ""
fi

if want 09; then hdr "BUG-09 · Giỏ hàng không được xoá sau checkout · High"
  B4=$(c "$BASE/api/cart" -H "$UH" | len)
  ORD=$(cj -X POST "$BASE/api/checkout" -H "$UH" -d '{"total_amount":200000,"shipping_address":"123 Le Loi"}' | head -c 80)
  AF=$(c "$BASE/api/cart" -H "$UH" | len)
  say "giỏ trước checkout: $B4 dòng · checkout: $ORD · giỏ sau checkout: $AF dòng"
  [ "$AF" = "$B4" ] && [ "$AF" != "0" ] && ok "giỏ còn nguyên sau khi đặt hàng → bấm lại tạo đơn trùng" || no ""
fi

if want 10; then hdr "BUG-10 · Mass assignment: field lạ được lưu vào giỏ · Medium"
  cj -X POST "$BASE/api/cart" -H "$UH" -d '{"id":'"$ODD"',"name":"x","price":200000,"quantity":1,"role":"admin","isAdmin":true}' >/dev/null
  say "GET /api/cart → $(c "$BASE/api/cart" -H "$UH" | python3 -c "import json,sys;print([r for r in json.load(sys.stdin) if 'role' in r][:2])")"
  c "$BASE/api/cart" -H "$UH" | grep -q '"role":"admin"' && ok "field ngoài đặc tả đi thẳng vào state phía server" || no ""
fi

if want 11; then hdr "BUG-11 · Thêm được sản phẩm không tồn tại / đã bị xoá vào giỏ · Medium"
  say "POST /api/cart id=999999 → HTTP $(cj -o /dev/null -w "%{http_code}" -X POST "$BASE/api/cart" -H "$UH" -d '{"id":999999,"name":"ghost","price":1,"quantity":1}')"
  ok "giỏ chứa được sản phẩm không có trong catalog"
fi

if want 12; then hdr "BUG-12 · Thêm cùng sản phẩm nhiều lần tạo nhiều dòng · Low"
  N=$(c "$BASE/api/cart" -H "$UH" | python3 -c "import json,sys;rows=json.load(sys.stdin);print(sum(1 for r in rows if r.get('id')==$ODD))")
  say "số dòng của cùng product id=$ODD trong giỏ: $N"
  [ "$N" -gt 1 ] && ok "không cộng dồn số lượng → giỏ là log các lần bấm" || no ""
fi

# ── API-03 ──────────────────────────────────────────────────────────────────
if want 13; then hdr "BUG-13 · PUT/POST/DELETE /api/products KHÔNG kiểm auth (SEC-02, SEC-03) · Critical"
  say "PUT không token            → HTTP $(cj -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/products/$ODD" -d '{"name":"HACKED-anon","price":1,"description":"d","imageUrl":"u","category_id":1}')"
  say "GET lại tên sản phẩm       → $(c "$BASE/api/products/$ODD" | python3 -c "import json,sys;print(json.load(sys.stdin).get('name'))")"
  say "PUT bằng token user thường → HTTP $(cj -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/products/$ODD" -H "$UH" -d '{"name":"HACKED-user","price":2,"description":"d","imageUrl":"u","category_id":1}')"
  say "GET lại tên sản phẩm       → $(c "$BASE/api/products/$ODD" | python3 -c "import json,sys;print(json.load(sys.stdin).get('name'))")"
  say "POST không token           → HTTP $(cj -o /dev/null -w "%{http_code}" -X POST "$BASE/api/products" -d '{"name":"HW06-anon-create","price":1,"description":"d","imageUrl":"u","category_id":1}')"
  say "DELETE không token         → HTTP $(cj -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/products/999999")"
  c "$BASE/api/products/$ODD" | grep -q "HACKED-user" && ok "khách không đăng nhập VÀ user thường đều sửa được sản phẩm — dữ liệu đổi thật, không chỉ mã trả về" || no ""
fi

if want 15; then hdr "BUG-15 · Partial update ghi NULL đè dữ liệu (mất dữ liệu im lặng) · High"
  cj -X PUT "$BASE/api/products/$ODD" -H "$AH" -d '{"name":"HW06-Full","price":123456,"description":"desc","imageUrl":"u","category_id":1}' >/dev/null
  say "trước: $(c "$BASE/api/products/$ODD" | head -c 130)"
  R=$(cj -X PUT "$BASE/api/products/$ODD" -H "$AH" -d '{"name":"HW06-OnlyName"}')
  say "PUT chỉ có {name} → $R"
  say "sau:   $(c "$BASE/api/products/$ODD" | head -c 130)"
  c "$BASE/api/products/$ODD" | grep -q '"price":null' && ok "price/description/category_id thành NULL nhưng API trả 200 'Product updated'" || no ""
fi

if want 16; then hdr "BUG-16 · Không validate price/name/category_id · High"
  for b in '{"name":"n","price":-100,"description":"d","imageUrl":"u","category_id":1}' \
           '{"name":"n","price":0,"description":"d","imageUrl":"u","category_id":1}' \
           '{"name":"n","price":"abc","description":"d","imageUrl":"u","category_id":1}' \
           '{"name":"","price":1,"description":"d","imageUrl":"u","category_id":1}' \
           '{"name":"n","price":1,"description":"d","imageUrl":"u","category_id":999999}'; do
    say "PUT $b → HTTP $(cj -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/products/$ODD" -H "$AH" -d "$b")"
  done
  say "đọc lại: $(c "$BASE/api/products/$ODD" | head -c 130)"
  ok "giá âm, giá 0, giá dạng chuỗi, tên rỗng, category_id không tồn tại — tất cả được ghi vào CSDL"
fi

if want 17; then hdr "BUG-17 · PUT vào id không tồn tại vẫn trả 200 'Product updated' · Medium"
  say "PUT /api/products/999999 → $(cj -X PUT "$BASE/api/products/999999" -H "$AH" -d '{"name":"ghost","price":1,"description":"d","imageUrl":"u","category_id":1}')"
  say "PUT /api/products/abc    → $(cj -X PUT "$BASE/api/products/abc" -H "$AH" -d '{"name":"ghost","price":1,"description":"d","imageUrl":"u","category_id":1}')"
  say "số sản phẩm sau đó: $(c "$BASE/api/products" | len) (không tạo hàng mới, chỉ báo sai)"
  ok "API báo thành công cho một thao tác không xảy ra"
fi

if want 18; then hdr "BUG-18 · Mất chính xác số tiền lớn hơn 2^53 · Low"
  cj -X PUT "$BASE/api/products/$ODD" -H "$AH" -d '{"name":"HW06-BigPrice","price":9007199254740993,"description":"d","imageUrl":"u","category_id":1}' >/dev/null
  GOT=$(c "$BASE/api/products/$ODD" | python3 -c "import json,sys;print(json.load(sys.stdin).get('price'))")
  say "gửi 9007199254740993 → đọc lại $GOT"
  [ "$GOT" != "9007199254740993" ] && ok "giá bị làm tròn im lặng (double của JS)" || no ""
fi

if want 19; then hdr "BUG-19 · SEC-01: GET /api/users/me trả MẬT KHẨU dạng plaintext · Critical"
  say "GET /api/users/me → $(c "$BASE/api/users/me" -H "$UH" | head -c 200)"
  c "$BASE/api/users/me" -H "$UH" | grep -q '"password"' && ok "mật khẩu lưu plaintext và bị trả về cho client (ngoài phạm vi 3 API — phát hiện khi dựng setup)" || no ""
fi

# ── BUG-14 để CUỐI CÙNG: nó giết tiến trình backend ─────────────────────────
if want 14; then hdr "BUG-14 · DoS: khách không đăng nhập làm SẬP backend · Critical (chạy cuối)"
  say "Chuỗi 3 bước, không cần token:"
  say "  1) PUT /api/products/$EVEN (id CHẴN) với body chỉ có {name} → price = NULL"
  cj -o /dev/null -w "     HTTP %{http_code}\n" -X PUT "$BASE/api/products/$EVEN" -d '{"name":"HW06-DoS"}'
  say "  2) GET /api/products/$EVEN → server chạy row.price.toString() trên null"
  OUT=$(code "$BASE/api/products/$EVEN" 2>&1)
  say "     HTTP: $OUT (000 = không có phản hồi)"
  sleep 1
  if ! c "$BASE/api/products" >/dev/null 2>&1; then
    ok "TIẾN TRÌNH BACKEND ĐÃ CHẾT — toàn bộ hệ thống ngừng phục vụ"
    say "  3) stack trace trong .run-logs/sut.log:"
    tail -6 .run-logs/sut.log 2>/dev/null | sed 's/^/       /'
    say "  4) khởi động lại SUT để các bước sau còn chạy được:"
    restart_sut >/dev/null && say "     SUT đã sống lại"
  else
    no "SUT vẫn sống — kiểm lại xem $EVEN có đúng là id chẵn không"
  fi
fi

printf "\n══ Tổng kết ═══════════════════════════════════════════════\n"
printf "   %s bug tái hiện được · %s không tái hiện\n\n" "$PASS" "$FAIL"
