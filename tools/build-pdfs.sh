#!/usr/bin/env bash
# build-pdfs.sh — xuất PDF cho các tài liệu §14 đòi phải có cả Markdown lẫn PDF.
#   bash tools/build-pdfs.sh
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DOCS=(
  "report/main-report.md"
  "ai-audit/ai-audit-report.md"
  "ai-audit/ai-critique.md"
  "bug-report/bug-report.md"
  "ci/ci-report.md"
  "generator/design.md"
)

PYTHON=""
for candidate in python3 /usr/bin/python3 /Library/Frameworks/Python.framework/Versions/3.11/bin/python3; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import markdown' >/dev/null 2>&1; then
    PYTHON="$candidate"; break
  fi
done
if [ -z "$PYTHON" ]; then
  echo "  [LOI] Không tìm thấy Python có module markdown. Cài: python3 -m pip install markdown"
  exit 1
fi

# Chỉ xuất lại PDF khi .md MỚI HƠN .pdf. Chrome nhét timestamp vào file PDF nên xuất lại vô điều kiện
# làm `git status` bẩn sau mỗi lần chạy — cùng loại vấn đề với summary.md. Dùng --force để xuất hết.
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

for md in "${DOCS[@]}"; do
  if [ ! -f "$md" ]; then echo "  [BO QUA] $md (chưa có)"; continue; fi
  pdf="${md%.md}.pdf"
  if [ "$FORCE" = "0" ] && [ -f "$pdf" ] && [ "$pdf" -nt "$md" ]; then
    echo "  [BO QUA] $pdf đã mới hơn nguồn"
    continue
  fi
  "$PYTHON" tools/md2pdf.py "$md" "$pdf" && echo "  [OK]   $pdf"
done
