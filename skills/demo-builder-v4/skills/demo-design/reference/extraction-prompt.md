# Design Extraction Scripts

JavaScript snippets for extracting computed styles from a target website. Use with Playwright in Claude Code.

## Core extraction function

Run this in the page context. It returns a structured object with all extracted design values.

```javascript
(() => {
  const getStyle = (el, prop) => el ? getComputedStyle(el)[prop] : null;
  const getStyles = (selector, props) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const computed = getComputedStyle(el);
    return Object.fromEntries(props.map(p => [p, computed[p]]));
  };

  // Sample colors from key areas
  const sampleColor = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, color: s.color, borderColor: s.borderColor };
  };

  // Extract CSS custom properties from :root
  const rootStyles = getComputedStyle(document.documentElement);
  const cssVars = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === ':root' || rule.selectorText === ':root, :host') {
          for (const prop of rule.style) {
            if (prop.startsWith('--')) {
              cssVars[prop] = rootStyles.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch (e) { /* cross-origin stylesheet, skip */ }
  }

  return {
    cssVariables: cssVars,
    body: getStyles('body', ['fontFamily', 'fontSize', 'lineHeight', 'color', 'backgroundColor']),
    nav: sampleColor('nav, header, [role="navigation"], .navbar, .nav'),
    hero: sampleColor('[class*="hero"], [class*="banner"], main > section:first-child'),
    headings: {
      h1: getStyles('h1', ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'letterSpacing']),
      h2: getStyles('h2', ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color']),
      h3: getStyles('h3', ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color']),
    },
    links: getStyles('a', ['color', 'textDecoration']),
    buttons: {
      primary: getStyles('button, [class*="btn-primary"], [class*="button-primary"], a[class*="btn"]',
        ['backgroundColor', 'color', 'borderRadius', 'padding', 'fontWeight', 'fontSize']),
    },
    cards: getStyles('[class*="card"], article, [class*="post"]',
      ['backgroundColor', 'borderRadius', 'boxShadow', 'padding', 'border']),
    footer: sampleColor('footer'),
    pageWidth: getStyle(document.querySelector('main, [class*="container"], [class*="wrapper"]'), 'maxWidth'),
  };
})()
```

## Usage with Playwright

```javascript
const { chromium } = require('playwright');

async function extractDesign(url) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Full page screenshot
  await page.screenshot({ path: 'full-page.png', fullPage: true });

  // Run extraction
  const tokens = await page.evaluate(() => {
    // Paste the core extraction function body here
  });

  // Targeted screenshots
  const sections = ['header', 'nav', 'main', 'footer', '[class*="hero"]', '[class*="card"]'];
  for (const selector of sections) {
    const el = await page.$(selector);
    if (el) {
      const name = selector.replace(/[^a-z]/gi, '-');
      await el.screenshot({ path: `section-${name}.png` });
    }
  }

  await browser.close();
  return tokens;
}
```

## Post-processing notes

The extraction returns raw computed values (e.g., `rgb(26, 26, 46)` instead of `#1a1a2e`). Convert RGB to hex for the token file. Resolve font stacks to the primary font name. Normalize spacing to rem where possible.

If the site uses CSS custom properties, those are often the most reliable source for the intended design system. Prefer custom property values over computed values when both are available.
