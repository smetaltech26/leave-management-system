-- Read-only preflight checks on the LMS database BEFORE applying 20261123_annual_reset_requests.sql.
-- 1. Inspect live definition of get_next_leave_request_id() to verify it returns 'LEV-0001' when leave_requests is empty.
SELECT p.proname, pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('get_next_leave_request_id', 'lms_reset_leave_requests_for_new_year');

-- 2. Verify cascading foreign keys referencing public.leave_requests.
SELECT c.conrelid::regclass AS child_table,
       c.confrelid::regclass AS parent_table,
       c.confdeltype,
       pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.contype = 'f'
  AND c.confrelid = 'public.leave_requests'::regclass
ORDER BY child_table::text;

-- 3. Verify there are no unexpected custom DELETE triggers on leave tables or UPDATE triggers on user_policies.
SELECT t.tgrelid::regclass AS table_name,
       t.tgname,
       t.tgenabled,
       pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
WHERE NOT t.tgisinternal
  AND t.tgrelid IN (
    'public.leave_requests'::regclass,
    'public.approval_steps'::regclass,
    'public.attachments'::regclass,
    'public.user_policies'::regclass
  )
ORDER BY table_name::text, t.tgname;

-- 4. Inspect existing RLS policies on storage.objects (confirm buckets 'attachments' vs 'avatars').
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- 5. Current aggregate row/object counts (read-only snapshot).
SELECT
  (SELECT count(*) FROM public.leave_requests) AS leave_requests_count,
  (SELECT count(*) FROM public.approval_steps) AS approval_steps_count,
  (SELECT count(*) FROM public.attachments) AS attachments_rows_count,
  (SELECT count(*) FROM storage.objects WHERE bucket_id = 'attachments') AS storage_attachments_files,
  (SELECT count(*) FROM storage.objects WHERE bucket_id = 'avatars') AS storage_avatars_files;
