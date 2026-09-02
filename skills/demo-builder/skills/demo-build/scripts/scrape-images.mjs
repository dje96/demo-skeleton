// Scrape images from a reference site for a demo build (imageApproach: "scrape").
// Usage: node scripts/scrape-images.mjs "https://example.com"
// Copy this into the demo project's scripts/ dir, then run it. Always run as a
// script (not inline) so failures produce readable errors.
import { chromium } from 'playwright';
import { mkdirSync, createWriteStream } from 'fs';
import { join, basename } from 'path';
import https from 'https';
import http from 'http';

const TARGET_URL = process.argv[2]; // Pass the reference URL as CLI arg
const OUT_DIR = join(process.cwd(), 'public/images/scraped');
const SCREENSHOT_DIR = join(process.cwd(), 'screenshots');

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SCREENSHOT_DIR, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const file = createWriteStream(dest);
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', reject);
  });
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });

// Take a reference screenshot
await page.screenshot({ path: join(SCREENSHOT_DIR, 'scrape-reference.png'), fullPage: true });

// Extract all meaningful image URLs from the page
const images = await page.evaluate(() => {
  const seen = new Set();
  const results = [];

  // <img> elements
  document.querySelectorAll('img[src]').forEach(img => {
    const src = img.src;
    const w = img.naturalWidth || img.width || 0;
    // Skip tiny images (icons, tracking pixels, spacers)
    if (w > 0 && w < 50) return;
    // Skip data URIs and SVG inlines
    if (src.startsWith('data:') || src.endsWith('.svg')) return;
    if (!seen.has(src)) {
      seen.add(src);
      results.push({
        src,
        alt: img.alt || '',
        width: w,
        height: img.naturalHeight || img.height || 0,
        context: img.closest('section, article, header, main, [class*="hero"], [class*="card"]')?.className || 'unknown'
      });
    }
  });

  // CSS background images on major sections
  document.querySelectorAll('section, [class*="hero"], [class*="banner"], [class*="card"]').forEach(el => {
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none') {
      const match = bg.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/);
      if (match && !seen.has(match[1])) {
        seen.add(match[1]);
        results.push({ src: match[1], alt: 'bg', width: 0, height: 0, context: el.className || 'background' });
      }
    }
  });

  // <source> inside <picture> elements
  document.querySelectorAll('picture source[srcset]').forEach(source => {
    const srcset = source.srcset;
    // Take the largest image from srcset
    const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
    const url = urls[urls.length - 1];
    if (url && !url.startsWith('data:') && !seen.has(url)) {
      seen.add(url);
      results.push({ src: url, alt: 'picture-source', width: 0, height: 0, context: 'picture' });
    }
  });

  return results;
});

console.log(`Found ${images.length} images`);

// Download images, skipping failures
let downloaded = 0;
for (const img of images) {
  try {
    const urlObj = new URL(img.src);
    const ext = basename(urlObj.pathname).split('?')[0] || `image-${downloaded}.jpg`;
    const filename = ext.length > 80 ? `image-${downloaded}.jpg` : ext;
    await downloadFile(img.src, join(OUT_DIR, filename));
    downloaded++;
    console.log(`  Downloaded: ${filename} (${img.alt || 'no alt'})`);
  } catch (e) {
    console.warn(`  Skipped: ${img.src} — ${e.message}`);
  }
}

await browser.close();
console.log(`\nDone. ${downloaded}/${images.length} images saved to ${OUT_DIR}`);
