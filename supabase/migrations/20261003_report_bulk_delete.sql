-- LMS only. Applied to jkndpfqefprfrnftqqxs via SQL Editor on 2026-10-03 after user approval.
-- Adds one RPC; does not change the existing LEV generator or table RLS policies.
BEGIN;

-- Fail rather than deploy a function that would strand approval/attachment rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f' AND c.conrelid = 'public.approval_steps'::regclass
      AND c.confrelid = 'public.leave_requests'::regclass AND a.attname = 'request_id' AND c.confdeltype = 'c'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f' AND c.conrelid = 'public.attachments'::regclass
      AND c.confrelid = 'public.leave_requests'::regclass AND a.attname = 'request_id' AND c.confdeltype = 'c'
  ) THEN
    RAISE EXCEPTION 'Required cascading foreign keys are missing; review live schema before installing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgenabled <> 'D' AND (
      (tgrelid IN ('public.leave_requests'::regclass, 'public.approval_steps'::regclass, 'public.attachments'::regclass) AND (tgtype::integer & 8) <> 0)
      OR (tgrelid = 'public.user_policies'::regclass AND (tgtype::integer & 16) <> 0)
    )
  ) THEN
    RAISE EXCEPTION 'Existing deletion/quota triggers need review before installing explicit refunds';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_delete_report_requests(p_request_ids text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ids text[];
  v_found integer;
  v_request public.leave_requests%ROWTYPE;
  v_policy public.user_policies%ROWTYPE;
  v_policy_id uuid;
  v_charge_year integer;
  v_refunds jsonb := '{}'::jsonb;
  v_refund record;
  v_amount numeric;
  v_policies jsonb := '[]'::jsonb;
  v_deleted text[];
BEGIN
  -- Never trust a user id or role provided by the browser.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'SuperAdmin'
  ) THEN
    RAISE EXCEPTION 'เฉพาะ Super admin เท่านั้นที่ลบรายการจากรายงานได้' USING ERRCODE = '42501';
  END IF;
  IF p_request_ids IS NULL OR cardinality(p_request_ids) = 0 OR EXISTS (
    SELECT 1 FROM unnest(p_request_ids) id WHERE id IS NULL OR btrim(id) = ''
  ) THEN
    RAISE EXCEPTION 'กรุณาเลือกรายการที่ต้องการลบ' USING ERRCODE = '22023';
  END IF;
  SELECT array_agg(DISTINCT id ORDER BY id) INTO v_ids FROM unnest(p_request_ids) id;

  -- Lock requests in a stable order. A repeated/stale selection must never refund twice.
  PERFORM r.id FROM public.leave_requests r WHERE r.id = ANY(v_ids) ORDER BY r.id FOR UPDATE;
  SELECT count(*) INTO v_found FROM public.leave_requests WHERE id = ANY(v_ids);
  IF v_found <> cardinality(v_ids) THEN
    RAISE EXCEPTION 'บางรายการถูกลบแล้ว กรุณาโหลดรายงานใหม่และเลือกอีกครั้ง' USING ERRCODE = 'P0001';
  END IF;

  FOR v_request IN SELECT * FROM public.leave_requests WHERE id = ANY(v_ids) ORDER BY id LOOP
    -- Rejected/Cancelled requests have already released their quota.
    IF v_request.status NOT IN ('Pending', 'Approved') THEN CONTINUE; END IF;
    IF v_request.leave_duration IS NULL OR v_request.leave_duration < 0 THEN
      RAISE EXCEPTION 'จำนวนวันลาไม่ถูกต้อง: %', v_request.id;
    END IF;
    IF v_request.leave_duration = 0 THEN CONTINUE; END IF;

    v_policy_id := NULL;
    IF v_request.policy_id IS NOT NULL THEN
      SELECT id INTO v_policy_id FROM public.user_policies
      WHERE id = v_request.policy_id AND user_id = v_request.user_id AND leave_type = v_request.leave_type;
    ELSE
      -- Legacy createLeaveRequest does not populate policy_id and charges the current
      -- year at submission. Do NOT debit the current year when deleting old requests.
      -- Cross-year legacy requests/edits cannot prove the original charged year: fail closed.
      v_charge_year := extract(year FROM v_request.created_at AT TIME ZONE 'Asia/Bangkok')::integer;
      IF v_charge_year IS DISTINCT FROM extract(year FROM v_request.date_start)::integer
        OR v_charge_year IS DISTINCT FROM extract(year FROM v_request.date_end)::integer
        OR v_charge_year IS DISTINCT FROM extract(year FROM v_request.updated_at AT TIME ZONE 'Asia/Bangkok')::integer THEN
        RAISE EXCEPTION 'ใบลา % ไม่มีข้อมูลยืนยันโควตาปีที่ถูกหัก กรุณาตรวจสอบก่อนลบข้ามปี', v_request.id;
      END IF;
      SELECT id INTO v_policy_id FROM public.user_policies
      WHERE user_id = v_request.user_id AND leave_type = v_request.leave_type AND year = v_charge_year;
    END IF;
    IF v_policy_id IS NULL THEN
      RAISE EXCEPTION 'ไม่พบโควตาที่ตรงกับใบลา % กรุณาตรวจสอบก่อนลบ', v_request.id;
    END IF;
    v_refunds := jsonb_set(v_refunds, ARRAY[v_policy_id::text],
      to_jsonb(coalesce((v_refunds ->> v_policy_id::text)::numeric, 0) + v_request.leave_duration));
  END LOOP;

  -- Lock/group quota rows before updating; preserve max_days and any manual balance.
  FOR v_refund IN SELECT key, value FROM jsonb_each_text(v_refunds) ORDER BY key LOOP
    v_amount := v_refund.value::numeric;
    SELECT * INTO v_policy FROM public.user_policies WHERE id = v_refund.key::uuid FOR UPDATE;
    IF NOT FOUND OR v_policy.used_days < v_amount THEN
      RAISE EXCEPTION 'ยอดโควตาไม่สอดคล้องกับใบลาที่เลือก กรุณาตรวจสอบก่อนลบ';
    END IF;
    UPDATE public.user_policies SET used_days = used_days - v_amount
    WHERE id = v_policy.id RETURNING * INTO v_policy;
    -- remaining_days is a generated column in the existing schema.
    v_policies := v_policies || jsonb_build_array(to_jsonb(v_policy));
  END LOOP;

  WITH deleted AS (
    DELETE FROM public.leave_requests WHERE id = ANY(v_ids) RETURNING id
  ) SELECT array_agg(id ORDER BY id) INTO v_deleted FROM deleted;
  IF cardinality(v_deleted) IS DISTINCT FROM cardinality(v_ids) THEN
    RAISE EXCEPTION 'จำนวนรายการที่ลบไม่ตรงกับรายการที่เลือก';
  END IF;
  RETURN jsonb_build_object('deleted_ids', v_deleted, 'policies', v_policies);
END;
$$;

REVOKE ALL ON FUNCTION public.lms_delete_report_requests(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lms_delete_report_requests(text[]) TO authenticated;
COMMENT ON FUNCTION public.lms_delete_report_requests(text[]) IS
  'SuperAdmin report deletion: atomic quota refunds + cascading request deletion; no notifications or holiday deletion.';
COMMIT;
