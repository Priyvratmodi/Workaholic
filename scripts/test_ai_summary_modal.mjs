import { chromium } from 'playwright';

async function main() {
  const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await chromium.launch({ headless: true, executablePath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Log in
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'owner@workaholic.test');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/boards', { timeout: 10000 });

  // 2. Open first board
  await page.waitForSelector('text=Project Management', { timeout: 10000 });
  await page.click('text=Project Management');
  await page.waitForURL('**/boards/*', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Take screenshot of board header with AI Summary button
  await page.screenshot({ path: 'screenshots/board_with_ai_button.png' });

  // 3. Click AI Summary button
  const aiButton = page.locator('button[aria-label="AI Board Summary"]');
  await aiButton.click();

  // 4. Wait for modal to appear and wait for AI summary to complete and render
  await page.waitForSelector('text=Board summary', { timeout: 10000 });
  await page.waitForSelector('text=Situation Assessment', { timeout: 45000 });
  await page.waitForTimeout(1000);

  // Take screenshot of modal
  await page.screenshot({ path: 'screenshots/ai_summary_modal.png' });

  console.log('Screenshots captured successfully!');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
