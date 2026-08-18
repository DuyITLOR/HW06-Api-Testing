# CI/CD Report — HW06 (§6, §14)

- **Sinh viên:** Lê Nhựt Duy — **MSSV:** 23127178
- **Pipeline:** [`.github/workflows/api-tests.yml`](../.github/workflows/api-tests.yml)
- **Trạng thái:** pipeline đã viết xong và **cổng đã được kiểm chứng bằng lượt chạy local thật**
  (§2.1 dưới đây). **Chưa chạy trên GitHub Actions** vì cần push lên repo — việc còn lại #4 trong README.

## 1. Cấu hình pipeline

| Mục | Giá trị |
|---|---|
| Trigger | `push` vào `main` khi đổi `postman/**`, `tools/run-newman.sh`, `tools/ci-gate.mjs`, `ci/expected-failures.json`, workflow · `workflow_dispatch` (chọn `gate_mode`) |
| Runner | `ubuntu-latest`, timeout 15 phút, `concurrency: api-tests` (không chạy song song vì tranh cổng 3000 và cùng `database.sqlite`) |
| SUT | checkout `ttbhanh/eshop-sut` ngay trong job → `node server.js` → chờ tối đa 40s tới khi `GET /api/products` trả 200 |
| Dữ liệu test | `node tools/seed-api-data.mjs` (fixture + CSV data-driven) |
| Chạy test | `newman run` cho 3 collection, reporter `cli,json,htmlextra` |
| **Cổng đỏ/xanh** | `node tools/ci-gate.mjs` — so số assertion đỏ với baseline [`ci/expected-failures.json`](expected-failures.json); `gate_mode=strict` thì đỏ khi có **bất kỳ** assertion đỏ |
| Bằng chứng | upload artifact `newman-<mode>-<run#>`: HTML + JSON + `sut.log`, giữ 30 ngày, `if: always()` |

## 2. Vì sao cổng không dùng exit code của Newman

Bộ test này cố ý bắt bug thật của SUT, nên số assertion đỏ ở trạng thái bình thường **lớn hơn 0**.
Lấy "0 đỏ" làm cổng thì pipeline đỏ vĩnh viễn: mọi lượt đỏ như nhau, và **hồi quy mới không còn phân
biệt được với bug cũ** — tức cổng mất hết tác dụng. Baseline chuyển câu hỏi thành *"số đỏ có đúng như
đã ký nhận không"*: đỏ tăng = hồi quy mới, đỏ giảm = SUT đã sửa **hoặc test của mình yếu đi**, cả hai
đều cần người xem lại.

## 2.1 Cổng đã được kiểm chứng bằng lượt chạy local (bằng chứng)

```
$ node tools/ci-gate.mjs reports/newman/*.json

══ Cổng CI ══════════════════════════════════════════════════════════════
  [XANH]  api-01-products-search: 29/155 đỏ, khớp baseline (29)
  [XANH]  api-02-cart-add: 30/81 đỏ, khớp baseline (30)
  [XANH]  api-03-product-update: 30/93 đỏ, khớp baseline (30)

  Build XANH.
```

Cùng dữ liệu đó với `--strict` (chế độ tạo lượt ĐỎ mẫu):

```
$ node tools/ci-gate.mjs reports/newman/*.json --strict
  [DO]  api-01-products-search: 29/155 assertion đỏ (chế độ --strict)
  ...
  Build ĐỎ — 3 mục không đạt.
```

Tức hai nhánh của cổng đều đã chạy thật, chỉ còn thiếu **hai lượt trên runner của GitHub**.

## 3. Hai lượt mẫu (§6 bắt buộc) — việc còn lại

| Lượt | Cách tạo | `gate_mode` | Kết quả mong đợi | Commit | Link run | Ảnh |
|---|---|---|---|---|---|---|
| **Tất cả pass** | `git push` (workflow tự chạy khi đổi `postman/**`) | `baseline` | **XANH** — 29/30/30 khớp baseline | | | |
| **Có test fail** | `gh workflow run api-tests.yml -f gate_mode=strict` | `strict` | **ĐỎ** — 89 assertion đỏ | | | |

Sau khi chạy, điền: hash commit · link `https://github.com/DuyITLOR/HW06-Api-Testing/actions/runs/<id>` ·
ảnh lưu ở `bug-report/screenshots/ci-xanh.png` và `ci-do.png`.

**Dự đoán ghi trước khi chạy** (để đối chiếu, kiểu Task 3 của HW05): runner dùng `database.sqlite` **sạch**
trong repo SUT, còn local đã khởi động lại SUT nên cũng sạch → **kỳ vọng khớp baseline 29/30/30**. Nếu lệch,
nguyên nhân đầu tiên cần kiểm là **dữ liệu seed** (số sản phẩm ban đầu khác nhau làm các assertion đếm dòng
lệch), không phải code test. Ghi lại kết quả thật vào §4 kể cả khi dự đoán sai.

## 4. Chênh lệch giữa lượt CI và lượt local (điền sau)

DB trên runner là `database.sqlite` sạch trong repo SUT, khác DB local đã seed nhiều lần → số sản phẩm
khác, nên các assertion dựa vào **số dòng** phải viết theo kiểu tương đối (so trước/sau) chứ không
hard-code. Ghi lại ở đây mọi chỗ phải sửa vì lý do này.
