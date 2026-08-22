#!/usr/bin/env bash
# ============================================================================
# verify-all.sh — tính lại các bất biến của bài từ file thật, rồi so với báo cáo.
#
#   bash tools/verify-all.sh        (hoặc: npm run verify)
#
# Vì sao cần: cột "nơi đáp ứng" trong TASKS.md chỉ là một lời khẳng định. Người chấm không phân
# biệt được "con số này đo được" với "con số này được viết ra" nếu chỉ đọc tài liệu. Script này
# kiểm những gì máy kiểm được; phần còn lại nằm ở danh sách kiểm tay cuối file.
#
# Ở trạng thái mới dựng khung, PHẦN LỚN mục sẽ FAIL — đó là đúng: nó là danh sách việc còn phải làm.
# ============================================================================
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

MSSV="23127178"
PASS=0; FAIL=0
p() { printf "  [PASS] %s\n" "$1"; PASS=$((PASS+1)); }
f() { printf "  [FAIL] %s\n" "$1"; FAIL=$((FAIL+1)); }
sect() { printf "\n── %s ─────────────────────────────────────────────────\n" "$1"; }

SLUGS=(api-01-products-search api-02-cart-add api-03-product-update)

sect "1. Collection Postman + header X-Student-Id (§6.4, §11)"
for s in "${SLUGS[@]}"; do
  col="postman/collections/${MSSV}_${s}.postman_collection.json"
  if [ ! -f "$col" ]; then f "$col — chưa có"; continue; fi
  if ! python3 -c "import json,sys; json.load(open('$col'))" 2>/dev/null; then f "$col — JSON không parse được"; continue; fi
  # Header phải đến từ pre-request script CẤP COLLECTION, không phải gắn tay từng request.
  if python3 - "$col" <<'PY'
import json, sys
col = json.load(open(sys.argv[1]))
ev = col.get("event", [])
src = "".join("".join(e.get("script", {}).get("exec", [])) for e in ev if e.get("listen") == "prerequest")
sys.exit(0 if "X-Student-Id" in src else 1)
PY
  then p "$s — pre-request cấp collection có gắn X-Student-Id"
  else f "$s — KHÔNG thấy X-Student-Id trong pre-request cấp collection (§6.4)"
  fi
done

sect "2. Số test case theo từng API (§6.1 đòi ≥35, §6.3 đòi ≥5 case tự thêm)"
for s in "${SLUGS[@]}"; do
  # Đếm **TC ID duy nhất**, không đếm dòng: `extended.md` có bảng "vì sao AI bỏ sót" cũng mở đầu bằng
  # TC ID, nên đếm dòng làm số case phồng gấp đôi (50 thay vì 43 ở lần chạy đầu).
  ids() { grep -oE '^\| *TC-[A-Z]+-[0-9]+' "$1" 2>/dev/null | tr -d ' |' | sort -u | wc -l | tr -d ' '; }
  n_gen=$(ids "test-cases/$s/generated.md"); n_aud=$(ids "test-cases/$s/audit.md"); n_ext=$(ids "test-cases/$s/extended.md")
  total=$(( n_aud > n_gen ? n_aud : n_gen ))
  total=$(( total + n_ext ))
  if [ "$total" -ge 35 ]; then p "$s — $total test case (gen $n_gen · audit $n_aud · thêm $n_ext)"
  else f "$s — chỉ $total test case, cần ≥35 (gen $n_gen · audit $n_aud · thêm $n_ext)"; fi
  if [ "$n_ext" -ge 5 ]; then p "$s — $n_ext case sinh viên tự thêm (≥5)"
  else f "$s — chỉ $n_ext case tự thêm, §6.3 đòi ≥5"; fi
done

sect "3. Audit đã dán nhãn hết chưa (§6.2)"
for s in "${SLUGS[@]}"; do
  file="test-cases/$s/audit.md"
  rows=$(awk '/^\| *TC-/{c++} END{print c+0}' "$file" 2>/dev/null || echo 0)
  # grep -c tự in 0 khi không khớp và exit 1 → '|| echo 0' sẽ in 0 HAI LẦN. Chỉ chặn exit code.
  labeled=$(grep -cE '^\| *TC-.*(VALID|INVALID|INCOMPLETE)' "$file" 2>/dev/null) || labeled=0
  if [ "$rows" -gt 0 ] && [ "$rows" -eq "$labeled" ]; then p "$s — $labeled/$rows dòng có nhãn"
  else f "$s — $labeled/$rows dòng có nhãn VALID/INVALID/INCOMPLETE"; fi
done

sect "4. Số liệu báo cáo khớp raw JSON của Newman (§11)"
if ls reports/newman/*.json >/dev/null 2>&1; then
  if [ -f test-cases/test-summary/summary.md ]; then
    # Sinh lại vào file tạm rồi so — summary.md phải là output của script, không phải văn bản viết tay.
    cp test-cases/test-summary/summary.md /tmp/hw06-summary-before.md
    if node tools/summarize-newman.mjs >/dev/null 2>&1; then
      if diff -q <(grep -v '^- Sinh lúc:' /tmp/hw06-summary-before.md) <(grep -v '^- Sinh lúc:' test-cases/test-summary/summary.md) >/dev/null; then
        p "summary.md khớp raw JSON (sinh lại cho kết quả y hệt)"
      else
        f "summary.md KHÁC bản sinh lại từ raw JSON — có ai sửa tay"
      fi
    else f "không sinh lại được summary.md"; fi
  else f "chưa có test-cases/test-summary/summary.md (chạy: npm run summary)"; fi
else f "chưa có reports/newman/*.json — chưa chạy Newman lần nào"; fi

sect "5. Cổng CI có baseline chưa"
if python3 - <<'PY'
import json, sys
d = json.load(open("ci/expected-failures.json"))
vals = [v.get("expected_failed") for v in d.get("collections", {}).values()]
sys.exit(0 if vals and all(v is not None for v in vals) else 1)
PY
then p "ci/expected-failures.json đã điền baseline cho cả 3 collection"
else f "ci/expected-failures.json còn baseline null — cổng CI sẽ báo thiếu baseline"; fi

sect "6. Tài liệu bắt buộc (§14)"
for doc in report/main-report.md report/main-report.pdf \
           ai-audit/ai-audit-report.md ai-audit/ai-audit-report.pdf \
           ai-audit/ai-critique.md ai-audit/ai-critique.pdf \
           bug-report/bug-report.md ci/ci-report.md README.md TASKS.md \
           git-log/commit-log.txt "excel/${MSSV}_HW06_TestCases.xlsx" \
           generator/design.md generator/pseudocode.py; do
  [ -e "$doc" ] && p "$doc" || f "$doc — chưa có"
done
if ls generator/diagram/*.png >/dev/null 2>&1; then p "sơ đồ generator (PNG tự vẽ)"; else f "generator/diagram/*.png — chưa có sơ đồ TỰ VẼ (§11)"; fi
if ls reports/newman/*.html >/dev/null 2>&1; then p "Newman HTML report"; else f "reports/newman/*.html — chưa có"; fi
if ls bug-report/screenshots/*.png >/dev/null 2>&1; then p "ảnh bằng chứng bug/console"; else f "bug-report/screenshots/*.png — chưa có ảnh"; fi

sect "7. Nội dung"
W=$(sed -n '/^## Critique/,$p' ai-audit/ai-critique.md 2>/dev/null | sed '1d' | wc -w | tr -d ' ')
if [ "${W:-0}" -ge 200 ] && [ "${W:-0}" -le 300 ]; then p "AI Critique $W từ (yêu cầu 200–300)"; else f "AI Critique $W từ — §10 đòi 200–300"; fi
if grep -qE "issues/[0-9]+" bug-report/bug-report.md 2>/dev/null; then p "bug report có số GitHub Issue"; else f "bug report chưa có số GitHub Issue (§6.5)"; fi
# §7 ghi "You are encouraged to..." — khuyến khích, KHÔNG bắt buộc. Để ở mức cảnh báo thay vì FAIL,
# nếu không script sẽ báo thiếu tài liệu bắt buộc cho một mục mà đề không đòi.
if grep -q "youtu" README.md 2>/dev/null; then p "README có link video demo (§7)"; else printf "  [TUY CHON] chưa có link video demo — §7 chỉ *khuyến khích*\n"; fi
if grep -qE "CHƯA (LÀM|VIẾT|CHỐT|CÓ|CHẠY)" report/main-report.md ai-audit/ai-critique.md 2>/dev/null; then
  f "còn dấu 'CHƯA …' trong báo cáo — nội dung chưa xong"
else p "không còn dấu 'CHƯA …' trong báo cáo"; fi

echo ""
echo "══════════════════════════════════════════════════════════════════════════"
echo "  $PASS PASS · $FAIL FAIL"
echo ""
echo "  Không tự động kiểm được (phải làm tay):"
echo "    · Ảnh Postman Console thật sự hiện header X-Student-Id (§11)"
echo "    · Hostname trong output Newman là localhost/127.0.0.1 (§11)"
echo "    · Sơ đồ generator do chính mình vẽ (§11)"
echo "    · Bộ 3 API không trùng thành viên nhóm (§5) — đối chiếu ảnh chat"
echo "    · Repo công khai + video demo xem được bằng link ẩn danh (§14)"
echo ""
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
