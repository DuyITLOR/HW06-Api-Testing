# Sơ đồ generator — xuất xứ

- **Hình:** `generator-flow.png` (1680×1180) · **nguồn:** `generator-flow.svg`
- **Dựng thế nào:** SVG được viết bằng mã từ thiết kế 6 giai đoạn ở [`../design.md`](../design.md) §3,
  render ra PNG bằng Chrome headless. Nội dung (các giai đoạn, ba nhánh quyết định, vòng lặp) là thiết
  kế của bài; phần trình bày do **AI dựng**.
- **Vì sao ghi rõ:** bản PDF đề trong `docs/` (§11) còn yêu cầu sơ đồ *"self-drawn — designed by you, not
  generated directly by an AI"*. Sinh viên xác nhận **bản đề đã được sửa** và cho phép dùng hình do AI
  dựng. Ghi lại xuất xứ ở đây thay vì để trống, để không khai sai — nếu giảng viên áp bản §11 cũ thì chỉ
  cần vẽ lại hình theo đúng nội dung này, phần còn lại của bài không đổi.
- **Nộp kèm cả `.svg`** để hình dựng lại được và kiểm được từng phần tử, thay vì chỉ có ảnh raster.

## Nội dung hình

Ba nguồn vào (spec · FR/SEC · source) → 6 giai đoạn → 3 hướng phân loại assertion đỏ, kèm hai nhánh
đáng chú ý: *câu hỏi cho người* khi spec im lặng, và *case làm sập SUT* bị lọc khỏi collection.
