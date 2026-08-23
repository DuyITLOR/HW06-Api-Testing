# Bảng nháp để vẽ sơ đồ generator trên Lucidchart

> Nội dung dưới đây là **thiết kế của bài** (lấy từ `../design.md` §3 và §5). Việc vẽ là của sinh viên —
> §11 đòi sơ đồ *self-drawn*. Vẽ xong lưu **`generator-flow-selfdrawn.png`** vào thư mục này.

## Khổ giấy và bố cục

- Canvas: ngang, khoảng **1700 × 1200** (Lucidchart: `Page Settings → Custom`)
- **7 hàng** xếp từ trên xuống, mỗi hàng là một giai đoạn; **cột phải** dành cho 3 hộp nhánh
- Màu: xám nhạt = nguồn vào · trắng/xám = giai đoạn · **cam** = nhánh hỏi người · **đỏ** = nhánh nguy hiểm ·
  **xanh lá** = artefact · **xanh dương** = nhánh môi trường

## Bảng 1 — Các hộp cần vẽ (18 hộp)

| # | Hàng | Hộp | Chữ trong hộp | Màu |
|---|---|---|---|---|
| 1 | 1 | Nguồn vào A | **Đặc tả API** — `api_specification.md`: endpoint, tham số, body mẫu | xám nhạt |
| 2 | 1 | Nguồn vào B | **Yêu cầu FR + SEC** — README SUT: FR-05/07/15, SEC-01…07 | xám nhạt |
| 3 | 1 | Nguồn vào C | **Source code** — `backend/server.js`: hành vi thật + số dòng | xám nhạt |
| 4 | 2 | Giai đoạn 1 | **Parse cả BA nguồn** → bảng tham số + danh sách **chỗ spec im lặng** | trắng |
| 5 | 3 | Giai đoạn 2 | **Suy ra ràng buộc miền giá trị**. `Authorization` = một tham số (8 phân vùng) | trắng |
| 6 | 3 | **Nhánh cam** | **Câu hỏi cho NGƯỜI** — spec im lặng & không suy được từ FR/SEC → không bịa expected | **cam** |
| 7 | 4 | Giai đoạn 3 (tiêu đề) | **Sinh case theo 4 NHÓM — mỗi nhóm MỘT lượt AI riêng** (đề §2 cấm prompt gộp) | trắng |
| 8 | 4b | 3a | **Domain partition** — mọi tham số × 11 loại phân vùng | xám |
| 9 | 4b | 3b | **State transition** — chuỗi request có thứ tự, mutate → verify | xám |
| 10 | 4b | 3c | **Security SEC-01…07** — case tấn công + case chứng minh tác động | xám |
| 11 | 4b | 3d | **Schema validation** — so với SPEC, không so với chính response | xám |
| 12 | 5 | Giai đoạn 4 | **Khử trùng · xếp thứ tự · LỌC CASE GÂY CHẾT DỊCH VỤ**. Tiêu chí "đủ" = **ma trận phủ**, không phải đếm case | trắng |
| 13 | 5 | **Nhánh đỏ** | **Case làm SẬP SUT** — partial update → `price` NULL → GET id chẵn → tiến trình chết → tách sang `verify-bugs.sh` | **đỏ** |
| 14 | 6 | Giai đoạn 5 (tiêu đề) | **Sinh artefact từ MỘT nguồn định nghĩa** (`generator/specs/<api>.mjs`) | trắng |
| 15 | 6b | 4 artefact | `generated.md` · `audit.md` · `own.md` · **collection Postman** (+ pre-request `X-Student-Id`) | **xanh lá** |
| 16 | 7 | Giai đoạn 6 | **Chạy Newman rồi PHÂN LOẠI, không tự kết luận**. Cổng CI so **baseline đã ký nhận**, không so 0 | trắng |
| 17 | 8 | Phân loại ×3 | **SUT sai → BUG** (đỏ) · **TEST sai → sửa expected** (cam) · **MÔI TRƯỜNG → sửa runner** (xanh dương) | 3 màu |
| 18 | 8 | Ghi chú dưới cùng | *Mỗi assertion ĐỎ phải trả lời: đỏ vì đâu?* | không viền |

## Bảng 2 — Các mũi nối (13 mũi)

| # | Từ | Tới | Nhãn trên mũi | Kiểu |
|---|---|---|---|---|
| 1 | Nguồn vào A · B · C | Giai đoạn 1 | — | 3 mũi thẳng xuống |
| 2 | Giai đoạn 1 | Giai đoạn 2 | — | thẳng |
| 3 | Giai đoạn 2 | **Nhánh cam** (hộp 6) | *spec im lặng* | ngang, **cam** |
| 4 | Giai đoạn 2 | Giai đoạn 3 | — | thẳng |
| 5 | Giai đoạn 3 | 3a · 3b · 3c · 3d | — | 4 mũi toả xuống |
| 6 | 3a · 3b · 3c | Giai đoạn 4 | — | 3 mũi chụm xuống |
| 7 | 3d | **Nhánh đỏ** (hộp 13) | *case nguy hiểm* | **đỏ** |
| 8 | Giai đoạn 4 | **Nhánh đỏ** | *bị lọc khỏi collection* | ngang, **đỏ** |
| 9 | Giai đoạn 4 | Giai đoạn 5 | — | thẳng |
| 10 | Giai đoạn 5 | 4 artefact | — | 4 mũi toả xuống |
| 11 | 4 artefact | Giai đoạn 6 | — | chụm xuống |
| 12 | Giai đoạn 6 | 3 hộp phân loại | *SUT sai · TEST sai · môi trường* | 3 mũi, 3 màu |
| 13 | Hộp **TEST sai** | **Giai đoạn 2** | *vòng lặp: sửa luật miền rồi sinh lại* | **nét đứt cam**, đi vòng bên trái |

## Ba nhánh BẮT BUỘC phải có

Đây là ba quyết định thiết kế thật của bài, không phải trang trí — người chấm tìm đúng chúng:

1. **Nhánh cam (hộp 6)** — spec im lặng thì thành *câu hỏi cho người*, không thành expected.
   Bằng chứng: 3 case đã bị hạ expected qua nhánh này (§11 lỗi #1–#3), và 3 phát hiện bị hạ từ bug xuống
   rủi ro/câu hỏi (§11 lỗi #25).
2. **Nhánh đỏ (hộp 13)** — case làm sập SUT bị lọc khỏi collection, chuyển sang script tái hiện riêng.
3. **Ba hướng phân loại (hộp 17)** — mỗi assertion đỏ phải trả lời: SUT sai / test sai / môi trường.
   Bằng chứng: 22 bug đi hướng 1, 6 case hướng 2, 4 assertion hướng 3.

## Cách vẽ nhanh trên Lucidchart (~25 phút)

1. `Shapes → Flowchart`; dùng **Rectangle** cho mọi hộp (đừng dùng hình thoi — đây không phải flowchart quyết định)
2. Vẽ **hàng 1** (3 hộp nguồn vào) rồi copy-paste xuống làm các hàng sau cho đều nhau
3. Chọn nhiều hộp → `Arrange → Align → Distribute horizontally` để thẳng hàng
4. Nhánh cam/đỏ đặt ở **cột phải**, nối bằng mũi ngang
5. Vòng lặp (mũi #13): dùng đường **elbow**, đi ra lề trái rồi lên
6. `File → Export → PNG` (chọn *Fit to screen*, scale 2x cho nét) → lưu
   **`generator/diagram/generator-flow-selfdrawn.png`**
7. Xuất thêm bản `.lucid`/link chia sẻ nếu muốn có bằng chứng mình vẽ

Xong thì: `npm run verify` (mục sơ đồ chuyển xanh) → `bash tools/package.sh 100`
