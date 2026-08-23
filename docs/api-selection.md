# Chọn API cho HW06 — bằng chứng không trùng trong nhóm (§5)

- **Sinh viên:** Lê Nhựt Duy — **MSSV:** 23127178 — **Nhóm:** 05
- **SUT:** EShop — https://github.com/ttbhanh/eshop-sut · spec: `api_specification.md`
- **Ngày chốt:** 18/08/2026

Đề §5 đòi **3 API, mỗi API thuộc một pool A / B / C**, và **không được trùng bộ 3 với thành viên
nào trong nhóm**. File này ghi lại (1) API các thành viên khác đã đăng ký, (2) bộ 3 của tôi,
(3) **lý do chọn dựa trên source code thật của SUT** — không chọn theo cảm tính, vì §6 đòi phủ
domain partition trên *mọi* tham số, state transition, security SEC-01–SEC-07 và schema
validation, nên API quá ít tham số sẽ không đủ chất liệu cho ≥35 test case có nghĩa.

---

## 1. API các thành viên khác đã đăng ký (chốt qua chat nhóm 18/08/2026)

| Thành viên | Pool A | Pool B | Pool C |
|---|---|---|---|
| SV #1 | `PUT /api/users/me` (FR-04, + `GET /api/users/me` để verify) | `PUT /api/orders/:id/cancel` (FR-10) | `POST /api/admin/coupons` (FR-17, + `DELETE` để dọn) |
| SV #2 | `POST /api/reset-password` (FR-03) | `POST /api/checkout` (FR-08) | `POST /api/admin/import-products` (FR-16) |
| SV #3 | `POST /api/login` (FR-02) | `POST /api/apply-coupon` (FR-09) | `PUT /api/admin/orders/:id/status` (FR-18) |
| SV #4 | `POST /api/register` (FR-01) | `POST /api/apply-coupon` (FR-09) | `POST /api/products` (FR-15) |

> **BẰNG CHỨNG CÒN THIẾU — nói rõ để người chấm không phải đoán.** Bảng trên được lập từ 4 ảnh chat nhóm
> mà sinh viên đã xem, nhưng **ảnh chưa được lưu vào repo**, nên §5 hiện chỉ có *lời khai*, không có vật
> chứng. Cách đóng lại (2 phút): lưu 4 ảnh vào `bug-report/screenshots/group-api-registration-1..4.png`.
> Đây là mục **không script nào kiểm thay được** — nó là ảnh chụp cuộc trao đổi của nhóm.

## 2. Bộ 3 API của tôi

| Mã | Pool | FR | API chính | Endpoint hỗ trợ (setup / verify / cleanup) | Prefix test case |
|---|---|---|---|---|---|
| **API-01** | A | FR-05 Product listing & search | `GET /api/products?search=` | `GET /api/products/:id` | `TC-PRODLIST-###` |
| **API-02** | B | FR-07 Shopping cart | `POST /api/cart` | `GET /api/cart`, `POST /api/checkout`, `POST /api/login` | `TC-CART-###` |
| **API-03** | C | FR-15 Product management (admin) | `PUT /api/products/:id` | `POST /api/products`, `GET /api/products/:id`, `DELETE /api/products/:id` | `TC-PRODUPD-###` |

**Không trùng:** cả 3 endpoint chính đều chưa ai đăng ký, và bộ 3 khác hoàn toàn 4 thành viên trên.

## 3. Lý do chọn — đối chiếu source code thật

Số dòng trỏ tới `eshop-sut/backend/server.js` tại thời điểm chốt (18/08/2026). Đây là **giả thuyết
bug rút từ đọc code**, chưa phải bug đã xác nhận — mọi mục dưới đây **phải chạy request thật để
kiểm chứng** trước khi đưa vào `bug-report/bug-report.md`.

### API-01 — `GET /api/products` (server.js:141–157)

| Chất liệu test | Chi tiết |
|---|---|
| Domain partition | `search`: thiếu param · rỗng · 1 ký tự · khớp hoa/thường · tiếng Việt có dấu · khoảng trắng · rất dài · wildcard `%` `_` · ký tự đặc biệt |
| Security | Query **nối chuỗi** `WHERE name LIKE '%${searchQuery}%'` → nghi vi phạm **SEC-05** (parameterized query) và mở đường **SQL injection** |
| Schema validation | Nhánh lỗi trả **HTML** `<h1>Database Error</h1><p>…</p>` thay vì JSON → sai schema + nghi rò rỉ thông tin nội bộ |
| Endpoint verify | `GET /api/products/:id` (:159–164): id không tồn tại trả **200 `{}`** (nghi phải 404); `row.id % 2 === 0` → `price` bị `toString()` → **kiểu dữ liệu đổi theo id** |

### API-02 — `POST /api/cart` (server.js:290–295)

| Chất liệu test | Chi tiết |
|---|---|
| Domain partition | 4 tham số body: `id`, `name`, `price`, `quantity` (âm · 0 · thập phân · chuỗi · thiếu field · field lạ) |
| Security | `userCarts[userId].push(req.body)` — **không validate**: client tự gửi `price` → nghi **price tampering**; nghi **mass assignment**; cần kiểm cách ly giỏ giữa 2 user (IDOR) và **SEC-02** (bắt buộc JWT) |
| State transition | empty → add → `GET /api/cart` → `POST /api/checkout` → giỏ **có được xoá không**? (checkout ở :297 chỉ `INSERT` vào `orders`) · thêm cùng sản phẩm 2 lần → cộng dồn hay 2 dòng? |
| Ghi chú | Giỏ lưu **in-memory** theo `userId` → không bền qua restart; test phải tự tạo state, không giả định DB |

### API-03 — `PUT /api/products/:id` (server.js:179–189)

| Chất liệu test | Chi tiết |
|---|---|
| Security | Route **không gắn** middleware `authenticateToken` → nghi vi phạm **SEC-02** (bắt buộc JWT) và **SEC-03** (kiểm `role='admin'`), tức role escalation. So sánh: `POST /api/categories` (:249) *có* `authenticateToken` |
| Domain partition | 5 field body (`name`, `price`, `description`, `imageUrl`, `category_id`) + path `:id` → dư chất liệu cho ≥35 case |
| Schema / hợp lý nghiệp vụ | Thiếu field → ghi **NULL đè** dữ liệu cũ (không partial update) · không thấy validate `price > 0` / `price` kiểu chuỗi / `name` rỗng / `category_id` không tồn tại |
| State | `id` không tồn tại vẫn trả **200 "Product updated"** (không dùng `this.changes`, nghi thiếu 404) — kiểm bằng `GET /api/products/:id` sau khi PUT |

## 4. Vì sao không chọn phương án khác

| Phương án | Vì sao loại |
|---|---|
| `DELETE /api/admin/users/:id` (FR-19, :504) | Bug security mạnh (không kiểm `role`, luôn trả 200) và **không trùng FR** với ai — nhưng **chỉ 1 tham số** (`:id`), yếu đúng ở tiêu chí "domain partition trên *mọi* tham số" của §6. Giữ làm **phương án dự phòng** nếu cần tránh trùng cả FR |
| `GET /api/orders/:id` (FR-11, :344) | Không có `authenticateToken` → IDOR rất đáng test, nhưng cũng chỉ 1 tham số. **Dự phòng cho Pool B** |
| `POST /api/categories` (FR-14, :249) | Chỉ 1 field `name` |

**Rủi ro đã biết và cách xử lý:** API-01 (FR-05) và API-03 (FR-15) cùng thao tác trên bảng
`products`, và SV #4 đã lấy `POST /api/products` — *cùng FR-15, khác endpoint/verb*. §5 chỉ cấm
**trùng bộ 3 API**, nên bộ này hợp lệ. Lợi ích kèm theo: API-03 dùng luôn `POST /api/products` để
tạo dữ liệu test rồi `DELETE` để dọn, nên phần setup của hai API dùng chung được. Nếu giảng viên
yêu cầu tách cả FR, đổi API-03 sang `DELETE /api/admin/users/:id` theo bảng dự phòng ở §4.

## 5. Checklist chốt lựa chọn

- [x] 3 API, mỗi pool 1 API (A / B / C)
- [x] Không trùng endpoint chính với 4 thành viên đã đăng ký
- [x] Lý do chọn rút từ source code thật, có số dòng
- [ ] **Ảnh chụp chat nhóm** → `bug-report/screenshots/group-api-registration-*.png` — **CHƯA CÓ**, và đây
      là bằng chứng duy nhất cho §5 *"not duplicated among the members of your group"*
- [x] Đã đối chiếu 4 bộ API của thành viên khác (qua chat nhóm ngày 18/08) trước khi chốt — bảng §1 là
      kết quả đối chiếu đó
