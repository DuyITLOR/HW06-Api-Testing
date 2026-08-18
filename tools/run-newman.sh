#!/usr/bin/env bash
# ============================================================================
# run-newman.sh — chạy 1 collection (hoặc cả 3) bằng Newman, xuất HTML + JSON.
#
#   bash tools/run-newman.sh api-01-products-search
#   bash tools/run-newman.sh --all
#   bash tools/run-newman.sh api-02-cart-add --data postman/data/cart-quantity.csv
#   bash tools/run-newman.sh --all --no-restart      # dùng SUT đang chạy, không restart
#
# MẶC ĐỊNH KHỞI ĐỘNG LẠI SUT trước mỗi collection. Lý do: `backend/database.js:15-20` DROP rồi seed
# lại toàn bộ bảng mỗi lần start, nên restart là cách duy nhất có **trạng thái đầu vào xác định**.
# Chạy lại trên DB đã bị 136 test case sửa thì số liệu của hai lượt không so được với nhau.
# Chỉ kill tiến trình do CHÍNH script này khởi động (ghi PID vào .run-logs/sut.pid) — không pkill
# theo tên, vì máy có thể đang chạy node server khác của bài khác.
#
# Quy ước tên file report (để §11 đối chiếu được lượt chạy với thời điểm):
#   reports/newman/{MSSV}_{api-slug}_{YYYYMMDD-HHMMSS}.{html,json}
#
# JSON là nguồn DUY NHẤT để sinh test summary (`npm run summary`) — không gõ số liệu bằng tay.
# ============================================================================
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

MSSV="23127178"
ENVFILE="postman/environments/HW06-local.postman_environment.json"
OUTDIR="reports/newman"
APIS=(api-01-products-search api-02-cart-add api-03-product-update)

TARGET="${1:-}"
shift || true
RESTART=1
EXTRA=()
for a in "$@"; do
  case "$a" in
    --no-restart) RESTART=0 ;;
    *) EXTRA+=("$a") ;;
  esac
done

SUT_DIR="../eshop-sut/backend"
PIDFILE=".run-logs/sut.pid"

# "Sống" phải nghĩa là **đã seed xong**, không chỉ là đã mở cổng. database.js DROP rồi CREATE rồi
# INSERT bất đồng bộ; server lắng nghe TRƯỚC khi seed xong. Ở lượt chạy đầu, seed user2 chạy vào
# giữa khoảng đó nên user2 bị xoá cùng bảng `users` → SETUP-03 của API-02 đỏ 401 vì môi trường,
# không vì bug. Vì vậy điều kiện sẵn sàng = login admin được (bảng `users` đã có dữ liệu seed).
sut_up() {
  local base="${BASE_URL:-http://localhost:3000}"
  curl -fsS --max-time 2 "$base/api/products" >/dev/null 2>&1 || return 1
  curl -fsS --max-time 2 -X POST "$base/api/login" -H 'Content-Type: application/json' \
    -d '{"email":"admin@eshop.com","password":"Admin123!"}' 2>/dev/null | grep -q '"token"'
}

restart_sut() {
  [ "$RESTART" = "0" ] && return 0
  if [ ! -f "$SUT_DIR/server.js" ]; then
    echo "   [LUU Y] không thấy $SUT_DIR/server.js — dùng SUT đang chạy, không restart"
    return 0
  fi
  mkdir -p .run-logs
  if [ -f "$PIDFILE" ]; then
    oldpid="$(cat "$PIDFILE" 2>/dev/null || true)"
    if [ -n "${oldpid:-}" ] && kill -0 "$oldpid" 2>/dev/null; then
      kill "$oldpid" 2>/dev/null; sleep 1
    fi
  elif sut_up; then
    echo "   [LUU Y] SUT đang chạy nhưng KHÔNG do script này khởi động → không kill."
    echo "           Dữ liệu của lượt trước có thể còn lại; 00-setup sẽ tự dọn fixture HW06-*."
    return 0
  fi
  ( cd "$SUT_DIR" && nohup node server.js < /dev/null > "$OLDPWD/.run-logs/sut.log" 2>&1 & echo $! > "$OLDPWD/$PIDFILE" )
  for i in $(seq 1 25); do sut_up && { echo "   SUT khởi động lại sạch sau ${i}s (DB được seed lại)"; return 0; }; sleep 1; done
  echo "   [LOI] SUT không lên sau 25s — xem .run-logs/sut.log"; return 1
}

if [ -z "$TARGET" ]; then
  echo "Dùng: bash tools/run-newman.sh <api-slug|--all> [tham số newman thêm]"
  echo "      api-slug: ${APIS[*]}"
  exit 2
fi

if [ ! -f "$ENVFILE" ]; then
  echo "  [LOI] Không thấy $ENVFILE"
  exit 1
fi

restart_sut || exit 1

# user thứ hai (kiểm cách ly giỏ hàng ở API-02) bị xoá mỗi lần SUT seed lại DB → tạo lại,
# và seed tự kiểm chứng bản ghi có sống sót (xem chú thích trong seed-api-data.mjs).
node tools/seed-api-data.mjs > .run-logs/seed.log 2>&1 || { echo "  [LOI] seed thất bại — xem .run-logs/seed.log"; exit 1; }

# Môi trường chưa sẵn sàng thì mọi con số đọc được đều vô nghĩa — chặn ngay.
if ! node tools/preflight.mjs >/dev/null 2>&1; then
  echo "  [LOI] Preflight fail. Chạy 'npm run preflight' để xem chi tiết."
  exit 1
fi

mkdir -p "$OUTDIR"
run_one() {
  local slug="$1"
  local col="postman/collections/${MSSV}_${slug}.postman_collection.json"
  if [ ! -f "$col" ]; then
    echo "  [BO QUA] chưa có $col"
    return 0
  fi
  restart_sut || return 1
  # Seed phải THÀNH CÔNG, không chỉ "đã chạy": nếu user2 không sống sót thì API-02 đỏ vì môi trường.
  if ! node tools/seed-api-data.mjs > .run-logs/seed.log 2>&1; then
    echo "   [LOI] seed thất bại — xem .run-logs/seed.log"; return 1
  fi
  local stamp; stamp="$(date +%Y%m%d-%H%M%S)"
  local base="${OUTDIR}/${MSSV}_${slug}_${stamp}"
  echo ""
  echo "══ $slug ═══════════════════════════════════════════════════════════════"
  echo "   $(date -u '+%Y-%m-%dT%H:%M:%SZ') UTC · $col"

  local reporters="cli,json"
  local htmlargs=()
  if newman run --help 2>/dev/null | grep -q htmlextra || npm ls -g newman-reporter-htmlextra >/dev/null 2>&1; then
    reporters="cli,json,htmlextra"
    htmlargs=(--reporter-htmlextra-export "${base}.html"
              --reporter-htmlextra-title "HW06 API Testing — ${slug} — ${MSSV}"
              --reporter-htmlextra-showEnvironmentData)
  else
    echo "   [LUU Y] chưa có newman-reporter-htmlextra → chỉ xuất JSON. Cài: npm i -g newman-reporter-htmlextra"
  fi

  newman run "$col" \
    -e "$ENVFILE" \
    --reporters "$reporters" \
    --reporter-json-export "${base}.json" \
    "${htmlargs[@]+"${htmlargs[@]}"}" \
    --timeout-request 10000 \
    "${EXTRA[@]+"${EXTRA[@]}"}"
  local rc=$?
  echo "   → ${base}.json"
  # rc != 0 là BÌNH THƯỜNG ở bài này: test case bắt được bug thật thì assertion phải đỏ.
  # Không dùng rc để kết luận "chạy thất bại"; số liệu đọc từ JSON.
  return 0
}

if [ "$TARGET" = "--all" ]; then
  for a in "${APIS[@]}"; do run_one "$a"; done
else
  run_one "$TARGET"
fi

echo ""
echo "  Sinh test summary:  npm run summary"
