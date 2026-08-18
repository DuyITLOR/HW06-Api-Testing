// ============================================================================
// Script này dán vào tab **Pre-request Script** ở CẤP COLLECTION của cả 3 collection.
//
// §6.4 đòi: "Every request must carry the header X-Student-Id: {StudentID} (for example, via a
// pre-request script)". §11 (Anti-AI-Cheat) đòi thêm **ảnh console** chứng minh header này có
// thật — nên script chủ động console.log để chụp được trong Postman Console.
//
// Đặt ở cấp collection (không phải từng request) vì 35+ request × 3 API = hơn 100 chỗ phải sửa
// nếu gắn tay, và sót một request là mất bằng chứng §11 cho request đó.
// ============================================================================

// 1. Header bắt buộc — thêm cho MỌI request trong collection.
const studentId = pm.environment.get("student_id") || "23127178";
pm.request.headers.upsert({ key: "X-Student-Id", value: studentId });

// 2. Bằng chứng cho §11: in ra Postman Console (View -> Show Postman Console) để chụp ảnh.
console.log(
  "[HW06] X-Student-Id =", studentId,
  "|", pm.request.method, pm.request.url.getPath(),
  "|", new Date().toISOString()
);

// 3. Thiếu base_url thì mọi request fail với lý do khó đọc — chặn sớm, báo đúng nguyên nhân.
if (!pm.environment.get("base_url")) {
  throw new Error("Thieu bien moi truong base_url - chon environment HW06-local-23127178");
}
