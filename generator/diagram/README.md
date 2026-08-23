# Sơ đồ generator (§7) — **CHƯA CÓ BẢN NỘP**

## Trạng thái

| File | Là gì | Có nộp? |
|---|---|---|
| `generator-flow-selfdrawn.png` | **bản sinh viên tự vẽ** — §7 đòi cái này | **CHƯA CÓ** |
| `reference-layout-AI-KHONG-NOP.png` / `.svg` | bố cục do **AI** dựng, dùng làm bản tham chiếu để vẽ theo | **KHÔNG** — `tools/package.sh` loại khỏi bộ nộp |

## Vì sao bản AI bị loại khỏi bộ nộp

§11 của đề (`docs/2026.HW06.API Testing_En.pdf`) ghi đích danh:

> *"The AI test-generator diagram, which must be **self-drawn** — designed by you, **not generated
> directly by an AI**."*

Bản trước nộp kèm hình do AI dựng và **khai rõ điều đó** trong file này. Khai đúng thì không phải gian,
nhưng vẫn là **vi phạm trực tiếp** một ràng buộc của §11 — và đã bị trừ điểm khi soát lại. Không có bản
đề sửa nào làm bằng chứng, nên cách xử lý đúng là: **loại hình AI khỏi bộ nộp**, giữ nó lại trong repo
dưới tên nói rõ nó là gì, và để sinh viên vẽ bản của mình.

## Vẽ trong ~30 phút

1. Mở `reference-layout-AI-KHONG-NOP.png` để xem bố cục, và đọc `../design.md` §3 (6 giai đoạn) +
   §5 (hai quyết định thiết kế) — **nội dung là thiết kế của bài**, chỉ phần trình bày cần tự vẽ.
2. Vẽ bằng draw.io / Excalidraw / Figma / vẽ tay rồi chụp.
3. Ba nhánh **phải có**, vì chúng là ba quyết định thiết kế thật:
   - Giai đoạn 2 → *Câu hỏi cho NGƯỜI* khi spec im lặng (3 case đã đi qua nhánh này)
   - Giai đoạn 4 → *Case làm sập SUT* bị lọc khỏi collection
   - Giai đoạn 6 → 3 hướng phân loại assertion đỏ: SUT sai / test sai / môi trường
4. Lưu **`generator-flow-selfdrawn.png`** vào đúng thư mục này (kèm file nguồn `.drawio`/`.excalidraw`
   nếu có — nó là bằng chứng bạn vẽ).
5. `npm run verify` → mục sơ đồ sẽ chuyển xanh; rồi `bash tools/package.sh <điểm>`.
