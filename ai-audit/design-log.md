# Design log — quyết định thiết kế của bài, ghi tại thời điểm quyết định

Vì sao có file này: §2 đòi *dẫn AI qua từng bước của kỹ thuật*, và bằng chứng thuyết phục nhất cho
"đi từng bước" là một nhật ký ghi **lý do** ở từng bước, viết trước khi biết kết quả — chứ không phải
một bản tóm tắt viết ngược lại sau khi mọi thứ đã xong.

| # | Ngày | Quyết định | Lý do | Đã đúng chưa (điền sau) |
|---|---|---|---|---|
| 1 | 18/08/2026 | Chọn `GET /api/products` · `POST /api/cart` · `PUT /api/products/:id` | 3 pool khác nhau, chưa ai lấy, và mỗi API có ≥1 tham số + ≥1 giả thuyết bug rút từ source → đủ chất liệu cho ≥35 case | |
| 2 | 18/08/2026 | Cổng CI so với **baseline** `ci/expected-failures.json`, không dùng exit code Newman | Bộ test cố ý bắt bug thật → "0 assertion đỏ" là cổng không bao giờ xanh, mất hết tín hiệu hồi quy | |
| 3 | 18/08/2026 | Test summary **sinh tự động** từ raw JSON của Newman | Gõ tay số liệu là cách nhanh nhất để README và main-report lệch nhau | |
| 4 | 18/08/2026 | Pre-request script đặt ở **cấp collection**, không gắn từng request | >100 request; sót một request là mất bằng chứng §11 cho request đó | |
| 5 | 18/08/2026 | `seed-api-data.mjs` tạo fixture tên tiếng Việt / có `%` / có `_` / rất dài | Nhiều phân vùng của `search` chỉ kiểm được nếu DB có sẵn dữ liệu mang đặc điểm đó; nếu không sẽ không phân biệt "SUT sai" với "DB không có gì để tìm" | |
