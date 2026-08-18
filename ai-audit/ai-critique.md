# AI Critique — HW06 (§10, 200–300 từ)

- **Sinh viên:** Lê Nhựt Duy — **MSSV:** 23127178

> §10 đòi trả lời ba câu: AI sai/thiên lệch/thiếu ở đâu · vì sao nó không bắt được · nguyên tắc rút ra.

## Critique

AI sai ở ba chỗ khác bản chất. Thứ nhất là **bịa expected**: ở ba test case mà đặc tả im lặng, nó vẫn ghi
một status code cụ thể — `search=" "` phải trả 0 dòng, `name` 300 ký tự phải 400, `quantity`
999999 phải bị chặn vì vượt tồn kho — dù bảng dữ liệu không có cột tồn kho. Lỗi này nguy hiểm hơn thiếu
case: một expected không căn cứ sinh ra **bug giả**, không ai phân biệt được với bug thật.

Thứ hai là **thiên lệch theo status code**: mọi test security AI sinh đều kết thúc ở mã trả về. Hệ thống
này trả 200 cho gần như mọi thứ, nên mã trả về không phân biệt được "đã kiểm dữ liệu" với "nhận bừa". Chỉ
khi đọc lại trạng thái mới thấy khách không đăng nhập đã sửa được sản phẩm.

Thứ ba là **điểm mù về đặc điểm hiện thực**: tìm kiếm tiếng Việt phân biệt hoa/thường, `%` là ký tự hợp lệ
trong tên sản phẩm, kiểu dữ liệu đổi theo tính chẵn lẻ của khoá — không suy ra được từ đặc tả.

Nó không bắt được vì nó suy luận từ văn bản, còn ba loại lỗi trên chỉ hiện ra khi chạy request thật và đọc
mã nguồn. Bằng chứng rõ nhất: lỗi nặng nhất của bài — hai request không cần token làm sập backend — lộ ra
vì hệ thống chết giữa lúc dò thử, không do case nào sinh ra.

Nguyên tắc rút ra: mỗi khẳng định của AI phải trỏ về được một dòng đặc tả hoặc một dòng mã, và mỗi kết quả
đỏ phải trả lời được: sai ở hệ thống, ở test, hay ở môi trường?
