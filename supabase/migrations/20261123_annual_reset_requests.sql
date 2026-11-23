-- LMS Annual Reset for New Year (1 January 2570 / 2027)
-- Adds:
--   1) RPC public.lms_reset_leave_requests_for_new_year(p_confirmation text)
--      Atomic SuperAdmin-only deletion of leave_requests (cascading to approval_steps and attachments)
--      without touching users, agencies, departments, leave_types, user_policies, holidays, day_of_week, or role_permissions.
--      Verifies get_next_leave_request_id() returns 'LEV-0001' after clearing requests.
--   2) Storage RLS DELETE policy on storage.objects for bucket 'attachments' restricted to SuperAdmin only
--      (does NOT touch bucket 'avatars').
BEGIN;

-- Preflight guard: fail installation if required cascading FKs are missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
      AND c.conrelid = 'public.approval_steps'::regclass
      AND c.confrelid = 'public.leave_requests'::regclass
      AND a.attname = 'request_id'
      AND c.confdeltype = 'c'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
      AND c.conrelid = 'public.attachments'::regclass
      AND c.confrelid = 'public.leave_requests'::regclass
      AND a.attname = 'request_id'
      AND c.confdeltype = 'c'
  ) THEN
    RAISE EXCEPTION 'Required cascading foreign keys on approval_steps/attachments are missing; review live schema before installing';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.lms_reset_leave_requests_for_new_year(p_confirmation text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expected_confirmation CONSTANT text := 'Reset เลขที่คำขอทั้งหมดเป็น LEV-0001';
  v_requests_count integer;
  v_steps_count integer;
  v_attachments_count integer;
  v_next_request_id text;
BEGIN
  -- 1. Enforce SuperAdmin role strictly from auth.uid() + public.users.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'SuperAdmin'
  ) THEN
    RAISE EXCEPTION 'เฉพาะ SuperAdmin เท่านั้นที่สามารถรีเซ็ตข้อมูลคำขอลาขึ้นปีใหม่ได้'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Enforce exact confirmation phrase on the database side as a second guard.
  IF p_confirmation IS DISTINCT FROM v_expected_confirmation THEN
    RAISE EXCEPTION 'คำยืนยันไม่ถูกต้อง กรุณาพิมพ์ข้อความยืนยันให้ตรงทุกตัวอักษร'
      USING ERRCODE = '22023';
  END IF;

  -- 3. Lock only leave request tables to prevent concurrent submissions/approvals mid-reset.
  LOCK TABLE public.leave_requests, public.approval_steps, public.attachments IN ACCESS EXCLUSIVE MODE;

  SELECT count(*) INTO v_requests_count FROM public.leave_requests;
  SELECT count(*) INTO v_steps_count FROM public.approval_steps;
  SELECT count(*) INTO v_attachments_count FROM public.attachments;

  -- 4. Delete all leave requests; approval_steps and attachments cascade automatically.
  -- Master/config/quota tables (users, agencies, departments, leave_types, user_policies, holidays, day_of_week, role_permissions) are untouched.
  DELETE FROM public.leave_requests;

  -- 5. Verify next generated request ID restarts at LEV-0001.
  IF to_regprocedure('public.get_next_leave_request_id()') IS NOT NULL THEN
    SELECT public.get_next_leave_request_id() INTO v_next_request_id;
    IF v_next_request_id IS DISTINCT FROM 'LEV-0001' THEN
      RAISE EXCEPTION 'ไม่สามารถรีเซ็ตเลขที่คำขอลาให้เริ่มที่ LEV-0001 ได้ (ค่าที่ได้: %)', COALESCE(v_next_request_id, 'NULL')
        USING ERRCODE = 'P0001';
    END IF;
  ELSE
    v_next_request_id := 'LEV-0001';
  END IF;

  RETURN jsonb_build_object(
    'deleted_requests', v_requests_count,
    'deleted_approval_steps', v_steps_count,
    'deleted_attachments', v_attachments_count,
    'next_request_id', v_next_request_id,
    'reset_at', timezone('utc'::text, now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.lms_reset_leave_requests_for_new_year(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lms_reset_leave_requests_for_new_year(text) TO authenticated;
COMMENT ON FUNCTION public.lms_reset_leave_requests_for_new_year(text) IS
  'SuperAdmin annual reset: atomically clears leave_requests (cascading approval_steps & attachments) so IDs restart at LEV-0001 without touching master data, quotas, or settings.';

-- Allow only SuperAdmin to delete objects inside the 'attachments' storage bucket (never 'avatars').
DROP POLICY IF EXISTS "Allow SuperAdmin delete attachments" ON storage.objects;
CREATE POLICY "Allow SuperAdmin delete attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.auth_id = auth.uid()
        AND u.role = 'SuperAdmin'
    )
  );

COMMIT;
