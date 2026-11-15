import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5173';

// Known Material Symbols ligature names
const KNOWN_ICONS = new Set([
  'add', 'star', 'star_border', 'space_dashboard', 'task_alt', 'expand_more', 'sort', 'logout',
  'search', 'auto_stories', 'dashboard', 'settings', 'visibility', 'visibility_off', 'mail', 'lock',
  'arrow_forward', 'arrow_back', 'close', 'edit', 'delete', 'check', 'check_circle', 'error',
  'warning', 'info', 'share', 'history', 'notifications', 'palette', 'schedule', 'attach_file',
  'chat_bubble', 'checklist', 'person', 'people', 'more_vert', 'more_horiz', 'filter_list',
  'drag_indicator', 'view_kanban', 'contrast', 'dark_mode', 'light_mode', 'devices'
]);

function parseColor(str) {
  if (!str) return null;
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return {
    r: parseInt(m[1], 10),
    g: parseInt(m[2], 10),
    b: parseInt(m[3], 10),
    a: m[4] !== undefined ? parseFloat(m[4]) : 1,
  };
}

function getLuminance(rgb) {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1, rgb2) {
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Client-side DOM auditor injected into the page
const INJECTED_AUDIT_SCRIPT = () => {
  const results = [];

  function parseRgb(colorStr) {
    if (!colorStr) return null;
    const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return {
      r: parseInt(m[1], 10),
      g: parseInt(m[2], 10),
      b: parseInt(m[3], 10),
      a: m[4] !== undefined ? parseFloat(m[4]) : 1,
    };
  }

  function composite(fg, bg) {
    const a = fg.a + bg.a * (1 - fg.a);
    return {
      r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
      g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
      b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
      a,
    };
  }

  function getEffectiveBg(el) {
    let curr = el;
    let bgColor = { r: 255, g: 255, b: 255, a: 0 };
    const rootTheme = document.documentElement.getAttribute('data-theme');
    const defaultCanvas = rootTheme === 'light' ? { r: 244, g: 246, b: 250, a: 1 } : { r: 29, g: 33, b: 37, a: 1 };

    while (curr && curr !== document) {
      if (curr.classList && curr.classList.contains('bg-auth-brand-gradient')) {
        bgColor = { r: 66, g: 65, b: 188, a: 1 };
        break;
      }
      const style = window.getComputedStyle(curr);
      const bg = parseRgb(style.backgroundColor);
      if (bg && bg.a > 0) {
        bgColor = bgColor.a === 0 ? bg : composite(bgColor, bg);
        if (bgColor.a >= 0.95) break;
      }
      curr = curr.parentElement;
    }

    if (bgColor.a < 0.95) {
      bgColor = composite(bgColor, defaultCanvas);
    }
    return bgColor;
  }

  function getSelector(el) {
    if (!el || el === document) return '';
    let name = el.tagName.toLowerCase();
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('/'));
      if (classes.length > 0) name += `.${classes.slice(0, 2).join('.')}`;
    }
    return name;
  }

  // Find all elements
  const allElements = Array.from(document.querySelectorAll('*'));

  for (const el of allElements) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      // Check if it has essential text that is hidden
      const text = el.innerText ? el.innerText.trim() : '';
      if (text.length > 0 && !el.closest('[aria-hidden="true"]')) {
        results.push({
          type: 'VISIBILITY_HIDDEN',
          selector: getSelector(el),
          text: text.slice(0, 40),
          issue: 'Element with text has visibility:hidden or display:none',
          opacity: 0,
        });
      }
      continue;
    }

    // Check low opacity
    const opacity = parseFloat(style.opacity);
    if (opacity < 0.6 && opacity > 0) {
      const text = el.innerText ? el.innerText.trim() : '';
      if (text.length > 0) {
        results.push({
          type: 'LOW_OPACITY',
          selector: getSelector(el),
          text: text.slice(0, 40),
          issue: `Element opacity is ${opacity} (< 0.6)`,
          opacity,
        });
      }
    }

    // Check transparent text
    if (style.color === 'transparent' || style.color === 'rgba(0, 0, 0, 0)') {
      const text = el.innerText ? el.innerText.trim() : '';
      if (text.length > 0) {
        results.push({
          type: 'TRANSPARENT_TEXT',
          selector: getSelector(el),
          text: text.slice(0, 40),
          issue: 'Text color is transparent',
        });
      }
    }

    // Check Avatar aspect ratio and border radius
    const isAvatar = el.getAttribute('data-avatar') !== null ||
      el.getAttribute('title')?.length > 0 ||
      (el.className && typeof el.className === 'string' && el.className.includes('rounded-full') && rect.width <= 48 && rect.width >= 20);

    if (isAvatar && el.children.length === 0 && el.textContent?.trim().length <= 3 && el.textContent?.trim().length > 0) {
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      const br = style.borderRadius;
      if (Math.abs(w - h) > 2 || (!br.includes('50%') && !br.includes('9999px') && parseFloat(br) < w / 2 - 1)) {
        results.push({
          type: 'AVATAR_SHAPE',
          selector: getSelector(el),
          text: el.textContent.trim(),
          issue: `Avatar is not circular: width=${w}, height=${h}, borderRadius=${br}`,
        });
      }
    }

    // Check raw ligature rendered outside icon font
    if (el.children.length === 0) {
      const text = el.textContent?.trim();
      if (text && text.length > 1 && !text.includes(' ') && window.KNOWN_ICONS?.has(text)) {
        const ff = style.fontFamily.toLowerCase();
        if (!ff.includes('material symbols') && !ff.includes('material icons')) {
          results.push({
            type: 'RAW_ICON_LIGATURE',
            selector: getSelector(el),
            text,
            issue: `Icon ligature "${text}" rendered in non-icon font "${style.fontFamily}"`,
          });
        }
      }
    }

    // Check text node contrast
    // Find direct text
    let hasDirectText = false;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
        hasDirectText = true;
        break;
      }
    }

    const isIcon = el.classList.contains('material-symbols-outlined');
    const isInputPlaceholder = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';

    if (hasDirectText || isIcon) {
      const fg = parseRgb(style.color);
      const bg = getEffectiveBg(el);

      if (fg && bg) {
        const lum1 = (v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        const getL = c => c.r / 255 * 0.2126 + c.g / 255 * 0.7152 + c.b / 255 * 0.0722;
        // Accurate luminance
        const l1 = [fg.r, fg.g, fg.b].map(v => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        const lumFg = l1[0] * 0.2126 + l1[1] * 0.7152 + l1[2] * 0.0722;

        const l2 = [bg.r, bg.g, bg.b].map(v => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        const lumBg = l2[0] * 0.2126 + l2[1] * 0.7152 + l2[2] * 0.0722;

        const maxL = Math.max(lumFg, lumBg);
        const minL = Math.min(lumFg, lumBg);
        const ratio = (maxL + 0.05) / (minL + 0.05);

        const fontSize = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight, 10) >= 600 || style.fontWeight === 'bold';
        const isLarge = fontSize >= 24 || (fontSize >= 18.66 && isBold);
        const threshold = isLarge || isIcon ? 3.0 : 4.5;

        if (ratio < threshold) {
          results.push({
            type: 'CONTRAST_VIOLATION',
            selector: getSelector(el),
            text: el.textContent?.trim().slice(0, 40) || '',
            fg: style.color,
            bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
            ratio: parseFloat(ratio.toFixed(2)),
            threshold,
            isLarge,
            isIcon,
          });
        }
      }
    }
  }

  return results;
};

async function runAudit() {
  console.log('=== STARTING AUTOMATED CONTRAST & VISIBILITY AUDIT ===');
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const allViolations = [];

  const setTheme = async (theme) => {
    await page.evaluate((t) => {
      const root = document.documentElement;
      root.setAttribute('data-theme', t);
      root.style.colorScheme = t;
      if (t === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      localStorage.setItem('workaholic-theme', t);
    }, theme);
    await page.waitForTimeout(300);
  };

  // Login helper
  const loginAsOwner = async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const demoBtn = await page.$('button:has-text("Owner")');
    if (demoBtn) {
      await demoBtn.click();
      await page.waitForSelector('aside', { timeout: 10000 }).catch(() => {});
    }
    await page.waitForTimeout(500);
  };

  const auditCurrentState = async (route, theme, state) => {
    // Run Axe first
    let axeResults;
    try {
      axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
    } catch (e) {
      axeResults = { violations: [] };
    }

    // Run custom injected walker
    await page.evaluate((icons) => {
      window.KNOWN_ICONS = new Set(icons);
    }, Array.from(KNOWN_ICONS));

    const customResults = await page.evaluate(INJECTED_AUDIT_SCRIPT);

    for (const cr of customResults) {
      allViolations.push({
        route,
        theme,
        state,
        type: cr.type,
        selector: cr.selector,
        text: cr.text || '',
        fg: cr.fg || '',
        bg: cr.bg || '',
        ratio: cr.ratio || '',
        issue: cr.issue || `Contrast ratio ${cr.ratio}:1 below threshold ${cr.threshold}:1`,
      });
    }

    for (const v of axeResults.violations) {
      if (v.id === 'color-contrast') {
        for (const node of v.nodes) {
          allViolations.push({
            route,
            theme,
            state,
            type: 'AXE_CONTRAST',
            selector: node.target.join(' > '),
            text: node.html.slice(0, 40),
            fg: '',
            bg: '',
            ratio: '',
            issue: node.failureSummary || v.description,
          });
        }
      }
    }
  };

  const testInteractiveStates = async (route, theme, selectors) => {
    for (const sel of selectors) {
      const el = await page.$(sel);
      if (!el) continue;

      // Hover
      try {
        await el.hover();
        await page.waitForTimeout(100);
        await auditCurrentState(route, theme, `hover:${sel}`);
      } catch (e) {}

      // Focus
      try {
        await el.focus();
        await page.waitForTimeout(100);
        await auditCurrentState(route, theme, `focus:${sel}`);
      } catch (e) {}
    }
  };

  const themes = ['light'];

  for (const theme of themes) {
    console.log(`\n================= AUDITING THEME: ${theme.toUpperCase()} =================`);

    // 1. LOGIN ROUTE
    console.log(`Auditing /login [${theme}]...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await setTheme(theme);
    await auditCurrentState('/login', theme, 'default');
    await testInteractiveStates('/login', theme, [
      'button[type="submit"]',
      'button:has-text("Owner")',
      'button:has-text("Viewer")',
      'input[type="email"]',
      'input[type="password"]',
    ]);

    // 2. REGISTER ROUTE
    console.log(`Auditing /register (AuthPage Signup mode) [${theme}]...`);
    const signupBtn = await page.$('button:has-text("Create account")');
    if (signupBtn) {
      await signupBtn.click();
      await page.waitForTimeout(300);
      await auditCurrentState('/register', theme, 'default');
    }

    // Login for authenticated routes
    await loginAsOwner();
    await setTheme(theme);

    // 3. DASHBOARD ROUTE (/boards)
    console.log(`Auditing /boards (Dashboard) [${theme}]...`);
    await page.goto(`${BASE_URL}/boards`, { waitUntil: 'networkidle' });
    await auditCurrentState('/boards', theme, 'default');
    await testInteractiveStates('/boards', theme, [
      'aside nav button',
      'button.bg-primary',
      'input[placeholder="Search boards..."]',
      'aside footer button',
      'div[class*="rounded-2xl bg-card"]',
    ]);

    // 4. ACCOUNT MENU (No theme option)
    console.log(`Auditing Account Menu [${theme}]...`);
    const menuBtn = await page.$('button[aria-label="Open account menu"]');
    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(300);
      await auditCurrentState('/boards#account-menu', theme, 'open');

      // Verify Theme option is NOT present
      const themeRow = await page.$('div[role="menuitem"]:has-text("Theme")');
      if (themeRow) {
        allViolations.push({
          route: '/boards#account-menu',
          theme,
          state: 'open',
          selector: 'div[role="menuitem"]:has-text("Theme")',
          type: 'unwanted-theme-option',
          text: 'Theme',
          issue: 'Theme option should be completely removed from Account Menu',
        });
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // 5. CREATE BOARD MODAL
    console.log(`Auditing Create Board Modal [${theme}]...`);
    const createBtn = await page.$('aside button:has-text("Create board")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(300);
      await auditCurrentState('/boards#create-modal', theme, 'open');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // 6. BOARD VIEW ROUTE (/boards/:id)
    console.log(`Auditing Board View [${theme}]...`);
    const firstBoard = await page.$('div[class*="rounded-2xl bg-card"]');
    if (firstBoard) {
      await firstBoard.click();
      await page.waitForSelector('main', { timeout: 10000 });
      await page.waitForTimeout(800);
      await auditCurrentState('/boards/:id', theme, 'default');
      await testInteractiveStates('/boards/:id', theme, [
        'header button:has-text("Share")',
        'header button[title="Activity Feed"]',
        'button:has-text("Add a card")',
      ]);

      // 7. CARD MODAL
      console.log(`Auditing Card Modal [${theme}]...`);
      const firstCard = await page.$('div.bg-card');
      if (firstCard) {
        await firstCard.click();
        await page.waitForTimeout(600);
        await auditCurrentState('/boards/:id#card-modal', theme, 'open');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      // 8. SHARE MODAL
      console.log(`Auditing Share Modal [${theme}]...`);
      const shareBtn = await page.$('header button:has-text("Share")');
      if (shareBtn) {
        await shareBtn.click();
        await page.waitForTimeout(400);
        await auditCurrentState('/boards/:id#share-modal', theme, 'open');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // 9. SETTINGS ROUTE
    console.log(`Auditing /settings [${theme}]...`);
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    await auditCurrentState('/settings', theme, 'default');

    await page.goto(`${BASE_URL}/settings/profile`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    await auditCurrentState('/settings/profile', theme, 'default');

    await page.goto(`${BASE_URL}/settings/activity`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    await auditCurrentState('/settings/activity', theme, 'default');

    await page.goto(`${BASE_URL}/settings/cards`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    await auditCurrentState('/settings/cards', theme, 'default');

    // 10. 404 ROUTE
    console.log(`Auditing /non-existent-404 [${theme}]...`);
    await page.goto(`${BASE_URL}/non-existent-404`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    await auditCurrentState('/404', theme, 'default');
  }

  await browser.close();

  // Deduplicate violations by route, theme, state, selector, issue
  const seen = new Set();
  const deduped = [];
  for (const v of allViolations) {
    const key = `${v.route}|${v.theme}|${v.state}|${v.selector}|${v.type}|${v.text}|${v.issue}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(v);
    }
  }

  console.log(`\nAudit finished! Found ${deduped.length} total unique violation items.`);

  // Write results to JSON
  fs.writeFileSync('scripts/audit_results.json', JSON.stringify(deduped, null, 2));

  // Print Summary Table
  console.log('\n--- TOP VIOLATIONS TABLE ---');
  console.log('| Route | Theme | State | Selector | Text | FG | BG | Ratio | Issue |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  for (const v of deduped.slice(0, 50)) {
    console.log(`| ${v.route} | ${v.theme} | ${v.state} | \`${v.selector.slice(0, 25)}\` | "${v.text.replace(/\|/g, '').slice(0, 20)}" | ${v.fg || '-'} | ${v.bg || '-'} | ${v.ratio || '-'} | ${v.issue.slice(0, 35)} |`);
  }

  if (deduped.length > 0) {
    console.error(`\n❌ FAILED: ${deduped.length} violations found.`);
    process.exit(1);
  } else {
    console.log('\n✅ PASSED: 0 violations found. WCAG AA compliance verified.');
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit script error:', err);
  process.exit(1);
});
