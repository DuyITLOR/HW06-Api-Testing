---
name: ai-audit-logger
description: Record every AI interaction into HW06's mandatory AI Audit Report. Use after each AI turn while doing HW06 (choosing APIs, generating test cases, auditing them, writing the Postman collection, building the CI pipeline, writing the report). Appends a structured entry (tool, date/time, verbatim prompt, output, what the AI got wrong, why, human review) to ai-audit/ai-audit-report.md.
---

# AI Audit Logger Skill (HW06 §9)

HW06 có **AI Policy: Open** — bắt buộc có lời khai + AI Audit Report đầy đủ (§9). §17: thiếu bất kỳ
tài liệu bắt buộc nào là **0 điểm**. Skill này lo phần ghi log để không sót lượt nào.

## Khi nào dùng

Sau **mỗi** lượt hỏi AI liên quan HW06: chọn API · sinh test case (từng bước) · audit · viết
collection · dựng CI · viết báo cáo · thiết kế generator.

## Ghi gì cho mỗi lượt (§9)

1. **Tên AI tool** + model — ví dụ `Claude Code (Opus 5)`.
2. **Ngày và giờ** thật.
3. **Prompt nguyên văn**, trong code block.
4. **Output của AI** — đầy đủ hoặc tóm tắt **trung thực**.
5. **Human review** — sinh viên đã kiểm/sửa gì.

## Riêng HW06 — ghi thêm 3 trường

| Trường | Nội dung |
|---|---|
| **Bước trong quy trình** | Bước nào của `api-test-design` (1–5) hay `api-test-audit`? Ghi rõ để chứng minh dùng AI **từng bước** — §2 cấm đích danh prompt gộp *"generate all the API test cases from the spec and run them"* |
| **AI sai / bỏ sót** | expected bịa không theo spec · assertion chỉ kiểm status · bỏ nhóm security · không thấy `%`/`_` là wildcard của `LIKE` · bỏ case "giỏ không được xoá sau checkout" · không thấy route thiếu middleware auth · hard-code số dòng nên đỏ trên CI |
| **Vì sao bỏ sót** | `prompt quality` · `model limitations` · `characteristics of the API` — **đúng 3 nhóm** §6.3 đòi phân loại |

Ba trường này chép thẳng sang §11 của `report/main-report.md` và sang `extended.md` — viết một lần,
dùng ba chỗ.

## Quy trình

1. Mở `ai-audit/ai-audit-report.md`.
2. Tìm `Interaction #N` lớn nhất → lượt mới là `#N+1`.
3. Chèn ngay **phía trên** dòng `<!-- NEW_INTERACTION_MARKER -->`, theo template:

   ```markdown
   ### Interaction #<N>
   - **API / Bước:** <API-01 | API-02 | API-03 | setup | CI | generator | báo cáo>
   - **Bước trong quy trình:** <api-test-design bước 2 | api-test-audit | ...>
   - **AI tool:** <tool + model>
   - **Date & time:** <YYYY-MM-DD HH:MM>
   - **Prompt:**
     ```
     <nguyên văn>
     ```
   - **AI output (tóm tắt):** <trung thực>
   - **AI sai / bỏ sót:** <...>
   - **Vì sao bỏ sót:** <prompt | model | đặc điểm API>
   - **Human review:** <*(SV đã kiểm)* hoặc *(SV chưa tự kiểm)* + đã kiểm/sửa gì>
   - **Commit:** <hash hoặc message>
   ```
4. Cập nhật **bảng tổng hợp lỗi của AI** ở cuối file nếu lượt này bắt được lỗi mới.

## Hai nhãn human review — cố ý tách nhau

***(SV đã kiểm)*** và ***(SV chưa tự kiểm)***. Viết tất cả thành "đã kiểm hết" đúng là loại bằng
chứng dựng mà §11 phạt. Thà ghi chưa kiểm còn hơn ghi đã kiểm mà không kiểm.

## Đừng sửa output AI trước khi lưu

§6.2 chấm *"AI sinh gì"* và *"mình soát ra gì"* thành hai mục riêng. Sửa output rồi mới lưu là làm mất
vật chứng của mục thứ nhất, và mục thứ hai mất luôn đối tượng để soát. Lưu nguyên văn trước, soát sau.
