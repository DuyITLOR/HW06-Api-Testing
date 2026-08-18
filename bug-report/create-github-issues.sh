#!/usr/bin/env bash
# ============================================================================
# create-github-issues.sh — tạo 19 GitHub Issue cho 19 bug của HW06 (§6.5).
#
#   DRY_RUN=1 bash bug-report/create-github-issues.sh    # chỉ in ra, không tạo
#   bash bug-report/create-github-issues.sh              # tạo thật
#   bash bug-report/create-github-issues.sh BUG-14       # chỉ một bug
#
# CHẠY MỘT LẦN. Chạy lại sẽ tạo issue trùng (script kiểm tiêu đề đã tồn tại để hạn chế).
#
# Nội dung nằm ở bug-report/issues/BUG-XX.md (sinh bằng tools/make-issues.py) chứ không nhúng
# trong script: nội dung có backtick, ngoặc và heredoc lồng nhau — tách file thì không phải escape.
#
# Ảnh: gh CLI không upload được ảnh vào issue. Ảnh chụp thật của báo cáo Newman đã được push lên
# repo HW06 (public) và nhúng bằng raw URL, nên issue có ảnh ngay khi tạo.
# ============================================================================
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

REPO="${REPO:-DuyITLOR/group05_eshop}"
DRY_RUN="${DRY_RUN:-0}"
ONLY="${1:-}"

sev_label() { case "$1" in Critical) echo "severity: critical";; High) echo "severity: major";; *) echo "severity: minor";; esac; }

echo ">> Repo: $REPO · DRY_RUN=$DRY_RUN"
[ "$DRY_RUN" != "1" ] && { gh auth status >/dev/null 2>&1 || { echo "Chưa đăng nhập gh → gh auth login"; exit 1; }; }

EXISTING=""
if [ "$DRY_RUN" != "1" ]; then
  EXISTING=$(gh issue list --repo "$REPO" --limit 300 --json title --jq '.[].title' 2>/dev/null || true)
fi

n=0
for f in bug-report/issues/BUG-*.md; do
  id="$(basename "$f" .md)"
  [ -n "$ONLY" ] && [ "$ONLY" != "$id" ] && continue
  title="$(sed -n '1s/<!-- title: \(.*\) -->/\1/p' "$f")"
  sev="$(sed -n '2s/.*sev: \([A-Za-z]*\).*/\1/p' "$f")"
  pri="$(sed -n '2s/.*pri: \(P[0-9]\).*/\1/p' "$f")"
  body="$(tail -n +3 "$f")"
  labels="type: bug,status: new,found-by: test-case,$(sev_label "$sev"),priority: $pri"

  if [ -n "$EXISTING" ] && grep -Fxq "$title" <<< "$EXISTING"; then
    printf "  [BO QUA] %s đã có issue cùng tiêu đề\n" "$id"; continue
  fi

  if [ "$DRY_RUN" = "1" ]; then
    printf "  [DRY] %s · %s/%s · labels=%s\n         %s\n" "$id" "$sev" "$pri" "$labels" "$title"
  else
    url=$(gh issue create --repo "$REPO" --title "$title" --body "$body" \
          --label "type: bug" --label "status: new" --label "found-by: test-case" \
          --label "$(sev_label "$sev")" --label "priority: $pri" 2>&1 | tail -1)
    printf "  [OK] %-7s %s\n" "$id" "$url"
    echo "$id $url" >> bug-report/issues/created.txt
    sleep 1   # tránh rate limit
  fi
  n=$((n+1))
done
echo ">> $n issue"
