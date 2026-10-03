// Uses an already-installed Playwright via PLAYWRIGHT_MODULE_PATH; no package installation.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 3108, strictPort: true, open: false } });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = route.request().url();
      return url.startsWith('http://127.0.0.1:3108/') || url.startsWith('data:') ? route.continue() : route.abort();
    });
    const url = 'http://127.0.0.1:3108/leave-management-system/tests/fixtures/report-preview.html';
    const open = async () => {
      await page.goto(url);
      await page.getByRole('button', { name: 'ลบรายการที่เลือก (0)', exact: true }).waitFor();
    };
    const selected = count => page.getByRole('button', { name: `ลบรายการที่เลือก (${count})`, exact: true });
    const all = () => page.getByRole('checkbox', { name: 'เลือกทั้งหมดตามตัวกรองทุกหน้า' });
    await open();
    assert.equal(await page.getByRole('columnheader', { name: 'จัดการ', exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'ดูรายละเอียด LEV-0001', exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'ลบรายการ LEV-0001', exact: true }).count(), 1);
    assert.equal(await selected(0).isDisabled(), true);
    await all().check();
    await selected(25).waitFor();
    await page.getByRole('button', { name: 'ถัดไป', exact: true }).click();
    assert.equal(await page.getByRole('checkbox', { name: 'เลือก LEV-0025', exact: true }).isChecked(), true);
    await page.getByRole('checkbox', { name: 'เลือก LEV-0025', exact: true }).uncheck();
    assert.equal(await all().evaluate(input => input.indeterminate), true);
    await page.getByPlaceholder('ค้นหาข้อมูล...').fill('LEV-0025');
    await selected(0).waitFor();
    await all().check();
    await selected(1).click();
    assert.equal(await page.getByTestId('calls').textContent(), '0');
    await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    await selected(1).waitFor();
    assert.equal(await page.getByTestId('requests').textContent(), '25');
    await page.getByPlaceholder('ค้นหาข้อมูล...').fill('');
    await selected(0).waitFor();
    await page.locator('input[type=date]').last().fill('2026-12-31');
    await all().check();
    await selected(20).waitFor();
    await page.locator('input[type=date]').last().fill('');
    await selected(0).waitFor();

    // A single delete updates shared request/quota state only after confirmation.
    await page.getByRole('checkbox', { name: 'เลือก LEV-0001', exact: true }).check();
    await selected(1).click();
    await page.getByRole('button', { name: 'ยืนยันลบถาวร', exact: true }).click();
    await page.getByText('ลบรายการสำเร็จ', { exact: true }).waitFor();
    assert.equal(await page.getByTestId('requests').textContent(), '24');
    assert.equal(await page.getByTestId('remaining').textContent(), '6');
    assert.equal(await page.getByTestId('calls').textContent(), '1');
    await page.getByRole('button', { name: 'รับทราบ', exact: true }).click();
    assert.equal(await page.getByRole('checkbox', { name: 'เลือก LEV-0001', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'ถัดไป', exact: true }).click();
    await all().check();
    if (process.env.REPORT_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.REPORT_SCREENSHOT_DIR, 'report-desktop.png') });
    await selected(24).click();
    await page.getByRole('button', { name: 'ยืนยันลบถาวร', exact: true }).click();
    await page.getByText('ลบรายการสำเร็จ', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'รับทราบ', exact: true }).click();
    assert.equal(await page.getByTestId('requests').textContent(), '0');
    assert.equal(await page.getByTestId('remaining').textContent(), '30');
    assert.equal(await page.getByRole('button', { name: 'ถัดไป', exact: true }).count(), 0);

    // Failure preserves selection and balances. Other roles cannot see destructive controls.
    await open();
    await page.getByRole('checkbox', { name: 'Test failure' }).check();
    await all().check();
    await selected(25).click();
    await page.getByRole('button', { name: 'ยืนยันลบถาวร', exact: true }).click();
    await page.getByRole('alert').waitFor();
    await selected(25).waitFor();
    assert.equal(await page.getByTestId('requests').textContent(), '25');
    assert.equal(await page.getByTestId('remaining').textContent(), '5');
    for (const role of ['Admin', 'SuperUser', 'User']) {
      await page.getByLabel('Test role').selectOption(role);
      assert.equal(await page.getByRole('button', { name: /ลบรายการที่เลือก/ }).count(), 0);
      assert.equal(await page.getByRole('checkbox', { name: /เลือก LEV-/ }).count(), 0);
      assert.equal(await page.getByRole('columnheader', { name: 'จัดการ', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: /ลบรายการ LEV-/ }).count(), 0);
    }

    await open();
    await page.setViewportSize({ width: 390, height: 700 });
    assert.equal(await page.getByRole('button', { name: 'ดูรายละเอียด LEV-0001', exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'ลบรายการ LEV-0001', exact: true }).count(), 1);
    await page.getByRole('checkbox', { name: 'เลือกทั้งหมดตามตัวกรอง', exact: true }).check();
    await selected(25).waitFor();
    await selected(25).click();
    const confirmation = page.getByRole('button', { name: 'ยืนยันลบถาวร', exact: true });
    await confirmation.waitFor();
    const bounds = await confirmation.boundingBox();
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 700, 'Mobile confirmation buttons stay inside viewport');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (process.env.REPORT_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.REPORT_SCREENSHOT_DIR, 'report-mobile-confirm.png') });
    await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    assert.deepEqual(errors, []);
    console.log('PASS: browser selection, 25 rows across pages, filters, cancel, successful deletion, failure, role gates, empty-page clamp, mobile viewport. Mock API only.');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
