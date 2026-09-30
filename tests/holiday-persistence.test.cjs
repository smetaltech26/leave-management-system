// Run with: node --test tests/holiday-persistence.test.cjs
// Execute the real API/component against an in-memory Supabase stub; never touch production.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

function loadSource(relativePath, imports) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
    loader: filename.endsWith('.jsx') ? 'jsx' : 'js', format: 'cjs',
  });
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, document: { body: {} },
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
      return imports[name];
    },
  }, { filename });
  return module.exports;
}

function databaseFixture() {
  let rows = [];
  let serial = 0;
  const calls = [];
  const control = { failure: null, release: null };
  const supabase = {
    from(table) {
      assert.equal(table, 'holidays');
      let operation = 'read', payload, id;
      const query = {
        insert(values) { operation = 'insert'; payload = values[0]; return query; },
        update(values) { operation = 'update'; payload = values; return query; },
        delete() { operation = 'delete'; return query; },
        eq(column, value) { assert.equal(column, 'id'); id = value; return query; },
        select() { return query; },
        order(column, options) {
          assert.equal(column, 'date'); assert.equal(options.ascending, true);
          return Promise.resolve({ data: rows.map(r => ({ ...r })).sort((a, b) => a.date.localeCompare(b.date)), error: null });
        },
        async single() {
          calls.push({ operation, payload: payload && { ...payload }, id });
          if (control.release) await control.release;
          if (control.failure) return { data: null, error: control.failure };
          const index = rows.findIndex(r => r.id === id);
          if (operation !== 'insert' && index < 0) {
            return { data: null, error: { code: 'PGRST116', message: 'No rows returned' } };
          }
          if (payload && rows.some(r => r.date === payload.date && r.id !== id)) {
            return { data: null, error: { code: '23505', message: 'Duplicate date' } };
          }
          let result;
          if (operation === 'insert') {
            result = { ...payload, id: `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}` };
            rows.push(result);
          } else if (operation === 'update') {
            result = { ...rows[index], ...payload };
            rows[index] = result;
          } else if (operation === 'delete') {
            result = rows.splice(index, 1)[0];
          }
          return { data: { ...result }, error: null };
        },
      };
      return query;
    },
  };
  const api = loadSource('src/services/supabaseApi.js', { '../lib/supabase': { supabase } });
  return { api, calls, control };
}

function mountHolidayPage(api, initialRows = [], confirm = async () => true) {
  let cursor = 0;
  const hooks = [];
  let holidays = initialRows;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = { value: initial };
      return [hooks[index].value, value => {
        hooks[index].value = typeof value === 'function' ? value(hooks[index].value) : value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!hooks[index]) hooks[index] = { current: initial };
      return hooks[index];
    },
  };
  const Component = loadSource('src/components/admin/HolidayManagement.jsx', {
    react, 'react-dom': { createPortal: child => child }, 'lucide-react': {},
    '../../contexts/ModalContext': { useModal: () => ({ showConfirm: confirm }) },
    '../../services/supabaseApi': api,
  }).default;
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== 'object') return [];
    return [node, ...nodes(node.props.children)];
  }
  const page = {
    rows: () => holidays,
    render() {
      cursor = 0;
      return nodes(Component({ holidays, setHolidays: update => { holidays = update(holidays); } }));
    },
    find(predicate) {
      const result = page.render().find(predicate);
      assert.ok(result, 'Expected UI element to exist');
      return result;
    },
    add() { page.find(n => n.type === 'button' && n.props.children.includes('เพิ่มวันหยุดใหม่')).props.onClick(); },
    edit(title) { page.find(n => n.props['aria-label'] === `แก้ไขวันหยุด ${title}`).props.onClick(); },
    remove(title) { return page.find(n => n.props['aria-label'] === `ลบวันหยุด ${title}`).props.onClick(); },
    fill(date, title) {
      page.find(n => n.type === 'input' && n.props.type === 'date').props.onChange({ target: { value: date } });
      page.find(n => n.type === 'input' && n.props.type === 'text').props.onChange({ target: { value: title } });
    },
    save() { return page.find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); },
    isOpen() { return page.render().some(n => n.props.role === 'dialog'); },
    alert() { return page.find(n => n.props.role === 'alert').props.children.join(''); },
  };
  return page;
}

test('create, edit across years, reload as another client, and delete persist through the API', async () => {
  const db = databaseFixture();
  const page = mountHolidayPage(db.api);
  page.add(); page.fill('2026-10-01', '  วันหยุดทดสอบ  '); await page.save();
  assert.equal(page.isOpen(), false);
  assert.equal(page.rows()[0].title, 'วันหยุดทดสอบ');
  assert.equal(page.rows()[0].year, 2026);
  assert.match(page.rows()[0].id, /^[a-f0-9-]{36}$/);
  assert.equal(db.calls[0].payload.id, undefined, 'Database owns ID generation');
  const storedId = page.rows()[0].id;
  page.edit('วันหยุดทดสอบ'); page.fill('2027-01-02', 'วันหยุดใหม่'); await page.save();
  assert.equal(page.rows()[0].id, storedId);
  assert.equal(page.rows()[0].year, 2027);
  const otherClient = mountHolidayPage(db.api, await db.api.fetchAllHolidays());
  assert.equal(otherClient.rows()[0].date, '2027-01-02');
  await otherClient.remove('วันหยุดใหม่');
  assert.equal(otherClient.rows().length, 0);
  assert.equal((await db.api.fetchAllHolidays()).length, 0);
});

test('wait for database confirmation and block duplicate submit, edit, and close while saving', async () => {
  const db = databaseFixture();
  let finish;
  db.control.release = new Promise(resolve => { finish = resolve; });
  const page = mountHolidayPage(db.api);
  page.add(); page.fill('2026-10-01', 'รอผล');
  const pending = page.save();
  await page.save();
  assert.equal(db.calls.length, 1);
  assert.equal(page.rows().length, 0);
  assert.equal(page.isOpen(), true);
  assert.equal(page.find(n => n.type === 'button' && n.props.type === 'submit').props.disabled, true);
  page.find(n => n.props['aria-label'] === 'ปิดหน้าต่างวันหยุด').props.onClick();
  assert.equal(page.isOpen(), true);
  finish(); await pending;
  assert.equal(page.rows().length, 1);
  assert.equal(page.isOpen(), false);
});

test('duplicate date keeps the form open with an error and leaves the existing holiday unchanged', async () => {
  const db = databaseFixture();
  await db.api.createHoliday({ date: '2026-10-01', title: 'เดิม' });
  const page = mountHolidayPage(db.api, await db.api.fetchAllHolidays());
  page.add(); page.fill('2026-10-01', 'ซ้ำ'); await page.save();
  assert.equal(page.isOpen(), true);
  assert.match(page.alert(), /มีวันหยุดวันที่นี้อยู่แล้ว/);
  assert.equal(page.rows().length, 1);
  assert.equal(page.rows()[0].title, 'เดิม');
});

for (const failure of [{ code: '42501', message: 'Permission denied' }, { message: 'Network failure' }, { code: 'PGRST116', message: 'No visible rows' }]) {
  test(`failed update/delete keeps state intact (${failure.message})`, async () => {
    const db = databaseFixture();
    await db.api.createHoliday({ date: '2026-10-01', title: 'เดิม' });
    const page = mountHolidayPage(db.api, await db.api.fetchAllHolidays());
    db.control.failure = failure;
    page.edit('เดิม'); page.fill('2026-10-02', 'ใหม่'); await page.save();
    assert.equal(page.isOpen(), true);
    assert.ok(page.alert());
    assert.equal(page.rows()[0].date, '2026-10-01');
    page.find(n => n.props['aria-label'] === 'ปิดหน้าต่างวันหยุด').props.onClick();
    await page.remove('เดิม');
    assert.equal(page.rows().length, 1);
    assert.ok(page.alert());
    assert.equal((await db.api.fetchAllHolidays())[0].date, '2026-10-01');
  });
}

test('cancel deletion sends no database mutation', async () => {
  const db = databaseFixture();
  await db.api.createHoliday({ date: '2026-10-01', title: 'เดิม' });
  const page = mountHolidayPage(db.api, await db.api.fetchAllHolidays(), async () => false);
  const before = db.calls.length;
  await page.remove('เดิม');
  assert.equal(db.calls.length, before);
  assert.equal(page.rows().length, 1);
});

test('update/delete of a missing row fails instead of reporting success', async () => {
  const { api } = databaseFixture();
  await assert.rejects(api.updateHoliday('missing', { date: '2026-10-01', title: 'ใหม่' }), e => e.code === 'PGRST116');
  await assert.rejects(api.deleteHoliday('missing'), e => e.code === 'PGRST116');
});

test('reject invalid dates/empty titles and sort changed dates consistently', async () => {
  const db = databaseFixture();
  for (const date of ['2026-02-30', '', '2026-13-01']) {
    await assert.rejects(db.api.createHoliday({ date, title: 'ทดสอบ' }), /วันที่/);
  }
  await assert.rejects(db.api.createHoliday({ date: '2026-10-01', title: '   ' }), /ชื่อวันหยุด/);
  assert.equal(db.calls.length, 0);
  await db.api.createHoliday({ date: '2026-10-01', title: 'หนึ่ง' });
  await db.api.createHoliday({ date: '2026-10-02', title: 'สอง' });
  const page = mountHolidayPage(db.api, await db.api.fetchAllHolidays());
  page.edit('สอง'); page.fill('2026-09-30', 'สอง'); await page.save();
  assert.equal(page.rows()[0].date, '2026-09-30');
  assert.equal((await db.api.fetchAllHolidays())[0].date, '2026-09-30');
});
