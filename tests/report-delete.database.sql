-- psql regression script. ONLY an empty disposable database named lms_report_delete_test*.
-- NOT for the Supabase SQL Editor or any production database. No production data is used.
-- Run: psql -v ON_ERROR_STOP=1 -d lms_report_delete_test -f tests/report-delete.database.sql
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() NOT LIKE 'lms_report_delete_test%' OR to_regclass('public.leave_requests') IS NOT NULL THEN
    RAISE EXCEPTION 'Use a NEW empty disposable database named lms_report_delete_test*';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE TABLE public.users (id text PRIMARY KEY, auth_id uuid, role text);
CREATE TABLE public.user_policies (
  id uuid PRIMARY KEY, user_id text REFERENCES public.users(id), leave_type text,
  year integer, max_days numeric NOT NULL, used_days numeric NOT NULL,
  remaining_days numeric GENERATED ALWAYS AS (max_days - used_days) STORED,
  UNIQUE(user_id, leave_type, year)
);
CREATE TABLE public.leave_requests (
  id text PRIMARY KEY, user_id text REFERENCES public.users(id), leave_type text,
  policy_id uuid REFERENCES public.user_policies(id), status text,
  date_start date, date_end date, created_at timestamptz, updated_at timestamptz, leave_duration numeric NOT NULL
);
CREATE TABLE public.approval_steps (id text PRIMARY KEY, request_id text REFERENCES public.leave_requests(id) ON DELETE CASCADE);
CREATE TABLE public.attachments (id text PRIMARY KEY, request_id text REFERENCES public.leave_requests(id) ON DELETE CASCADE);
\ir ../supabase/migrations/20261003_report_bulk_delete.sql

BEGIN;
INSERT INTO public.users VALUES
  ('root', '00000000-0000-4000-8000-000000000001', 'SuperAdmin'),
  ('manager', '00000000-0000-4000-8000-000000000002', 'Admin'),
  ('worker', '00000000-0000-4000-8000-000000000003', 'User');
INSERT INTO public.user_policies (id, user_id, leave_type, year, max_days, used_days) VALUES
  ('10000000-0000-4000-8000-000000000001', 'worker', 'Annual', 2026, 30, 4.5),
  ('10000000-0000-4000-8000-000000000002', 'worker', 'Annual', 2027, 30, 2);
INSERT INTO public.leave_requests VALUES
  ('A', 'worker', 'Annual', NULL, 'Approved', '2026-09-01', '2026-09-02', '2026-08-01', '2026-08-01', 2),
  ('P', 'worker', 'Annual', NULL, 'Pending', '2026-09-03', '2026-09-03', '2026-08-01', '2026-08-01', 0.5),
  ('R', 'worker', 'Annual', NULL, 'Rejected', '2026-09-04', '2026-09-04', '2026-08-01', '2026-08-01', 1),
  ('C', 'worker', 'Annual', NULL, 'Cancelled', '2026-09-04', '2026-09-04', '2026-08-01', '2026-08-01', 1),
  ('KEEP', 'worker', 'Annual', NULL, 'Approved', '2026-09-05', '2026-09-06', '2026-08-01', '2026-08-01', 2);
INSERT INTO public.approval_steps VALUES ('step', 'A');
INSERT INTO public.attachments VALUES ('file', 'A');

DO $$ DECLARE result jsonb; BEGIN
  IF has_function_privilege('anon', 'public.lms_delete_report_requests(text[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous execute must be revoked';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM public.lms_delete_report_requests(ARRAY['A']);
    RAISE EXCEPTION 'Unauthenticated caller was allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
  BEGIN
    PERFORM public.lms_delete_report_requests(ARRAY['A']);
    RAISE EXCEPTION 'Admin caller was allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
  result := public.lms_delete_report_requests(ARRAY['A','P','R','C','A']);
  IF jsonb_array_length(result->'deleted_ids') <> 4 THEN RAISE EXCEPTION 'Deleted ID count mismatch'; END IF;
  IF (SELECT used_days FROM public.user_policies WHERE year=2026) <> 2 THEN RAISE EXCEPTION 'Refund double-counted or wrong'; END IF;
  IF (SELECT used_days FROM public.user_policies WHERE year=2027) <> 2 THEN RAISE EXCEPTION 'Refund touched new year'; END IF;
  IF EXISTS (SELECT 1 FROM public.approval_steps) OR EXISTS (SELECT 1 FROM public.attachments) THEN RAISE EXCEPTION 'Cascade failed'; END IF;
  BEGIN
    PERFORM public.lms_delete_report_requests(ARRAY['A','KEEP']);
    RAISE EXCEPTION 'Expected stale selection failure' USING ERRCODE='23514';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  IF NOT EXISTS (SELECT 1 FROM public.leave_requests WHERE id='KEEP') THEN RAISE EXCEPTION 'Stale selection partially deleted'; END IF;

  INSERT INTO public.leave_requests VALUES ('AMBIGUOUS', 'worker', 'Annual', NULL, 'Approved', '2027-01-01', '2027-01-01', '2026-12-01', '2026-12-01', 1);
  BEGIN
    PERFORM public.lms_delete_report_requests(ARRAY['AMBIGUOUS','KEEP']);
    RAISE EXCEPTION 'Expected cross-year failure' USING ERRCODE='23514';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  IF (SELECT used_days FROM public.user_policies WHERE year=2026) <> 2 THEN RAISE EXCEPTION 'Failed transaction changed quota'; END IF;
  -- Explicit policy_id resolves which year was actually charged; preserve manual offset.
  UPDATE public.leave_requests SET policy_id='10000000-0000-4000-8000-000000000001' WHERE id='AMBIGUOUS';
  UPDATE public.user_policies SET used_days=used_days+1 WHERE year=2026;
  PERFORM public.lms_delete_report_requests(ARRAY['AMBIGUOUS']);
  IF (SELECT used_days FROM public.user_policies WHERE year=2026) <> 2 THEN RAISE EXCEPTION 'Explicit policy refund wrong'; END IF;

  -- A downstream failure must roll back the refund AND deletion.
  CREATE TABLE public.test_blocker (request_id text REFERENCES public.leave_requests(id));
  INSERT INTO public.test_blocker VALUES ('KEEP');
  BEGIN
    PERFORM public.lms_delete_report_requests(ARRAY['KEEP']);
    RAISE EXCEPTION 'Expected FK failure' USING ERRCODE='23514';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  IF (SELECT used_days FROM public.user_policies WHERE year=2026) <> 2 THEN RAISE EXCEPTION 'Refund was not rolled back'; END IF;
  DELETE FROM public.test_blocker;
  UPDATE public.user_policies SET used_days=1 WHERE year=2026;
  BEGIN
    PERFORM public.lms_delete_report_requests(ARRAY['KEEP']);
    RAISE EXCEPTION 'Expected insufficient balance failure' USING ERRCODE='23514';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  IF NOT EXISTS (SELECT 1 FROM public.leave_requests WHERE id='KEEP') THEN RAISE EXCEPTION 'Inconsistent quota permitted deletion'; END IF;
  RAISE NOTICE 'PASS: auth, duplicates, mixed statuses, year isolation, half days, cascades, stale selection, ambiguous years, explicit policy, atomic rollback, insufficient quota';
END $$;
ROLLBACK;
