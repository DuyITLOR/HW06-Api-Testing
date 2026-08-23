# Traceability matrix — yêu cầu ↔ test case ↔ bug

Cột cuối trống là một **lỗ hổng phủ**, không phải ô chưa kịp điền. Số liệu test case lấy từ
`generator/specs/*.mjs` (nguồn sinh ra cả bảng lẫn collection); số liệu kết quả lấy từ
[`summary.md`](summary.md).

| Yêu cầu | Nguồn | API | Test case phủ | Bug tìm được (kèm Issue) |
|---|---|---|---|---|
| **FR-05** Product listing & search | README SUT · spec §3.1 | API-01 | 48 case (`TC-PRODLIST-001…205`) | [BUG-01](https://github.com/DuyITLOR/group05_eshop/issues/323), 02, 05, 06 |
| **FR-06** Product detail view | spec §3.2 | API-01 (endpoint verify) | TC-PRODLIST-023, 032…036, 107 | [BUG-03](https://github.com/DuyITLOR/group05_eshop/issues/325), [BUG-04](https://github.com/DuyITLOR/group05_eshop/issues/326) |
| **FR-07** Shopping cart | README SUT · spec §4.2 | API-02 | 46 case (`TC-CART-001…107`) | [BUG-07](https://github.com/DuyITLOR/group05_eshop/issues/329), 08, 10, 11, 12 |
| **FR-08** Checkout | spec §4.3 | API-02 (endpoint verify) | TC-CART-028, 029, 103 | [BUG-09](https://github.com/DuyITLOR/group05_eshop/issues/331) |
| **FR-15** Product management (CRUD) | README SUT · spec §3.3 | API-03 | 47 case (`TC-PRODUPD-001…108`) | [BUG-13](https://github.com/DuyITLOR/group05_eshop/issues/335), 14, 15, 16, 17, 18 |
| **SEC-01** Mật khẩu không lưu plaintext | README SUT | *(ngoài phạm vi 3 API — quan sát qua `GET /api/users/me` khi dựng setup)* | `verify-bugs.sh 19` | **[BUG-19](https://github.com/DuyITLOR/group05_eshop/issues/341)** |
| **SEC-02** API bảo mật đòi JWT hợp lệ | README SUT | API-02, API-03 | TC-CART-031…034, 039 · TC-PRODUPD-031, 033, 034, 101, 107, 108 | **[BUG-13](https://github.com/DuyITLOR/group05_eshop/issues/335)** (API-03). API-02 **đạt** |
| **SEC-03** API admin phải kiểm `role='admin'` | README SUT | API-03 | TC-PRODUPD-032, 102, 103 | **[BUG-13](https://github.com/DuyITLOR/group05_eshop/issues/335)** |
| **SEC-04** Escape dữ liệu người dùng | README SUT | API-01, API-02, API-03 | TC-PRODLIST-028 · TC-PRODUPD-006, 007 · **TC-CART-204/205** · **TC-PRODUPD-201/202** | **R-02** (payload `<script>` lưu nguyên trong giỏ — *rủi ro*, không phải bug: SEC-04 nói escape **khi hiển thị**) · **BUG-24** (`imageUrl: javascript:` lưu nguyên — thiếu validate scheme, không phải vấn đề escape) — hai case do sinh viên chọn |
| **SEC-05** Parameterized query | README SUT | API-01, API-02, API-03 | TC-PRODLIST-024…027, 104, 105, 106 · TC-CART-035 · TC-PRODUPD-024, 025 | **[BUG-01](https://github.com/DuyITLOR/group05_eshop/issues/323)**, **[BUG-02](https://github.com/DuyITLOR/group05_eshop/issues/324)**, [BUG-06](https://github.com/DuyITLOR/group05_eshop/issues/328). `:id` của API-03 **đạt** (đã kiểm, không phải giả định) |
| **SEC-06** Không cho client đặt field ngoài đặc tả | README SUT | API-02, API-03 (dạng mass assignment) | TC-CART-036, 104 · TC-PRODUPD-035, 036 | **[BUG-10](https://github.com/DuyITLOR/group05_eshop/issues/332)** (API-02). API-03 **đạt** (`:id` URL là nguồn duy nhất) |
| **SEC-07** OTP đủ entropy, có hạn, dùng một lần | README SUT | – **ngoài phạm vi** (thuộc `POST /api/forgot-password`, thành viên khác đăng ký) | – | – |
| **Schema** response khớp spec | Đề §6.1 | cả 3 API | 23 case trong các folder `40-schema` | [BUG-02](https://github.com/DuyITLOR/group05_eshop/issues/324), 03, 04, 12, 18 |
| **State transition** | Đề §6.1 | cả 3 API | 18 case (`20-state-*`) | [BUG-09](https://github.com/DuyITLOR/group05_eshop/issues/331), 11, 17 và **[BUG-14](https://github.com/DuyITLOR/group05_eshop/issues/336)** (chuỗi 3 lỗi) |
| `X-Student-Id` trên **mọi** request (§6.4) | Đề §6.4, §11 | cả 3 API | pre-request cấp collection — 171/171 request | – (kiểm bằng `verify-all.sh` mục 1) |

## Lỗ hổng trong chính danh sách yêu cầu

**SEC-01…SEC-07 không có mục nào về toàn vẹn giá / tiền.** BUG-08 (price tampering — client tự đặt giá,
Critical) vì vậy không map được vào bất kỳ SEC nào; nó chỉ dựa vào FR-07 + FR-08. Hai case bắt được nó
(`TC-CART-101`, `TC-CART-102`) được ghi nhãn `Security (ngoài SEC-01…07)` thay vì gán bừa vào một SEC gần
đúng. Phát hiện này đến từ `tools/check-cases.mjs` — script đòi mọi case nhóm Security phải trỏ được vào
một SEC-0x, và hai case này không trỏ được.

Đề nghị cho SUT: thêm một mục SEC về *"giá và tổng tiền phải được server tính từ dữ liệu server, không
nhận từ client"*.

## Ô cần đọc kỹ

- **SEC-04**: không có bug ở tầng API **không** nghĩa là SUT an toàn với XSS. `POST`/`PUT /api/products` nhận
  và lưu `<script>alert(1)</script>` nguyên văn (TC-PRODUPD-006); rủi ro hiện thực hoá ở frontend nếu nó
  dùng `innerHTML`. Bài này chỉ kết luận trong phạm vi API và ghi rõ như vậy.
- **SEC-07** là ô trống có lý do (endpoint của thành viên khác), không phải bỏ sót.
