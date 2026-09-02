---
name: demo-build
description: >
  Scaffold and build a complete Snowplow demo web application from a spec and design tokens.
  Use this skill when the user has a demo-spec.json and design-tokens.json and is ready to
  build the actual app. Triggers on: "build the demo", "scaffold the app", "create the app",
  "start building", "demo build", "Phase 3", or any request to generate the Next.js application
  code for a Snowplow demo. Also triggers when the user wants to rebuild, fix, or extend an
  existing demo app.
---

# Demo Build

Scaffold and assemble a complete, polished Snowplow demo web application. This skill takes the structured spec from Phase 1 and the design tokens from Phase 2 and produces a working Next.js app with all baseline Snowplow tracking integrated.

## User interaction

Follow the AskUserQuestion conventions from the router skill. Exception for this phase: do NOT use `AskUserQuestion` when the user needs to paste URLs, file paths, or error messages.

## Prerequisites

Before building, verify these artifacts exist in the project's `specs/` folder:

- `specs/demo-spec.json` — the structured spec from Phase 1
- `specs/design-tokens.json` — the extracted/created design tokens from Phase 2
- `tailwind.config.ts` — the Tailwind theme extension from Phase 2 (project root)

If any are missing, tell the user which phase to complete first. If they want to skip design (Phase 2), ask them to at least confirm a design direction so you can generate reasonable tokens.

## Story-driven feature validation

After confirming prerequisites, check the `story` field in `demo-spec.json`. Some use cases imply functional requirements that must be present in the page list. If the required feature is missing, flag it to the user via `AskUserQuestion` and ask whether to add it — do not silently inject pages.

| Story / use case | Required feature | Why |
|---|---|---|
| Marketing attribution | At least one clear conversion action (form submit, purchase, signup) | There must be something to attribute — without a conversion, the attribution story has no payoff |
| Real-time personalization | A Signals-powered component that visibly adapts to behavior | The demo needs to show personalization happening live, not just claim it |
| Customer 360 / identity | A login or signup flow with an anonymous-to-identified transition | Identity stitching requires a moment where the user goes from anonymous to known |

Stories not listed here (e.g., "data quality and governance") have **no special build requirements** — the use case is demonstrated through the tracking plan and Console, not the website itself.

This is a validation step, not a content/messaging change. The website should always feel like a real site for its industry. Do not embed use-case language into the UI (e.g., don't put "data governance" messaging on a media site).

## Integration contract & gotchas

The skeleton **is** the source of truth for how the Snowplow plumbing works — don't re-derive it from prose. The tracker config, plugins, page-view hook, consent flow, video tracking, cross-domain, Signals wiring, and identity stitch are all shipped, working, and building clean. You only theme them and fill `config.ts`. Read the skeleton's `README.md` for the reusable-file map, and the actual file if you need to understand behavior.

What you **do** author (fresh UI + `config.ts`) must respect these contracts:

- **Auth / identity**: build the header + login/signup modal fresh, but drive identity only through `useUser()` from `@/contexts/user-context` — call `login` / `signup` / `logout`. The context handles `setUserId`, localStorage (`"demo-user"`), and the anonymous→known stitch. Do not call the tracker's identity APIs directly from your UI.
- **Provider nesting is mandatory**: `SnowplowInit > UserProvider > children` (already wired in `layout.tsx` via `snowplow-init.tsx`). Login calls into the tracker, so `UserProvider` must sit inside `SnowplowInit`. Keep the root layout a server component.
- **Feature flags**: gate any optional surface on `siteConfig.features.*` (`utmParameters`, `signals`, `video`, `consent`, `warehouse`) — same pattern the footer uses.
- **No custom events in baseline**: baseline is OOTB only (page views, page pings, link clicks, consent, video). Do NOT add `trackSelfDescribingEvent` / custom schemas unless the user has explicitly moved to Phase 4. `tracking.ts` keeps `trackLogin` (used by the stitch) — leave the rest as a stub.
- **Footer controls** (shipped in `DemoFooter.tsx`, theme only): UTM Reload → Manage Consent → Signals toggle → Watch Video, in that order. Presenters rely on the order being identical across demos.

**Optional deps** (install only when a feature needs it — everything else is already pinned in the skeleton's `package.json`):
```bash
npm install @snowplow/browser-plugin-form-tracking   # form tracking
npm install @snowplow/browser-plugin-web-vitals      # core web vitals
npm install --save-dev @snowplow/snowtype             # custom tracking (Phase 4)
```

## Build process

Follow this order. Dependencies flow downward, so creating files out of order causes import errors.

### Step 1: Clone the skeleton

The entire Snowplow plumbing baseline lives in the **demo-skeleton** repo. You do NOT scaffold from scratch — the project folder is a clone of it (created by the router when the project was first set up), so in the normal flow you are **already inside the clone** by the time you reach this step. Verify it's there (e.g. `src/lib/snowplow-config.ts` exists). Only if you jumped straight to build with no project folder yet, clone it now:

```bash
git clone https://github.com/dje96/demo-skeleton.git [app-id]
cd [app-id]
rm -rf .git && git init -q
```

The app-id comes from `demo-spec.json` and follows the format `demo-[scope]-web` (scope = industry/use-case/company in kebab-case, e.g. `demo-media-publishing-web`); the project directory matches it. The skeleton ships, already wired and building clean (Next 16 / React 19 / TS / Tailwind v4): tracker init + all plugins, page-view hook, consent CMP, presenter DemoFooter, Signals Inspector, dual-path intervention banner, anonymous→known identity stitch, server-only Signals retrieval + `/api/signals`, and the YouTube tracking page. See the skeleton's `README.md` for the file map.

### Step 2: Install dependencies

```bash
npm install
```

All required Snowplow + UI dependencies are already pinned in the skeleton's `package.json`. Do NOT re-run `create-next-app` or add core packages individually. Only add an OPTIONAL package (see **Integration contract & gotchas** above) if a specific feature needs it (e.g. form tracking, web vitals).

### Step 3: Configure environment

```bash
cp .env.example .env
```

The skeleton's `.env.example` already contains the Snowplow Console keys and the Signals API host vars (`SIGNALS_API_URL`, `NEXT_PUBLIC_SNOWPLOW_SIGNALS_API_URL`). Leave the placeholder values as-is unless the user is wiring live Signals or Snowtype now — real values are only needed for Phase 4 or a live Signals demo. `.env` is already gitignored.

### Step 4: Apply design tokens

Overwrite the skeleton's placeholder `tailwind.config.ts` with the one from Phase 2 — **keep the semantic key names** (`primary`, `heading`, `surface`, `border`, etc.), because every plumbing component styles against them. Update the font imports in `src/app/layout.tsx` and the body colors in `src/app/globals.css` to match the design.

### Step 5: Fill config, then generate pages

The plumbing files below **already exist in the skeleton** — do not recreate them. Edit config, regenerate the two stubs, and build the industry UI.

**Provided — edit values / theme only, keep behavior:**
- **`src/lib/config.ts`** — fill the `brand` / `navigation` / `marketing` / `seo` values AND the **`snowplow` block** (`appId` + the Signals `signalsService` / `interventionName` you published in Console + `interventionClauses`). Populate the content catalog (`categories` / `items` / `plans`). Components read from this config, never hardcode values.
- **`src/lib/snowplow-config.ts`**, **`consent.ts`**, **`utils.ts`**, **`nudge.ts`**, **`signals-server.ts`** — reusable; leave as-is (they read from config).
- **`src/hooks/use-snowplow-tracking.ts`** — add any detail-route prefix to `SELF_TRACKED_ROUTES` if a page fires its own entity-bearing page_view.
- **`src/contexts/user-context.tsx`**, **`src/components/{snowplow-init,ConsentManager,DemoFooter,SignalsInspector,InterventionBanner}.tsx`**, **`src/app/api/signals/route.ts`**, **`src/app/layout.tsx`**, **`src/app/video/page.tsx`** — reusable; theme only.

**Generate fresh per demo:**
1. **`src/lib/tracking.ts`** — replace the stub: swap the vendor Iglu URIs and add the demo's events/entities (ideally Snowtype-generated in Phase 4). Keep `trackLogin` (used by the identity stitch).
2. **The header** — the skeleton ships NO header (auth/identity is headless). Build the demo's real nav / branding / sign-in as a new component and render it in `layout.tsx` where the marker comment is. Wire it to `useUser()` (`login` / `signup` / `logout`) from `@/contexts/user-context` so the anonymous→known identity stitch stays intact.
3. **`src/app/page.tsx`** — replace the stub home with industry content.
4. **Additional pages** per `demo-spec.json`.
5. Wire the **`InterventionBanner`** copy/CTA to the demo's actual offer.

**Image references in page components**: When creating pages (Step 5), write components that reference image paths from the data/config (e.g., `restaurant.image`, `article.heroImage`), assuming real image files will exist in `public/images/` after Step 6. Do NOT write placeholder markup (colored divs, letter initials) when `demo-spec.json.imageApproach` is `"scrape"` or `"ai-generated"` — use `<img>` tags with paths that Step 6 will populate.

### Step 6: Handle images

**MANDATORY**: This step is NOT optional. Check `demo-spec.json.imageApproach` and execute the corresponding pipeline below BEFORE proceeding to Step 7 (QA). Do not use placeholder images when the spec requests scraping or AI generation — the user already made this choice in the interview. If you cannot fulfil the requested approach (e.g. Playwright unavailable), stop and ask the user rather than silently falling back to placeholders.

Based on `imageApproach` in the spec:

- **scrape**: Scrape images from the reference site using the Playwright pipeline below. **If Playwright is unavailable**, do not silently skip. Ask the user how to proceed: connect the browser, provide images manually, or fall back to icons/placeholders.
- **ai-generated**: If image generation tools are available (Nano Banana MCP, etc.), generate images. Otherwise, tell the user that image generation tools aren't available and ask whether they want to provide images or fall back to icons/placeholders. Do not silently substitute placeholder divs.
- **icons-placeholders**: Use Lucide React icons and styled placeholder containers. This is the most reliable approach and looks clean when done well.

#### Image scraping pipeline (Playwright)

A ready-made script ships alongside this skill at `scripts/scrape-images.mjs` (relative to this SKILL.md). It launches headless Chromium, takes a reference screenshot, extracts `<img>` / CSS-background / `<picture>` image URLs (skipping tiny/data/SVG assets), and downloads them to `public/images/scraped/`. Copy it into the demo project's `scripts/` dir and run it — always as a script, not inline, so failures produce readable errors.

```bash
npx playwright install chromium              # ensure browser is available
node scripts/scrape-images.mjs "https://example.com"   # pass the reference URL
```

**After scraping**, organize the downloaded images into subdirectories (`heroes/`, `products/`, `articles/`, `logos/`, etc.) based on context and content. Rename files to be descriptive. Delete any images that are clearly irrelevant (ad banners, social icons, tracking pixels that slipped through).

**Common scraping failures and fixes**:
- **0 images found**: The site likely lazy-loads everything. Add `await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))` followed by `await page.waitForTimeout(2000)` before extracting, to trigger lazy-loaded images.
- **403 / 401 on download**: Some CDNs check referer headers. Add `'Referer': TARGET_URL` to the download request headers.
- **Cloudflare/bot protection**: The page may not load at all. Take a screenshot to confirm. If blocked, fall back to asking the user for screenshots or images.
- **Images are tiny or broken**: The site uses responsive images with `srcset`. The script already handles `<picture>` sources, but some sites use `data-src` for lazy loading. Add: `document.querySelectorAll('img[data-src]').forEach(img => img.src = img.dataset.src)` before extraction.

### Step 7: Build QA

**Pre-flight: image check.** Before running QA, confirm that Step 6 (image handling) was completed. If `demo-spec.json.imageApproach` is `"scrape"` or `"ai-generated"`, verify that `public/images/` contains downloaded/generated images and that page components reference them — not placeholder divs or letter-initial circles. If images are missing, go back to Step 6 before proceeding.

Before showing the user, run a systematic quality check to catch common errors:

**7a. TypeScript compilation check**
```bash
npx tsc --noEmit
```
Fix any type errors before proceeding. Common issues: missing imports, incorrect prop types, untyped event handlers.

**7b. Build check**
```bash
npm run build
```
This catches issues that `tsc` alone misses (Next.js-specific errors, missing page exports, invalid route segments). Fix any build errors before proceeding.

**7c. Dev server verification**
```bash
npm run dev
```
Check for:
- Pages render with correct design tokens
- Navigation works between all pages
- The demo footer renders with all controls
- No console errors in the browser

If either the TypeScript or build check fails, fix the errors and re-run before moving on. Do not ask the user to debug build failures you can resolve.

**7d. Kill the dev server**

After dev server verification is complete, always kill the dev server process before moving on. A lingering background `next dev` process will block future `npm run dev` calls and cause port conflicts.

```bash
# Kill the dev server started in 7c
kill %1 2>/dev/null || true
# Or if started via Bash tool with run_in_background, the process ID is available
```

Do not leave `npm run dev` running in the background after QA is complete.

### Step 8: Phase completion check-in

After the build is working, always ask the user how to proceed via `AskUserQuestion`:

**Next step** (header: "Next"):
- "Proceed to Phase 4 (custom implementation)" — Scope + build custom CDI tracking and/or a Signals demo
- "Refine the build" — Adjust styling, content, or functionality
- "Done for now" — Stop here with baseline tracking only

## What IS provided vs. what is NOT

### Provided by the skeleton (do not recreate — theme / fill config only)

The **demo-skeleton** clone (Step 1) ships the whole plumbing baseline. These files are reusable across every demo; you only theme them and point `src/lib/config.ts` at the demo's Console resources:

**Presenter footer (`DemoFooter.tsx`)**: The functional Snowplow SDK controls (UTM reload, clear identity, consent, Signals toggle, video). Same controls, same order every time — only the theme classes change.

**Tracker (`snowplow-config.ts`)**: SDK init, plugin list, page views, consent/session/identity helpers, and the Signals intervention wiring (incl. the `sessionOnlyFetcher` and `suppressBenignTrackerNoise` fixes). Collector/Signals endpoints, appId, service and intervention names all come from the `snowplow` block in `config.ts` — nothing demo-specific is hardcoded.

**Also provided**: consent CMP, Signals Inspector, dual-path InterventionBanner, identity-stitch UserProvider, `/api/signals` + server-only Signals retrieval, the YouTube tracking page, and the Tailwind v4 `@config` bridge.

### NOT provided (generated fresh per demo)

The industry UI. The build skill generates these to match the demo's industry, audience, and design tokens (the skeleton ships stubs for `page.tsx` and `tracking.ts` to replace, and NO header — build one and wire it to `useUser()`):

- Login/signup modals
- Navigation and headers
- Content displays, cards, grids, sidebars
- Search functionality
- Page layouts and content sections
- All other interactive elements

A media publishing demo should have a content-dense nav with categories and a serif-heavy editorial layout. A fintech demo should have a clean sidebar dashboard. An e-commerce demo should have a search-forward header with cart icon. Use the `componentPatterns` from `design-tokens.json` and the industry context from `demo-spec.json` to make each demo look distinctive.

### The one thing you author against a contract

Only the auth surface (header + login/signup modal) is genuinely built fresh — its Snowplow behavior lives in the shipped `user-context.tsx`, so wire the UI to `useUser()` (see **Integration contract & gotchas** above) rather than reimplementing identity. Consent, video, cross-domain, Signals, and UTM are shipped components you theme, not rebuild.

## Config-driven architecture

The `src/lib/config.ts` file centralizes all site-specific content. This is a mandatory pattern, not a suggestion. It makes demos easy to customize after the initial build without touching component code.

```typescript
interface SiteConfig {
  brand: { name: string; tagline: string; logo: string; favicon: string }
  navigation: { mainMenu: MenuItem[]; footerLinks: FooterLink[] }
  features: { utmParameters: boolean; signals: boolean; video: boolean; consent: boolean; warehouse: boolean }
  warehouse: WarehouseConfig  // Signals Inspector "Warehouse" (batch) tab — see below
  marketing: { utmParameters: { sources: string[]; campaigns: string[] } }
  business: { contact: ContactInfo; social: SocialLinks }
  seo: { title: string; description: string; keywords: string[]; ogImage: string }
}
```

**Signals Inspector — Warehouse tab** (`siteConfig.warehouse`, `features.warehouse`): the Inspector has Stream and Warehouse tabs (Identities + Interventions persist across both). `warehouse.source: "service"` reads a real Signals batch service (`service` + `attributeKey`); `"mock"` renders `warehouse.mockAttributes`. In mock mode, `warehouse.identityGate: true` greys the tab until the resolved snowplow_id equals `NEXT_PUBLIC_WAREHOUSE_UNLOCK_SNOWPLOW_ID` (.env) — a built-in way to demo Snowplow Identity resolution without a real batch service. Skeleton default: mock + gated. See the doc comment on `WarehouseConfig` in `config.ts`.

The `sources` array (Google, Facebook, LinkedIn, Twitter, email, Slack, etc.) stays the same across demos. The `campaigns` array gets themed per vertical (e.g., media demos get campaigns like "summer-reading-series", "breaking-news-alert"; ecommerce gets "spring-sale", "flash-deal").

## Design quality

Follow the design principles from Phase 2 (`demo-design/SKILL.md`). Match the `componentPatterns` from `design-tokens.json` and vary component treatments to avoid generic AI aesthetics.

## Error recovery

If the build fails or the user reports issues:

1. Check TypeScript errors first (`npx tsc --noEmit`)
2. Check the Next.js build (`npm run build`)
3. Check the browser console for runtime errors
4. If a Snowplow component isn't working, read the shipped file directly (it's the source of truth) and confirm your fresh UI respects the **Integration contract & gotchas** above — most breakage is authoring against the tracker directly instead of through `useUser()` / config, or wrong provider nesting

Use `AskUserQuestion` to triage:

**Issue type** (header: "Issue"):
- "Build/compile error" — TypeScript or Next.js build failure
- "Tracking not firing" — Snowplow events not appearing in the collector
- "Visual/design issue" — Components don't match the design tokens
- "Functionality bug" — Interactive features not working as expected

**Important**: During iterative error fixing, it's easy for the conversation to get lost in back-and-forth debugging. After each round of fixes, always re-run the build QA checks (Step 7) and, once the build is clean, present the Phase completion check-in (Step 8) so the user can decide what's next.
