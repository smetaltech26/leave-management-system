// API/selection regressions; no connection to a real Supabase project.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

function load(relative, imports = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const { code } = transformSync(fs.readFileSync(filename, 'utf8'), { format: 'cjs' });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    assert.ok(name in imports, `Unexpected dependency ${name}`);
    return imports[name];
  } });
  return module.exports;
}
const plain = value => JSON.parse(JSON.stringify(value));
const selection = load('src/lib/reportSelection.js');
const apiFor = supabase => load('src/services/supabaseApi.js', { '../lib/supabase': { supabase } });

test('all filtered results can be selected across pages, hidden/deleted rows cannot remain selected', () => {
  const rows = Array.from({ length: 45 }, (_, i) => ({ id: `LEV-${i}` }));
  const scope = selection.reportScope('admin', '', '', '');
  const picked = { scope, ids: rows.map(r => r.id) };
  assert.equal(selection.visibleSelection(picked, scope, rows).length, 45);
  assert.equal(selection.visibleSelection(picked, scope, rows.slice(0, 7)).length, 7);
  for (const next of [selection.reportScope('other', '', '', ''), selection.reportScope('admin', 'name', '', ''),
    selection.reportScope('admin', '', '2026-01-01', '')]) {
    assert.equal(selection.visibleSelection(picked, next, rows).length, 0);
  }
  assert.deepEqual(plain(selection.toggleReportSelection(['LEV-1', 'LEV-2'], 'LEV-1')), ['LEV-2']);
});

test('shared request/policy updates remove only confirmed rows and preserve other years and manual balances', () => {
  const requests = [{ id: 'deleted', status: 'Approved' }, { id: 'keep', status: 'Pending' }];
  const policies = [{ id: 'old', used_days: 5, year: 2026 }, { id: 'new', used_days: 2, year: 2027 }];
  assert.deepEqual(plain(selection.applyDeletedRequests(requests, ['deleted'])), [requests[1]]);
  const returned = [{ id: 'old', used_days: 1, year: 2026, max_days: 30, remaining_days: 29 }];
  assert.deepEqual(plain(selection.applyReturnedPolicies(policies, returned)), [returned[0], policies[1]]);
  assert.equal(policies[0].used_days, 5);
});

test('RPC receives unique explicit IDs only and returns authoritative quota balances', async () => {
  let calls = 0;
  const data = { deleted_ids: ['LEV-1', 'LEV-2'], policies: [{ id: 'p', used_days: 0, remaining_days: 30 }] };
  const api = apiFor({ rpc: async (name, args) => {
    calls++;
    assert.equal(name, 'lms_delete_report_requests');
    assert.deepEqual(plain(args), { p_request_ids: ['LEV-1', 'LEV-2'] });
    return { data, error: null };
  } });
  assert.equal(await api.deleteReportRequests(['LEV-1', 'LEV-2', 'LEV-1']), data);
  assert.equal(calls, 1);
  for (const invalid of [null, [], [''], [null], ['ok', 3]]) {
    await assert.rejects(() => api.deleteReportRequests(invalid), /กรุณาเลือก/);
  }
  assert.equal(calls, 1);
});

test('permission/transaction/network failures never fall back to unguarded direct deletes', async () => {
  for (const error of [{ code: '42501', message: 'Denied' }, { code: 'P0001', message: 'Quota mismatch' }, new Error('Network')]) {
    const api = apiFor({ rpc: async () => ({ data: null, error }), from: () => assert.fail('No direct-delete fallback') });
    await assert.rejects(() => api.deleteReportRequests(['LEV-1']), value => value === error);
  }
  const api = apiFor({ rpc: async () => ({ error: { code: 'PGRST202' } }) });
  await assert.rejects(() => api.deleteReportRequests(['LEV-1']), /ยังไม่ได้ติดตั้ง/);
});

test('incomplete or ambiguous RPC results require refresh instead of reporting success', async () => {
  for (const data of [null, {}, { deleted_ids: 42, policies: [] }, { deleted_ids: ['LEV-1'], policies: [null] },
    { deleted_ids: ['wrong'], policies: [] }, { deleted_ids: ['LEV-1'] }]) {
    await assert.rejects(() => apiFor({ rpc: async () => ({ data }) }).deleteReportRequests(['LEV-1']), /ไม่สามารถยืนยัน/);
  }
});

test('annual reports and policies load beyond 1000 rows, preserving approval/attachment formatting', async () => {
  const rows = Array.from({ length: 1205 }, (_, i) => ({ id: `LEV-${i}`, status: 'Pending',
    approvers: [{ step_number: 2 }, { step_number: 1 }], attachments: [{ id: 'file' }] }));
  const ranges = [];
  const api = apiFor({ from: table => {
    const query = { select: () => query, order: () => query, range: async (from, to) => {
      ranges.push([table, from, to]);
      return { data: rows.slice(from, to + 1), error: null };
    } };
    return query;
  } });
  const requests = await api.fetchAllRequests();
  const policies = await api.fetchAllUserPolicies();
  assert.equal(requests.length, 1205);
  assert.equal(policies.length, 1205);
  assert.equal(requests[0].approvers[0].step_number, 1);
  assert.equal(requests[0].attachments[0].id, 'file');
  assert.equal(ranges.length, 6);
});

test('failed later report page does not return a deceptively complete annual report', async () => {
  let page = 0;
  const api = apiFor({ from: () => {
    const q = { select: () => q, order: () => q, range: async () => ++page === 1
      ? { data: Array.from({ length: 500 }, (_, i) => ({ id: i })) }
      : { error: new Error('second page failed') } };
    return q;
  } });
  await assert.rejects(() => api.fetchAllRequests(), /second page failed/);
});
