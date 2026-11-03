import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2 });
  const htmlPath = path.resolve('aws_architecture_card.html').replace(/\\/g, '/');
  await page.goto(`file:///${htmlPath}`);
  await page.waitForTimeout(600);
  const card = await page.locator('.card');
  await card.screenshot({ path: path.resolve('docs/screenshots_report/10_aws_architecture_diagram.png') });
  await browser.close();
  console.log('AWS Architecture Diagram rendered cleanly!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
