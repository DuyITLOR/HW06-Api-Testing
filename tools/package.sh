#!/usr/bin/env bash
# ============================================================================
# package.sh — đóng gói bản nộp theo ĐÚNG danh sách §14, rồi zip.
#
#   bash tools/package.sh 95           # → 23127178_HW06_AI_API_095.zip
#   bash tools/package.sh 95 --check   # chỉ soát thiếu gì, không tạo gói
#
# §17: thiếu bất kỳ tài liệu bắt buộc nào = **0 điểm**. Kéo thả tay thì sai một lần là mất cả bài
# và không kiểm lại được — nên danh sách §14 được viết thành code ở đây.
#
# docs/: §14 không gọi tên `docs/`, nhưng §5 (bằng chứng không trùng nhóm) được viết đầy đủ nhất ở
# `docs/api-selection.md` và báo cáo trỏ link sang nó. Cách xử lý: nộp kèm ĐÚNG file đó dưới dạng
# supporting material (§14 cho phép); PLAYBOOK và kịch bản video là tài liệu quy trình nội bộ —
# KHÔNG nộp.
# ============================================================================
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

GRADE="${1:-}"
CHECK=0
NOZIP=0
for a in "$@"; do
  [ "$a" = "--check" ] && CHECK=1
  [ "$a" = "--no-zip" ] && NOZIP=1   # chỉ dựng FOLDER, để sinh viên tự zip
done
if [ -z "$GRADE" ]; then echo "Dùng: bash tools/package.sh <điểm 0-100> [--check]"; exit 2; fi
if ! [[ "$GRADE" =~ ^[0-9]{1,3}$ ]]; then echo "Điểm phải là số nguyên trong [000, 100]."; exit 2; fi
GRADE_NUM=$((10#$GRADE))
if [ "$GRADE_NUM" -lt 0 ] || [ "$GRADE_NUM" -gt 100 ]; then echo "Điểm phải nằm trong [000, 100]."; exit 2; fi
printf -v GRADE3 '%03d' "$GRADE_NUM"   # §14: SelfAssessedGrade là số 3 chữ số
MSSV="23127178"
NAME="${MSSV}_HW06_AI_API_${GRADE3}"

# Điểm trong tên file phải khớp bảng tự chấm trong README, nếu không bộ nộp tự mâu thuẫn.
README_SCORE="$(grep -oE '\*\*Tổng\*\* \| \*\*100\*\* \| \*\*[0-9]+\*\*' README.md 2>/dev/null | grep -oE '[0-9]+\*\*$' | tr -d '*')"
if [ -n "${README_SCORE:-}" ] && [ "$README_SCORE" != "$GRADE_NUM" ]; then
  echo "  [LUU Y] tên zip dùng điểm $GRADE_NUM nhưng README tự chấm $README_SCORE — sửa một trong hai."
fi

MISSING=0
need() { if [ -e "$1" ]; then printf "  [OK]    %-52s %s\n" "$1" "$2"; else printf "  [THIEU] %-52s %s\n" "$1" "$2"; MISSING=$((MISSING+1)); fi; }
needglob() { local n; n=$(ls -1 $1 2>/dev/null | wc -l | tr -d ' ');
  if [ "$n" -ge "$2" ]; then printf "  [OK]    %-52s %s (%s file)\n" "$1" "$3" "$n";
  else printf "  [THIEU] %-52s %s — có %s, cần ≥%s\n" "$1" "$3" "$n" "$2"; MISSING=$((MISSING+1)); fi; }

echo ""
echo "══ Soát danh sách §14 ═══════════════════════════════════════════════════"
need "report/main-report.md"                    "Main report (Markdown)"
need "report/main-report.pdf"                   "Main report (PDF)"
need "ai-audit/ai-audit-report.md"              "AI Audit Report (MD)"
need "ai-audit/ai-audit-report.pdf"             "AI Audit Report (PDF)"
need "ai-audit/ai-critique.md"                  "AI Critique (MD) — phải 200–300 từ"
need "ai-audit/ai-critique.pdf"                 "AI Critique (PDF)"
need "bug-report/bug-report.md"                 "Bug report (+ ảnh GitHub Issues)"
need "ci/ci-report.md"                          "CI/CD report + 2 lượt mẫu"
need "README.md"                                "README: self-assessment + test summary"
need "TASKS.md"                                 "Bản đồ yêu cầu → file (supporting)"
need "git-log/commit-log.txt"                   "Git commit log (§12)"
need "postman/README.md"                        "Danh sách Postman feature đã dùng (§6)"
need "generator/design.md"                      "Thiết kế AI test generator (§7)"
need "generator/pseudocode.py"                  "Pseudocode generator (§7)"
need "excel/${MSSV}_HW06_TestCases.xlsx"        "Excel test case + test summary (npm run excel)"
needglob "postman/collections/${MSSV}_*.json" 4 "Postman collection (3 API + regression)"
needglob "postman/environments/*.json" 1        "Postman environment"
needglob "reports/newman/*.html" 4              "Newman HTML report (3 bug-hunting + regression)"
needglob "reports/newman/*.json" 3              "Newman raw JSON (nguồn của test summary)"
needglob "generator/diagram/generator-flow-selfdrawn.png" 1 "Sơ đồ generator TỰ VẼ (§11) — bản AI KHÔNG được nộp"
needglob "bug-report/screenshots/*.png" 6       "Ảnh: X-Student-Id · assertion đỏ · 2 lượt CI · issue · report"
need "bug-report/screenshots/x-student-id-request-header.png" "Bằng chứng §11: header trên request thật"
need "bug-report/screenshots/ci-xanh.png"    "Lượt CI tất cả pass (§6)"
need "bug-report/screenshots/ci-do.png"      "Lượt CI có test fail (§6)"
need ".github/workflows/api-tests.yml"          "Pipeline CI/CD"
needglob "test-cases/*/generated.md" 3          "Test case AI sinh (§6.1)"
needglob "test-cases/*/audit.md" 3              "Audit VALID/INVALID/INCOMPLETE (§6.2)"
needglob "test-cases/*/extended.md" 3           "Case sinh viên tự thêm (§6.3)"

echo ""
echo "── Kiểm nội dung ────────────────────────────────────────────────────────"
W=$(sed -n '/^## Critique/,$p' ai-audit/ai-critique.md 2>/dev/null | sed '1d' | wc -w | tr -d ' ')
if [ "${W:-0}" -ge 200 ] && [ "${W:-0}" -le 300 ]; then printf "  [OK]    AI Critique %s từ (200–300)\n" "$W";
else printf "  [THIEU] AI Critique %s từ — §10 đòi 200–300\n" "$W"; MISSING=$((MISSING+1)); fi

if grep -q "youtu" README.md 2>/dev/null; then printf "  [OK]    Link video demo Agent Skill có trong README\n";
else printf "  [TUY CHON] chưa có link video demo — §7 chỉ *khuyến khích*, không tính là thiếu\n"; fi

if grep -qE "issues/[0-9]+" bug-report/bug-report.md 2>/dev/null; then printf "  [OK]    Bug report có số GitHub Issue\n";
else printf "  [THIEU] Bug report chưa có số GitHub Issue (§6.5)\n"; MISSING=$((MISSING+1)); fi

if grep -qE "actions/runs/[0-9]+" ci/ci-report.md 2>/dev/null; then printf "  [OK]    CI report có link 2 lượt chạy thật\n";
else printf "  [THIEU] CI report chưa có link lượt chạy (§6 đòi 2 commit mẫu)\n"; MISSING=$((MISSING+1)); fi

if grep -rqE "CHƯA (LÀM|VIẾT|CHỐT|CÓ|CHẠY)" report/ ai-audit/ bug-report/bug-report.md ci/ci-report.md 2>/dev/null; then
  printf "  [THIEU] Còn dấu 'CHƯA …' trong tài liệu — nội dung chưa xong\n"; MISSING=$((MISSING+1));
else printf "  [OK]    Không còn dấu 'CHƯA …'\n"; fi

echo ""
if [ "$MISSING" -gt 0 ]; then
  echo "  ⚠ Thiếu $MISSING mục. §17: thiếu tài liệu bắt buộc = 0 điểm."
  [ "$CHECK" = "1" ] && exit 1
  echo "  Vẫn đóng gói để xem trước, nhưng ĐỪNG nộp bản này."
  echo ""
else
  echo "  Đủ danh sách file cục bộ §14; vẫn phải kiểm link repo/video từ cửa sổ ẩn danh."
  echo ""
fi
[ "$CHECK" = "1" ] && exit 0

echo "══ Dựng $NAME ═══════════════════════════════════════════════════════════"
# Xoá MỌI bản đóng gói cũ, không chỉ bản cùng tên: một folder 23127178_HW06_AI_API_090/ còn sót từ lượt
# trước là bản CŨ nhưng nhìn y như bản mới, và nộp nhầm nó thì mọi sửa đổi sau đó không được nộp.
for old in 23127178_HW06_AI_API_*; do
  [ -e "$old" ] || continue
  [ "$old" = "$NAME" ] || [ "$old" = "$NAME.zip" ] && continue
  echo "   [DON] xoá bản đóng gói cũ: $old"
  rm -rf "$old"
done
rm -rf "$NAME" "$NAME.zip"
mkdir -p "$NAME"
for item in report ai-audit bug-report ci git-log TASKS.md README.md package.json \
            postman reports test-cases excel generator tools .github .claude; do
  [ -e "$item" ] && cp -R "$item" "$NAME/"
done
mkdir -p "$NAME/docs"
cp docs/api-selection.md "$NAME/docs/" 2>/dev/null   # bằng chứng §5, báo cáo trỏ link sang
find "$NAME" -name '.DS_Store' -delete 2>/dev/null
# §11 cấm sơ đồ do AI sinh → loại khỏi bộ nộp, chỉ giữ trong repo làm bản tham chiếu.
rm -f "$NAME"/generator/diagram/reference-layout-AI-KHONG-NOP.* 2>/dev/null
rm -rf "$NAME/reports/newman/tmp" 2>/dev/null

if [ "$NOZIP" = "1" ]; then
  echo ""
  echo "  Folder đã dựng (KHÔNG zip): $NAME/"
  du -sh "$NAME"/* 2>/dev/null | sed 's/^/    /'
  echo ""
  echo "  Tự zip khi nộp: nhấp phải folder trong Finder → Compress, hoặc:"
  echo "    zip -9qr $NAME.zip $NAME"
  echo ""
  exit 0
fi

zip -9qr "$NAME.zip" "$NAME"
echo ""
echo "  $NAME.zip  ($(du -h "$NAME.zip" | cut -f1))"
du -sh "$NAME"/* 2>/dev/null | sed 's/^/    /'
echo ""
echo "  Kiểm trước khi nộp: unzip -l $NAME.zip | tail -5"
