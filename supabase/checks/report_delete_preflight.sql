-- Read-only checks on the LMS database BEFORE applying the new RPC.
-- Review triggers for existing refund logic, RLS, cascades, auth_id and generated balances.
SELECT table_name, column_name, data_type, is_generated, generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('users', 'leave_requests', 'user_policies', 'approval_steps', 'attachments')
ORDER BY table_name, ordinal_position;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('users', 'leave_requests', 'user_policies', 'approval_steps', 'attachments');

SELECT c.conrelid::regclass AS child_table, c.confrelid::regclass AS parent_table, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c WHERE c.contype = 'f' AND c.confrelid = 'public.leave_requests'::regclass;

SELECT t.tgrelid::regclass AS table_name, t.tgname, pg_get_triggerdef(t.oid), pg_get_functiondef(t.tgfoid)
FROM pg_trigger t WHERE NOT t.tgisinternal AND t.tgrelid IN (
  'public.leave_requests'::regclass, 'public.user_policies'::regclass, 'public.approval_steps'::regclass, 'public.attachments'::regclass
);

SELECT p.proname, pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('get_next_leave_request_id', 'lms_delete_report_requests', 'get_user_role');

-- Aggregate diagnostics only; no employee names or request contents.
SELECT status, count(*) AS requests, count(*) FILTER (WHERE policy_id IS NULL) AS without_policy_id
FROM public.leave_requests GROUP BY status;
