# `.claude/` — Agent Skills của HW06 (§7)

4 skill, dùng theo đúng thứ tự quy trình của đề:

| Thứ tự | Skill | Bước của đề |
|---|---|---|
| 1 | [`api-test-design`](skills/api-test-design/SKILL.md) | §6.1 — sinh test case, **5 bước riêng biệt** (đề cấm prompt gộp) |
| 2 | [`api-test-audit`](skills/api-test-audit/SKILL.md) | §6.2 + §6.3 — dán nhãn VALID/INVALID/INCOMPLETE, thêm ≥5 case AI bỏ sót |
| 3 | [`postman-newman`](skills/postman-newman/SKILL.md) | §6.4 — dựng collection, chạy Newman, cổng CI |
| — | [`ai-audit-logger`](skills/ai-audit-logger/SKILL.md) | §9 — ghi audit sau **mỗi** lượt AI |

`api-test-design` cũng chính là bản hiện thực chạy được của **AI test generator** mà §7 đòi thiết kế
(xem `generator/design.md`).

`.claude/projects/` và `.claude/settings.local.json` **không** commit (xem `.gitignore`) — đó là
memory/session nội bộ, không phải bài làm.
