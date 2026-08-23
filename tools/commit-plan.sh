#!/usr/bin/env bash
# ============================================================================
# commit-plan.sh — commit HW06 theo từng bước của quy trình (§12).
#
#   bash tools/commit-plan.sh status      # đã commit gì, còn gì chưa
#   bash tools/commit-plan.sh scaffold    # commit bộ khung + tooling (6 commit nhỏ)
#   bash tools/commit-plan.sh log         # xuất git-log/commit-log.txt
#
# §12 đòi **một commit cho mỗi bước** (generation, audit, extension, execution — cho TỪNG API) và
# một file log dạng text ở cuối. KHÔNG lùi ngày commit (--date): §11 nói bằng chứng không được dựng,
# và chính cái log này là thứ được kiểm.
#
# Message viết bằng tiếng Anh (giữ quy ước HW02–HW05); phần in ra màn hình giữ tiếng Việt.
# ============================================================================
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

c() {
  if git diff --cached --quiet; then echo "  [BO QUA] không có gì để commit: $1"; return 0; fi
  git commit -q -m "$1" -m "$2" && printf "  [OK]   %2d. %s\n" "$(git rev-list --count HEAD)" "$1"
}

case "${1:-status}" in

scaffold)
echo "── Commit bộ khung + tooling ─────────────────────────────────────────"

git add .gitignore package.json
c "chore: repo skeleton for HW06 API testing" \
"Same layout HW02-HW05 settled on, so the section 14 submission checklist maps one-to-one onto
folders: report/ ai-audit/ bug-report/ ci/ git-log/ docs/, plus the HW06-specific postman/
test-cases/ reports/newman/ excel/ generator/.

.gitignore commits what section 11 and section 14 name explicitly - the collections, the
environment, the data-driven CSVs, the Newman HTML and raw JSON, the evidence screenshots - and
excludes the submission zip and the packaging folder, both of which are rebuildable."

git add docs/api-selection.md
c "docs: pick three APIs, one per pool, with anti-duplication evidence" \
"Section 5 forbids two group members sharing the same three APIs, so the four sets already taken
are written down before mine. Mine: GET /api/products (A, FR-05), POST /api/cart (B, FR-07),
PUT /api/products/:id (C, FR-15) - none of the three main endpoints is taken.

The choice is argued from the SUT source, not from taste. Section 6.1 wants domain partitions on
every parameter, so an endpoint with a single path parameter cannot carry 35 meaningful cases;
each of the three chosen has multiple parameters plus at least one bug hypothesis read off the
code (string-concatenated SQL at server.js:143, no validation at :290, missing auth middleware
at :179). Those are hypotheses - the file says so - and each one needs a real request before it
may be called a bug."

git add tools/preflight.mjs tools/seed-api-data.mjs
c "test: environment preflight and data-driven fixtures" \
"preflight.mjs refuses to start a run against a dead SUT or a locked-out seed account. That
matters here because a broken environment does not produce an obviously empty suite - it produces
a report full of 401s that reads like a security finding.

seed-api-data.mjs creates products whose names carry the characteristics the search partitions
need: uppercase, Vietnamese diacritics, a literal % and a literal _ (both LIKE wildcards), a
~250-character name, and an apostrophe. Without them, a test for 'search by Vietnamese text'
returns an empty array and cannot be distinguished from a real defect. It also writes the CSV
files for the Collection Runner."

git add tools/run-newman.sh tools/summarize-newman.mjs tools/ci-gate.mjs ci/expected-failures.json
c "test: newman runner, auto-generated summary, baseline CI gate" \
"run-newman.sh names every report by timestamp so a run can be matched to a moment, and calls
preflight first.

summarize-newman.mjs makes reports/newman/*.json the single source of the executed/passed/failed
numbers. Numbers typed by hand into README and main-report drift apart; here both read one
generated file.

ci-gate.mjs deliberately ignores Newman's exit code. This suite is built to catch real bugs in the
SUT, so a 'zero failed assertions' gate would be red forever and would stop distinguishing a new
regression from a known one. The gate compares against ci/expected-failures.json instead, where
every expected failure carries a reason pointing at a bug."

git add postman/environments/ postman/prerequest-collection.js postman/README.md tools/tc2xlsx.py tools/build-pdfs.sh tools/md2pdf.py
c "chore: postman environment, X-Student-Id pre-request script, packaging tools" \
"The X-Student-Id header (section 6.4) is set by a collection-level pre-request script, not per
request: three collections times 35+ requests is over a hundred places to get wrong, and one
missed request loses the section 11 evidence for that request. The script also logs to the Postman
console, which is exactly the screenshot section 11 asks for.

tc2xlsx.py turns the 12-column Markdown test-case tables into the Excel file section 14 requires,
so the tables stay reviewable in git and the spreadsheet is generated, never hand-maintained.

verify-all.sh recomputes the invariants a machine can check and prints the rest as a manual list.
package.sh encodes the section 14 checklist, because section 17 makes a missing document a zero."

git add .github/ .claude/ git-log/ postman/data/
c "chore: agent skills, CI workflow, and data-driven CSV fixtures" \
"Four skills, in the order the assignment runs: api-test-design (five separate steps, because section
2 explicitly forbids one lumped prompt), api-test-audit (VALID/INVALID/INCOMPLETE plus the cases the
AI missed and why), postman-newman (collection, assertions, Newman, CI gate), and ai-audit-logger.

The workflow checks out the SUT inside the job and runs Newman against it - a pipeline that only runs
on the student's laptop is not a pipeline. The CSV files feed the Collection Runner and carry the
partition name in a column, so a red data-driven iteration says which partition broke."
;;

content)
echo "── Commit nội dung 3 API theo từng bước §6 ───────────────────────────"

git add tools/gen-artifacts.mjs bug-report/verify-bugs.sh
c "test: probe the SUT for real behaviour before designing expected values" \
"Every expected value in this suite has to come from the spec, but the spec cannot tell you where the
spec and the code disagree - and that gap is exactly where the bugs are. So the first step was ~60
real requests against a running SUT to check the twelve hypotheses read off server.js.

The probe found something no test case would have: the SUT died mid-run. An unauthenticated PUT with
a partial body nulls a product's price, and a later GET on an even id runs price.toString() on null
inside a sqlite3 callback, outside any try/catch - the whole node process exits. That is BUG-14, the
worst bug in the assignment, and it is the reason the crash chain lives in verify-bugs.sh rather than
in a Postman collection: a Newman run that touches it turns every later case red for environmental
reasons and destroys its own evidence."

git add generator/specs/api-01-products-search.mjs test-cases/api-01-products-search/generated.md
c "test(api-01): generate 36 test cases for GET /api/products" \
"Five separate AI turns, one per technique, as section 2 requires - parameters and spec silences,
then domain partitions, then state transitions, then SEC-01..SEC-07, then schema. Authorization is
treated as a parameter with its own partitions, not as a precondition.

The spec file holds all three pipeline steps for this API because generated.md, audit.md, extended.md
and the Postman collection are all rendered from it by gen-artifacts.mjs. Hand-maintaining the table
and the collection separately guarantees they drift on the first edit, and nobody notices: the grader
reads the table, Newman runs the collection."

git add test-cases/api-01-products-search/audit.md
c "test(api-01): audit AI-generated cases, 35 VALID and 1 corrected" \
"TC-PRODLIST-011 asserted '0 rows' for search=' '. Spec 3.1 says nothing about trimming, so that
number was invented - and an invented expected value produces a fake bug that a reader cannot tell
from a real one. Corrected to what the spec actually guarantees: 200 plus schema.

Expected values were NOT relaxed to match the SUT anywhere else. Fourteen cases here stay red on
purpose; red is the finding."

git add test-cases/api-01-products-search/extended.md
c "test(api-01): add 7 cases the AI missed, with the reason it missed each" \
"The three that matter: searching 'ao' in lowercase Vietnamese (SQLite LIKE is case-insensitive for
ASCII only, so Vietnamese shoppers typing naturally find nothing - BUG-05); '%' as a legitimate
character in a product name like 'ban phim 100%' rather than only as an attack payload (BUG-06); and
checking the CONSEQUENCE of a stacked-query payload instead of its status code.

Each row is classified by why the AI missed it - prompt quality, model limitation, or a
characteristic of the API - as section 6.3 asks."

git add generator/specs/api-02-cart-add.mjs test-cases/api-02-cart-add/generated.md test-cases/api-02-cart-add/audit.md test-cases/api-02-cart-add/extended.md
c "test(api-02): 39 generated + audit + 7 student cases for POST /api/cart" \
"One correction: TC-CART-008 expected a stock-limit rejection, but the products table has no stock
column, so FR-07 states a constraint the data model cannot support. The case stays - the requirement
is real - with the limitation written down instead of deleted for a tidier table.

The price argument is spelled out because it drives several expected values: spec 4.2 does list
price in the request body, so sending it is literally per spec. This suite still requires the cart
price to equal the catalogue price, because FR-08 computes order totals from the cart - if the client
sets the price it sets the amount payable. That reasoning is reproduced in audit.md so a grader can
judge it rather than take it on trust.

All seven student cases ask the same question the AI never asks: not what the status code was, but
what ended up in server state."

git add generator/specs/api-03-product-update.mjs test-cases/api-03-product-update/generated.md test-cases/api-03-product-update/audit.md test-cases/api-03-product-update/extended.md
c "test(api-03): 39 generated + audit + 8 student cases for PUT /api/products/:id" \
"Two design decisions are recorded in audit.md. First, 00-setup creates two fixtures and picks the
ODD id, because a GET on an even id with a null price kills the backend; every verification request
reads the odd one. Second, cases 107 and 108 deliberately step outside the assigned endpoint to check
POST and DELETE /api/products, which sit under the same 'admin only' heading in the spec and are
missing the same middleware. A report that only mentions PUT gets one line patched and leaves two
holes open.

Cases 101-105 exist to prove impact rather than status: after an unauthenticated PUT and a
normal-user PUT they GET the product back to show the data actually changed, which is what moves
BUG-13 from 'wrong status code' to Critical."

git add postman/collections/ postman/README.md
c "test: three Postman collections generated from the case definitions" \
"27 folders, 171 requests, 329 assertions. The X-Student-Id header comes from a collection-level
pre-request script: 171 requests is 171 chances to forget one, and one forgotten request loses the
section 11 evidence for that request. The script also logs to the console, which is the screenshot
that section 11 asks for.

Assertions check status, type and shape - jsonSchema in every 40-schema folder - because on this SUT
a status code alone cannot distinguish 'validated the input' from 'accepted anything'."

git add tools/run-newman.sh tools/preflight.mjs tools/seed-api-data.mjs reports/newman/ test-cases/test-summary/summary.md
c "test: execute all three collections, 240 assertions pass and 89 fail" \
"The runner restarts the SUT before each collection. database.js drops and reseeds every table on
startup, so a restart is the only way to get a defined input state; a second run over a database that
136 test cases just mutated is not comparable with the first. It kills only the process it started
itself, via .run-logs/sut.pid, because the machine may be running another assignment's backend.

Two red assertions in the first run were mine, not the SUT's: generated test names embedded unescaped
quotes, and the user2 seed ran before the SUT had finished seeding the users table, so 401 looked like
a finding. Readiness now means 'admin can log in', not 'the port is open'. API-02 went from 34 red to
30. Every red assertion has to answer whether it is the system, the test, or the environment before it
may enter the bug report."

git add ci/expected-failures.json tools/ci-gate.mjs ci/ci-report.md
c "ci: gate on a signed-off failure baseline instead of zero failures" \
"This suite is built to catch real bugs, so 89 red assertions is the healthy state. A 'zero red' gate
would be red forever and would stop distinguishing a new regression from a known bug - the signal
would be gone. The gate compares against ci/expected-failures.json (29/30/30, each entry naming the
bugs behind it): more red means a new regression, less red means the SUT was fixed OR the tests got
weaker, and both need a human.

Both branches of the gate were exercised locally before writing the report; gate_mode=strict is how
the required red sample run gets produced without committing a deliberately broken test."

git add bug-report/bug-report.md bug-report/verify-bugs-output.txt
c "docs: report 19 bugs, all 19 reproduced with real requests" \
"5 Critical, 5 High, 7 Medium, 2 Low. Nothing in this report rests on reading source code - each bug
has a request/response/verdict block in verify-bugs-output.txt and can be re-run with
'bash bug-report/verify-bugs.sh <n>'.

BUG-14 is the one worth reading: three individually mid-severity bugs - a route with no auth, a
partial update that nulls columns, and a toString() branch keyed on id parity - compose into an
unauthenticated two-request kill of the entire backend, repeatable after every restart.

Four hypotheses were REJECTED after testing and are listed as such: cart isolation between users
works, SEC-02 does hold on POST /api/cart, the DROP TABLE payload does not actually drop the table
(db.all runs only the first statement), and :id is parameterised. Keeping the rejects visible is
part of the evidence."

git add test-cases/test-summary/traceability-matrix.md tools/tc2xlsx.py excel/
c "docs: traceability matrix and generated Excel workbook" \
"The matrix covers FR-05..FR-15 and SEC-01..SEC-07 and names the two cells that are deliberately
empty - SEC-07 belongs to another member's endpoint, and SEC-04 has no API-level finding because the
real risk is in the UI layer. An empty cell with a reason is information; an empty cell without one is
a coverage hole.

The workbook is generated from the Markdown tables. First run emitted 250 rows instead of 136 because
it merged generated.md and audit.md, double-counting every AI case - audit.md is the final version of
the same set, not a new one. Caught because the number disagreed with summary.md."

git add report/ ai-audit/ generator/design.md generator/pseudocode.py generator/diagram/
c "docs: main report, AI audit with 13 logged AI errors, and generator design" \
"Section 11 of the report is the part the assignment weights most heavily: eleven real AI errors with
how each was detected. Three invented expected values where the spec is silent, four blind spots that
only reading the source or the fixture data reveals, two technical faults in generated code, and two
process slips. Errors 9 and 10 are the methodologically interesting ones - both produced red
assertions that would have been filed as SUT bugs without tracing them.

The AI audit keeps two distinct human-review labels rather than one blanket 'reviewed'. Eight
interactions are marked 'not yet checked by the student', which is accurate: the VALID labels are
currently the AI's, and section 6.2 puts responsibility on the student.

The generator design documents the running implementation, including why the crash chain is excluded
from the collection and why 'enough' is a coverage matrix rather than a case count. The diagram itself
is deliberately absent - section 11 requires it to be self-drawn."

git add .gitignore report/main-report.pdf ai-audit/*.pdf bug-report/bug-report.pdf ci/ci-report.pdf generator/design.pdf
c "docs: export the PDF copies section 14 requires" \
"Section 14 asks for Markdown and PDF for the main report, the AI audit and the critique; bug report,
CI report and generator design are exported the same way so a reader who only opens the ZIP still gets
everything. Built by tools/build-pdfs.sh via python-markdown plus headless Chrome, so the PDFs are
regenerable rather than hand-made artefacts."

git add README.md TASKS.md tools/verify-all.sh tools/package.sh tools/commit-plan.sh docs/
c "docs: update README with measured results and the five remaining manual items" \
"Numbers in the README come from summary.md, which is generated from the Newman JSON - the same
source the report reads, so the two cannot drift.

verify-all.sh now counts unique TC IDs rather than table rows; counting rows inflated each API by the
size of its 'why the AI missed this' table (50 instead of 43). Current state: 30 pass, 5 fail, and all
five failures are the items only a person can do - GitHub issues, the self-drawn diagram, the Postman
console screenshot, the two CI runs, and the student's own review pass."
;;

log)
mkdir -p git-log
{
  echo "Git commit log — HW06 API Testing · SV Lê Nhựt Duy 23127178"
  echo "Xuất lúc: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "Repo: $(git remote get-url origin 2>/dev/null || echo 'chưa có remote')"
  echo "Số commit: $(git rev-list --count HEAD 2>/dev/null || echo 0)"
  echo ""
  # Dạng graph + --stat: giống commit-log của HW02, và là dạng đọc được nhiều nhất —
  # mỗi commit đi kèm ĐÚNG danh sách file nó sửa cùng số dòng +/-, nên người chấm thấy
  # ngay commit nào tạo ra artefact nào mà không cần mở repo.
  echo "═══ Graph + thống kê file ═════════════════════════════════════════════"
  git log --graph --all --stat --date=short --pretty=format:'%h | %ad | %an | %s'
  echo ""
  echo ""
  echo "═══ Đầy đủ (kèm body) ═════════════════════════════════════════════════"
  git log --pretty=format:'commit %H%nAuthor: %an <%ae>%nDate:   %ad%n%n%B%n---'
} > git-log/commit-log.txt
echo "  → git-log/commit-log.txt ($(wc -l < git-log/commit-log.txt) dòng)"
;;

status|*)
echo ""
echo "── Đã commit ────────────────────────────────────────────────────────────"
git log --oneline | head -30
echo ""
echo "── Chưa commit ──────────────────────────────────────────────────────────"
git status --short
echo ""
echo "── Các bước §12 còn phải commit riêng ──────────────────────────────────"
cat <<'TXT'
  Mỗi API (API-01, API-02, API-03) cần 4 commit riêng:
    1. generation  — test-cases/<api>/generated.md
    2. audit       — test-cases/<api>/audit.md
    3. extension   — test-cases/<api>/extended.md
    4. execution   — postman/collections/... + reports/newman/... + summary
  Cộng thêm: bug report + GitHub Issues · CI (2 lượt mẫu) · generator (§7) ·
             AI audit + critique · README/self-assessment · xuất PDF · commit log.
TXT
echo ""
;;
esac
