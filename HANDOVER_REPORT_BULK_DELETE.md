# LMS — SuperAdmin report deletion (3 October 2026)

## Status

**Released 3 October 2026 after user-approved localhost testing.** RPC is installed in the LMS Supabase database; frontend source commit `e81ea67` is on `main` and GitHub Pages serves `assets/index-B3zzoeYG.js`. Installation/deployment did not itself execute any leave deletion or quota mutation.

Production URL: `https://smetaltech26.github.io/leave-management-system/`. Post-release verification: index HTTP 200, DOM loads `/leave-management-system/assets/index-B3zzoeYG.js`, asset HTTP 200 and contains management/bulk-delete/RPC code, GitHub Pages API status `built`, and the production Login screen produced no captured console error. **The app uses the real LMS Supabase database: confirming deletion changes real records.** Use SuperAdmin, review/export before deletion, and perform annual cleanup outside concurrent employee updates. No production leave was deleted by the agent for testing.

Installation evidence: SQL Editor returned `Success. No rows returned`; follow-up query confirmed RPC exists, anon EXECUTE=false, authenticated EXECUTE=true (subject to internal SuperAdmin check). A no-auth call with an empty ID list was rejected with insufficient_privilege inside a rolled-back transaction. Live request count at verification was 773 (earlier snapshot 772); do not infer the count is frozen while employees use production. Build and 16/16 automated tests passed again. The live localhost Report page was checked with SuperAdmin: the management column rendered, the detail modal loaded the selected real request, and single-delete confirmation showed the exact request/person. The test was cancelled, so no data was deleted. At a 390x700 browser viewport, mobile action buttons rendered without horizontal overflow (`scrollWidth 382 <= innerWidth 390`). A fixture role switch verified Admin has no management column/actions. Physical iPhone Safari/Chrome remains untested. Actual SuperAdmin deletion from localhost is awaiting user testing.

LMS dashboard access is now verified through GitHub account `smetaltech26` / organization `smetaltech26@gmail.com`, project `jkndpfqefprfrnftqqxs`. Read-only production inspection and rollback-only temporary-fixture SQL tests completed on 3 October 2026. CLI credentials are separate; do not assume the CLI targets this account.

### Live findings / testing considerations

- Actual columns match the RPC, including UUID policy IDs and generated `remaining_days = max_days - used_days`. Both approval/attachment request FKs cascade. No custom triggers were returned on the inspected tables. Existing RLS need not be replaced.
- **The live ID generator is MAX(existing LEV number) + 1, not a PostgreSQL sequence.** No public sequences exist. Maximum numeric suffix observed: 809. Deleting the highest/all requests can reuse old IDs. **User decision, 3 October 2026: reusing numbers from deleted history is acceptable; preserve the existing generator and do not introduce a sequence.** This is an accepted business rule, not a claim that all downstream effects were tested. ID reuse is no longer a release gate; do not reset or renumber records that remain.
- Snapshot: 772 requests, 753 Pending/Approved; all 772 have NULL `policy_id`. No ambiguous cross-year active rows were found by the current guard. Two active rows have no matching policy, and three policy groups have recorded usage lower than the total active leave duration. Specific identifiers were inspected privately in SQL Editor; do not publish employee-level HR findings in GitHub docs.
- Existing `updateUserPolicyUsedDays` logs/skips a missing policy rather than creating it. A missing policy is therefore not proof of corruption or permission to invent a balance. The new RPC deliberately blocks unresolved refunds. Deleting all current records would be blocked until these exceptions are reviewed, or affected records excluded. No historical policy/usage correction was performed or authorized.

## Requested behavior and implementation

- `ReportPage.jsx`: only exact role `SuperAdmin` sees row checkboxes, all-filtered-results checkbox and delete-selected button. Works in the desktop table and mobile cards. Selection spans pagination, resets on filter/account/role changes, excludes removed/hidden requests, and is disabled while confirmation/deletion is running. The page clamps after deletion.
- Added an OMS-style `จัดการ` column for exact `SuperAdmin`: the blue eye opens the existing `LeaveDetailsModal`; the red trash deletes that row through the same guarded RPC, confirmation, quota refund and shared-state/calendar refresh path as bulk deletion. Mobile cards expose labelled action buttons at least 44px high. Admin/SuperUser/User do not receive the column or actions.
- Existing confirmation dialog gives selected count/filter scope, warns about permanent deletion/cascaded approval and attachment records, and suggests Export. Cancelling sends no mutation. Success appears only after the RPC responds successfully; errors retain selection/data.
- `supabaseApi.js`: `deleteReportRequests` calls only `lms_delete_report_requests`; no insecure fallback to per-row direct deletes. Checks returned IDs/policies before updating shared state. Existing request and quota fetches now use 500-row pages to avoid truncating annual reports at the usual 1,000-row response limit.
- `App.jsx` + `src/lib/reportSelection.js`: remove server-confirmed requests and merge server-returned quota records into shared state. Home, calendar, approval pages, user summaries and leave form receive that state. Same-session page switches reflect deletions immediately; other already-open sessions still need their normal refresh/reload (no realtime subscription was added).
- SQL RPC: validates the caller using `auth.uid()` + the database `users.role`, locks selected requests/policies, refunds and deletes in one transaction. Missing/stale IDs or inconsistent balances abort the entire operation. Pending/Approved requests get refunded; Rejected/Cancelled requests do not get a second refund. Approval/attachment records cascade with their request.
- SQL is separate from the historical schema script. Adds one function/its execute grants, not a replacement of existing RLS/table definitions. Installation checks required cascading FKs and blocks existing delete/quota-update triggers until reviewed for double refunds.

## Quota year and important limits

Existing `updateUserPolicyUsedDays` charges the year current at the time of the operation, while legacy `createLeaveRequest` does not save `policy_id`. A refund must not blindly use today's year or simply zero all employees' usage.

1. Prefer a populated `policy_id` matching the request's employee/type.
2. For legacy rows without `policy_id`, use the submission year in Asia/Bangkok only when created date, leave start/end and last update are all in that year. An old same-year 2026 request deleted in 2027 still refunds the 2026 policy.
3. Ambiguous cross-year legacy rows, missing policies or a refund exceeding recorded `used_days` block deletion with an actionable message. Inspect actual history before assigning a policy or correcting balances; never silently guess or clamp a negative balance.
4. Preserve `max_days` and unrelated/manual usage. This is selected-request deletion, not automatic creation/reset of next year's entitlements. It does not recompute historical leave durations.

Company holidays, employee records, notification content, the LEV generator and other existing workflows are unchanged. Storage **objects** are retained; only attachment database rows cascade. There is no automatic undo/archive; Export remains available. No LINE/email is sent by this new operation. Existing notification messages cannot be recalled.

The legacy create/edit/reject flows still perform separate read/update calls for quotas. This patch makes the new bulk operation transactional, but does not rewrite those other flows; coordinate annual cleanup when staff are not concurrently changing leave requests. Review live ID generation/triggers before deployment, especially whether deleting all rows could cause the legacy ID generator to reuse numbers.

## Validation completed

- `node --test tests/report-delete.test.cjs tests/holiday-persistence.test.cjs`: **16/16 passed** (7 new regression tests plus 9 existing holiday tests). Covers scoped selection, shared-state updates/year isolation, exact RPC input/output, error propagation/no fallback, >1,000-row pagination and later-page failures.
- `npm run build`: passed; existing >500 kB bundle warning remains.
- `tests/report-delete.browser.cjs`: passed using installed Playwright and headless Microsoft Edge against an isolated Vite fixture. Tested 25 results spanning two pages, individual/all selection, indeterminate checkbox, date/search changes, cancel, success/quota shared state, failure preservation, role gates, last-page deletion, and a 390×700 mobile viewport. Uses a mocked API, not the actual SQL RPC.
- Screenshots reviewed: `report-desktop.png` and `report-mobile-confirm.png` under this thread's Codex visualization folder. No real iPhone Safari/Chrome test has been performed.
- `tests/report-delete.database.sql`: standalone script remains for an **empty disposable PostgreSQL database named `lms_report_delete_test*` only**. Do not paste that script into production. Its real RPC body and test cases were instead rendered by `tests/fixtures/report-sql-preview.html`: all table/function references changed from `public` to `pg_temp`, tables temporary, one transaction ending in ROLLBACK, 15-second statement timeout. This isolated variant ran in the LMS SQL Editor and returned **PASS** for role guards, duplicates, mixed statuses, half days, cascades, stale selection, year isolation, explicit policy links, atomic rollback and insufficient quota. No production table or persistent function was mutated. Concurrent multi-session calls and actual authenticated-client integration remain untested.

To rerun the browser test with the existing runtime (PowerShell, no installation):

```powershell
$env:PLAYWRIGHT_MODULE_PATH = 'C:\Users\DELL\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
node tests/report-delete.browser.cjs
```

## Remaining release steps

1. Live schema/RLS/FK/trigger and ID checks completed. Do not apply old `supabase_schema.sql` (historical roles/policies differ). Keep unresolved legacy balance exceptions blocked; review separately before annual cleanup.
2. Preserve the existing LEV generator per the user's accepted ID-reuse decision. Further bulk-delete concurrency tests remain useful; single-transaction rollback tests have passed.
3. Completed: user approved backend installation and requested localhost testing, explicitly withholding frontend deployment. Installed only `supabase/migrations/20261003_report_bulk_delete.sql`; preserved balances, requests and ID generator. Do not interpret this as permission for test deletion of employee data.
4. Completed: committed/pushed source and published GitHub Pages asset `index-B3zzoeYG.js`; index/asset/Pages status and console were verified.
5. User acceptance remains: SuperAdmin may verify selected vs all-filtered deletion using records the business has chosen to remove; confirm quota/year/approval/attachment rows and refreshed calendar. Lower-role server denial is covered by the RPC role guard. Do not choose real employee records for a destructive test unless they are explicitly approved for removal.
