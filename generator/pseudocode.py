#!/usr/bin/env python3
"""
Pseudocode cho AI-driven API Test Generator (§7) — 6 giai đoạn của generator/design.md §3.

ĐÂY LÀ PSEUDOCODE mô tả thiết kế. Bản CHẠY ĐƯỢC là tools/gen-artifacts.mjs (đã sinh ra toàn bộ
136 test case của bài này) và .claude/skills/api-test-design/SKILL.md.

Quy ước đọc: DECIDE: = chỗ người thiết kế phải quyết định, và đã quyết định thế nào.
"""

SEC_RULES = ["SEC-01", "SEC-02", "SEC-03", "SEC-04", "SEC-05", "SEC-06", "SEC-07"]
PARTITION_KINDS = ["hợp lệ điển hình", "biên dưới", "biên dưới - 1", "biên trên", "rỗng",
                   "thiếu hẳn", "sai kiểu", "quá dài", "ký tự đặc biệt", "Unicode/có dấu",
                   "ký tự đặc biệt của tầng dưới (% _ ' cho LIKE/SQL)"]
AUTH_PARTITIONS = ["không header", "sai định dạng", "thiếu Bearer", "header rỗng",
                   "token rác", "sai chữ ký", "token user thường", "token admin"]


def generate(spec, fr_sec, source_code, api):
    # ── Giai đoạn 1: parse 3 nguồn, KHÔNG chỉ 1 ─────────────────────────────
    params = parse_params(spec, api)              # nơi truyền · kiểu · bắt buộc
    params += [Param("Authorization", where="header", kinds=AUTH_PARTITIONS)]
    silent = find_spec_silence(spec, params)      # spec KHÔNG nói gì về cái gì
    behaviour = read_source(source_code, api)     # hành vi thật + dòng code

    # ── Giai đoạn 2: suy ràng buộc ──────────────────────────────────────────
    rules, open_questions = [], []
    for p in params:
        r = infer_rule(p, spec, fr_sec)
        # DECIDE: spec im lặng thì làm gì?
        #   KHÔNG bịa expected. Hai lựa chọn hợp lệ:
        #     (a) suy từ FR/SEC và ghi rõ suy từ đâu vào cột `Căn cứ`;
        #     (b) chỉ khẳng định phần spec bảo đảm (status + schema).
        #   Một expected không căn cứ sẽ sinh ra BUG GIẢ — lỗi tệ nhất của bộ test.
        if p in silent and not derivable_from(fr_sec, p):
            r = weaken_to_spec_guarantee(r)
            open_questions.append(p)
        rules.append(r)

    # ── Giai đoạn 3: sinh case theo 4 nhóm — 4 LƯỢT RIÊNG, không gộp ────────
    cases = []
    for p in params:                                    # 3a. domain
        for kind in p.kinds or PARTITION_KINDS:
            cases.append(make_case(p, kind, rules, basis=cite(spec, fr_sec, p)))
    for flow in enumerate_state_flows(api, fr_sec):     # 3b. state
        cases += make_sequence(flow)                    # mutate + VERIFY ngay sau
    for sec in SEC_RULES:                               # 3c. security
        if in_scope(sec, api):
            cases += make_security_cases(sec, api)
            cases += make_impact_verification(sec, api) # bắt buộc: chứng minh tác động
        else:
            note_out_of_scope(sec)                      # ghi rõ, KHÔNG nhận vơ
    cases += make_schema_cases(spec_response_shape(spec, api))   # 3d. schema

    # ── Giai đoạn 4: khử trùng, xếp thứ tự, gán folder ──────────────────────
    cases = dedupe(cases)
    cases = order_by_dependency(cases)      # case verify đứng NGAY SAU case mutate
    # DECIDE: case nào có thể GIẾT SUT?
    #   Chuỗi (PUT partial → price NULL) + (GET id chẵn → price.toString()) làm chết tiến trình.
    #   Nếu để trong collection: mọi case sau đỏ vì MÔI TRƯỜNG, không vì bug → bộ test tự phá
    #   giá trị chứng minh của chính nó. Vì vậy: loại khỏi collection, chuyển sang script tái
    #   hiện riêng có khởi động lại SUT.
    fatal = [c for c in cases if kills_service(c, behaviour)]
    cases = [c for c in cases if c not in fatal]
    emit_standalone_repro(fatal)

    # DECIDE: tiêu chí "đủ" là gì?
    #   KHÔNG phải số case (đề đòi ≥35). Dựng ma trận phủ (tham số × loại phân vùng) và báo
    #   Ô CÒN TRỐNG. 35 case bỏ cả nhóm security thì kém 35 case phủ đều.
    report_coverage_matrix(cases, params, PARTITION_KINDS)

    # ── Giai đoạn 5: sinh artefact từ MỘT nguồn ─────────────────────────────
    md_generated = render_table(c for c in cases if c.src == "AI")
    md_audit     = render_table(cases_with_audit_labels(cases))
    md_extended  = render_table(c for c in cases if c.src == "SV") + why_ai_missed_table(cases)
    collection   = render_postman(cases, prerequest=X_STUDENT_ID_SCRIPT)
    return md_generated, md_audit, md_extended, collection, open_questions


def feedback_loop(collection, baseline):
    """Giai đoạn 6 — chạy rồi phân loại, KHÔNG tự kết luận."""
    run = newman_run(collection)
    for failure in run.failures:
        # DECIDE: đỏ vì SUT sai, vì test viết sai, hay vì môi trường?
        #   Không tự động phân loại được → gợi ý bằng chứng cần thu (response thật, dòng code
        #   liên quan, trạng thái sau khi đọc lại) rồi ĐƯA CHO NGƯỜI.
        #   Ở bài này 4 assertion đỏ đầu tiên thuộc hai loại sau — nếu tự động kết luận thì
        #   chúng đã thành 4 "bug" giả trong báo cáo.
        classify_for_human(failure)
    return compare_with(baseline)     # đỏ tăng = hồi quy mới; đỏ giảm = SUT sửa HOẶC test yếu đi
