const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const outDir = '/tmp/screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const targets = [
    { url: 'http://localhost:55555/home', name: 'home' },
    { url: 'http://localhost:55555/landing', name: 'landing' }
  ];

  for (const t of targets) {
    // Desktop
    await page.setViewport({ width: 1440, height: 900 });
    try {
      await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.screenshot({ path: `${outDir}/${t.name}-desktop.png`, fullPage: true });
      console.log('Saved', `${outDir}/${t.name}-desktop.png`);
    } catch (e) {
      console.error('Failed desktop', t.url, e.message);
    }

    // Mobile
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    try {
      await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.screenshot({ path: `${outDir}/${t.name}-mobile.png`, fullPage: true });
      console.log('Saved', `${outDir}/${t.name}-mobile.png`);
    } catch (e) {
      console.error('Failed mobile', t.url, e.message);
    }
  }

  await browser.close();
})();
