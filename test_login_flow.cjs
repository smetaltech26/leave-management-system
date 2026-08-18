const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('console', msg => { if(msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()) });
  
  await page.goto('http://localhost:3000/leave-management-system/');
  
  // Wait for inputs to appear
  await page.waitForSelector('input[type="text"]');
  
  await page.type('input[type="text"]', 'pongsak@smetaltech.co.th');
  await page.type('input[type="password"]', '3200');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 8000));
  await browser.close();
})();
