import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs/screenshots_report');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2 // High-DPI Retina resolution for crisp doc images
  });

  const page = await context.newPage();

  // 1. Login Page
  console.log('Capturing Login Page...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_login_page.png') });

  // Perform Login
  console.log('Logging in...');
  await page.fill('input[type="email"]', 'anushree.tiwari2024@vitstudent.ac.in');
  await page.fill('input[type="password"]', 'Password@123');
  await page.click('button[type="submit"]');

  // Wait for Dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // 2. Dashboard Page
  console.log('Capturing Dashboard Page...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_dashboard_page.png') });

  // 3. Budgets Page
  console.log('Capturing Budgets Page...');
  await page.goto('http://localhost:5173/budgets', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_budgets_page.png') });

  // 4. Friends Page
  console.log('Capturing Friends Page...');
  await page.goto('http://localhost:5173/friends', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_friends_page.png') });

  // 5. Splits Page
  console.log('Capturing Splits Page...');
  await page.goto('http://localhost:5173/splits', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_splits_page.png') });

  // Click into the Goa Trip to show detailed trip expenses & balances
  const goaCard = page.locator('text=Goa Coastal Vacation 2026').first();
  if (await goaCard.isVisible()) {
    console.log('Opening Goa trip details...');
    await goaCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05b_splits_trip_details.png') });
  }

  // 6. Summary / Analytics Page
  console.log('Capturing Analytics Page...');
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_analytics_summary_page.png') });

  // 7. Goals Page
  console.log('Capturing Goals Page...');
  await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_goals_page.png') });

  // 8. Bills & Subscriptions Page
  console.log('Capturing Bills Page...');
  await page.goto('http://localhost:5173/bills', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_bills_subscriptions_page.png') });

  // 9. Transactions Page
  console.log('Capturing Transactions Page...');
  await page.goto('http://localhost:5173/transactions', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_transactions_page.png') });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

captureScreenshots().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
