# Sơ đồ generator (§7) — xuất xứ

| File | Là gì | Có nộp? |
|---|---|---|
| `generator-flow-selfdrawn.png` | **bản nộp** — sinh viên dựng trên Lucidchart (3911×4096) | **CÓ** |
| `DRAWING-SHEET.md` | bản nháp: 18 hộp + 13 mũi nối + màu + bố cục, rút từ `../design.md` §3/§5 | có (tài liệu hỗ trợ) |
| `reference-layout-AI-KHONG-NOP.png` / `.svg` | bố cục do **AI render**, chỉ để tham chiếu | **KHÔNG** — `tools/package.sh` loại khỏi bộ nộp |

## Cách bản nộp được tạo ra — nói đủ để người chấm tự đánh giá

§11 của đề: *"The AI test-generator diagram, which must be **self-drawn** — designed by you, **not generated
directly by an AI**."*

Quy trình thực tế:

1. **Nội dung sơ đồ là thiết kế của bài** — 6 giai đoạn (`../design.md` §3) và ba nhánh quyết định
   (`../design.md` §5). Không phải AI nghĩ ra lúc vẽ.
2. Nội dung đó được viết thành bản nháp `DRAWING-SHEET.md`: từng hộp, từng chữ trong hộp, từng màu, từng
   mũi nối kèm nhãn và kiểu đường.
3. **Sinh viên dựng hình trên Lucidchart** từ bản nháp. Lượt dựng đầu sai bố cục ở 5 chỗ — mất toàn bộ màu,
   `3d Schema validation` lạc xuống đáy và không nối đi đâu, hai hộp nhánh (cam/đỏ) bị nhét xuống đáy thay vì
   nằm ở cột phải của giai đoạn tương ứng, hàng phân loại bị xé làm hai, thiếu phụ đề. **Sinh viên chỉnh từng
   chỗ** rồi export PNG.
4. Bản do AI render trước đó **không nộp**.

Ghi như vậy vì ghi gọn thành *"tôi tự vẽ 100%"* là không đúng, còn nộp hình AI render mà nói self-drawn thì
vi phạm §11 — bản trước đã bị trừ điểm vì đúng chuyện đó (xem `../../report/main-report.md` §11 lỗi tương ứng).

## Bằng chứng sinh viên dựng hình

**Tài liệu Lucidchart:** https://lucid.app/lucidchart/7eec813a-2306-4d53-8fc0-0649ec4b5c06/view

Mở link này, người chấm kiểm được hai thứ mà file PNG không cho thấy:

1. **`File → Revision history`** — lịch sử sửa của tài liệu: lượt dựng đầu, rồi từng lần sinh viên chỉnh
   (đổi màu 11 hộp, kéo `3d Schema validation` lên hàng 3a-3b-3c và nối mũi xuống Giai đoạn 4, kéo hai hộp
   nhánh cam/đỏ sang cột phải, gom hàng phân loại, vẽ lại mũi vòng lặp nét đứt, thêm phụ đề).
2. **Từng hộp là shape thật** có thể click, chọn, sửa — không phải ảnh dán vào.

> **Trước khi gửi link cho TA:** trong Lucid bấm `Share → Anyone with the link → **Can view**`. Link ở trên là
> link *view*; đừng dán link `/edit?...invitationId=...` vào repo hay báo cáo — ai đọc được cũng sửa/xoá được
> tài liệu.

## Ba nhánh trong hình — người chấm tìm đúng chúng

| Nhánh | Ý nghĩa | Bằng chứng trong bài |
|---|---|---|
| Giai đoạn 2 → **Câu hỏi cho NGƯỜI** (cam) | spec im lặng thì thành câu hỏi, **không** thành expected | 3 case bị hạ expected (§11 lỗi #1–#3) và 3 phát hiện bị hạ từ bug xuống rủi ro/câu hỏi (§11 lỗi #25) |
| Giai đoạn 4 → **Case làm SẬP SUT** (đỏ) | case gây chết dịch vụ bị lọc khỏi collection, tách sang `verify-bugs.sh` | BUG-14 + `test-cases/api-03-product-update/audit.md` |
| Giai đoạn 6 → **3 hướng phân loại** | mỗi assertion đỏ phải trả lời: SUT sai / test sai / môi trường | 22 bug hướng 1 · 6 case hướng 2 · 4 assertion hướng 3 |
| **Vòng lặp** (nét đứt cam) | test sai → sửa luật miền ở Giai đoạn 2 rồi sinh lại | 6 case đã đi qua vòng này |
