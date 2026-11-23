// Annual reset & storage bucket cleanup regressions; no connection to a real Supabase project.
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
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => {
      assert.ok(name in imports, `Unexpected dependency ${name}`);
      return imports[name];
    }
  });
  return module.exports;
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const apiFor = (supabase) => load('src/services/supabaseApi.js', { '../lib/supabase': { supabase } });

test('annual reset requires exact confirmation phrase and invokes atomic RPC with no fallback', async () => {
  let calls = 0;
  const expectedPhrase = 'Reset เลขที่คำขอทั้งหมดเป็น LEV-0001';
  const expectedResult = {
    deleted_requests: 773,
    deleted_approval_steps: 2319,
    deleted_attachments: 45,
    next_request_id: 'LEV-0001'
  };

  const api = apiFor({
    rpc: async (name, args) => {
      calls++;
      assert.equal(name, 'lms_reset_leave_requests_for_new_year');
      assert.deepEqual(plain(args), { p_confirmation: expectedPhrase });
      return { data: expectedResult, error: null };
    },
    from: () => assert.fail('No direct table delete fallback allowed')
  });

  assert.equal(api.ANNUAL_RESET_CONFIRMATION_TEXT, expectedPhrase);

  for (const wrong of ['', null, undefined, 'reset เลขที่คำขอทั้งหมดเป็น LEV-0001', `${expectedPhrase} `, 'RESET-LMS-2570']) {
    await assert.rejects(() => api.resetLeaveRequestsForNewYear(wrong), /คำยืนยันไม่ถูกต้อง/);
  }
  assert.equal(calls, 0);

  const result = await api.resetLeaveRequestsForNewYear(expectedPhrase);
  assert.deepEqual(plain(result), expectedResult);
  assert.equal(calls, 1);
});

test('annual reset propagates RPC permission/missing-function errors and rejects invalid payloads', async () => {
  const phrase = 'Reset เลขที่คำขอทั้งหมดเป็น LEV-0001';

  const deniedErr = { code: '42501', message: 'Denied' };
  const apiDenied = apiFor({
    rpc: async () => ({ data: null, error: deniedErr }),
    from: () => assert.fail('No direct-delete fallback')
  });
  await assert.rejects(() => apiDenied.resetLeaveRequestsForNewYear(phrase), (err) => err === deniedErr);

  const apiMissing = apiFor({
    rpc: async () => ({ data: null, error: { code: 'PGRST202' } })
  });
  await assert.rejects(() => apiMissing.resetLeaveRequestsForNewYear(phrase), /ยังไม่ได้ติดตั้ง/);

  for (const invalidPayload of [
    null,
    {},
    { deleted_requests: 1, deleted_approval_steps: 1, deleted_attachments: 0, next_request_id: 'LEV-0002' },
    { deleted_requests: '1', deleted_approval_steps: 1, deleted_attachments: 0, next_request_id: 'LEV-0001' }
  ]) {
    const apiBad = apiFor({ rpc: async () => ({ data: invalidPayload, error: null }) });
    await assert.rejects(() => apiBad.resetLeaveRequestsForNewYear(phrase), /ไม่สามารถยืนยัน/);
  }
});

test('storage cleanup recursively lists and deletes only attachments bucket files in batches', async () => {
  const removedBatches = [];
  const state = {
    '': [
      { name: 'LEV-0001', id: null, metadata: null },
      { name: 'root-doc.pdf', id: 'f0', metadata: { size: 120 } }
    ],
    'LEV-0001': [
      { name: 'LEV-0001-ATT-1.png', id: 'f1', metadata: { size: 500 } },
      { name: 'LEV-0001-ATT-2.jpg', id: 'f2', metadata: { size: 600 } }
    ]
  };

  const api = apiFor({
    storage: {
      from: (bucket) => {
        assert.equal(bucket, 'attachments');
        return {
          list: async (prefix) => ({ data: state[prefix] || [], error: null }),
          remove: async (paths) => {
            removedBatches.push([...paths]);
            for (const p of paths) {
              const idx = p.lastIndexOf('/');
              const dir = idx === -1 ? '' : p.slice(0, idx);
              const file = idx === -1 ? p : p.slice(idx + 1);
              state[dir] = (state[dir] || []).filter((item) => item.name !== file);
            }
            // Remove empty virtual folder entry
            if ((state['LEV-0001'] || []).length === 0) {
              state[''] = (state[''] || []).filter((item) => item.name !== 'LEV-0001');
            }
            return { data: paths.map((name) => ({ name })), error: null };
          }
        };
      }
    }
  });

  await assert.rejects(() => api.purgeAttachmentStorageBucket('wrong'), /คำยืนยันไม่ถูกต้อง/);

  const filesBefore = await api.listAllAttachmentStorageFiles();
  assert.deepEqual(plain(filesBefore), ['root-doc.pdf', 'LEV-0001/LEV-0001-ATT-1.png', 'LEV-0001/LEV-0001-ATT-2.jpg']);

  const res = await api.purgeAttachmentStorageBucket(api.STORAGE_PURGE_CONFIRMATION_TEXT);
  assert.deepEqual(plain(res), { deleted_files: 3, remaining_files: 0 });
  assert.equal(removedBatches.length, 1);
  assert.deepEqual(plain(removedBatches[0]), ['root-doc.pdf', 'LEV-0001/LEV-0001-ATT-1.png', 'LEV-0001/LEV-0001-ATT-2.jpg']);
});

test('storage cleanup fails loudly when RLS silently blocks deletion', async () => {
  const api = apiFor({
    storage: {
      from: (bucket) => {
        assert.equal(bucket, 'attachments');
        return {
          list: async () => ({
            data: [{ name: 'stuck.png', id: 'f1', metadata: { size: 100 } }],
            error: null
          }),
          remove: async () => ({ data: [], error: null })
        };
      }
    }
  });

  await assert.rejects(
    () => api.purgeAttachmentStorageBucket(api.STORAGE_PURGE_CONFIRMATION_TEXT),
    /สิทธิ์ RLS ยังไม่อนุญาต/
  );
});
