# Industry Design Palettes

Curated design directions by vertical. Use these when the user selects "Propose a direction" in the interview, or as a fallback when extraction produces incomplete results.

Each entry includes a color direction, typography pairing, layout approach, and reference sites to study. These are starting points, not rigid templates.

---

## Media / Publishing

**Color direction**: Dark header (near-black or deep navy) with a light content area. Minimal accent color, maybe a single warm tone (amber, coral) for CTAs. Let the content images provide the color. High contrast between text and background for readability.

**Typography**: Serif headlines (Georgia, Lora, Merriweather, Playfair Display, or the publication's own) paired with a clean sans body (Source Sans Pro, Noto Sans, IBM Plex Sans). Large headline sizes, tight line-height on display text, generous line-height on body.

**Layout**: Content-dense. Multi-column article grids. Lead story gets hero treatment, supporting stories in smaller cards. Sticky nav with category links. Sidebar with trending or related content. Think newspaper hierarchy applied to digital.

**Reference sites**: The New York Times, The Guardian, The Atlantic, Ars Technica, Bloomberg

---

## E-commerce

**Color direction**: Clean white/light gray base. One strong accent color for CTAs (add to cart, buy now) that contrasts sharply. Product images are the visual focus, so the chrome stays neutral. Price and discount colors should pop (green for deals, red for urgency).

**Typography**: Sans-serif throughout. A slightly distinctive sans for headings (DM Sans, Plus Jakarta Sans, Outfit) with a neutral body (system fonts or Noto Sans). Sizes stay moderate since product info density matters more than dramatic headlines.

**Layout**: Product grid is king. Responsive columns (2-4 depending on viewport). Filters in a sidebar or collapsible top bar. Product cards show image, name, price, rating. Quick-add buttons visible on hover. Search-forward header with cart icon and count badge.

**Reference sites**: Glossier, Everlane, Aesop, Apple Store, Allbirds

---

## Financial Services / Fintech

**Color direction**: Trust and stability. Navy, deep blue, or charcoal as the primary. Greens for positive metrics, reds for negative. White or very light gray backgrounds. Accent color used sparingly for CTAs and interactive elements. Avoid bright or playful colors.

**Typography**: Clean geometric sans (Sohne, Graphik, Circular, or the more accessible Geist, Space Grotesk, Outfit). Monospace for numbers and financial data (JetBrains Mono, Fira Code). Clear distinction between display, UI, and data typography.

**Layout**: Dashboard-style. Left sidebar navigation or top nav with dropdowns. Card-based widgets for metrics and charts. Data tables with good alignment and zebra striping. Whitespace between sections. Information hierarchy is critical since users scan for specific numbers.

**Reference sites**: Stripe Dashboard, Mercury, Wise, Plaid, Linear (for the UI patterns)

---

## SaaS / B2B

**Color direction**: Modern and professional without being corporate. One primary color (often blue or purple) with a light mode default. Subtle gradients on hero sections or feature highlights. Dark text on light backgrounds. Accent for CTAs and interactive states only.

**Typography**: Modern sans-serif (Geist, Inter if the company actually uses it, Space Grotesk, Outfit, Satoshi). Medium-weight headings rather than heavy bold. Good hierarchy between marketing pages (larger, more expressive) and app UI (compact, functional).

**Layout**: Marketing pages: full-width hero, feature sections with alternating image/text, social proof section, pricing grid. App pages: left sidebar nav, content area with tabs or sections, minimal chrome. Feature pages benefit from product screenshots or animated demos.

**Reference sites**: Linear, Vercel, Notion, Figma, Retool

---

## Healthcare / Life Sciences

**Color direction**: Calming and accessible. Soft blues, teals, or sage greens as primary. White backgrounds with subtle warm undertones. Avoid harsh contrasts. Colors must meet WCAG AA contrast requirements (this industry has strict accessibility expectations). Accent color for actions should be clear but not alarming.

**Typography**: Humanist sans-serif (Nunito, Source Sans Pro, Atkinson Hyperlegible if accessibility is paramount). Slightly larger base font size (16-18px). Generous line-height and letter-spacing. Clear visual hierarchy for medical information where misreading is unacceptable.

**Layout**: Clean, spacious, calming. Generous padding and margin. Card-based content with clear boundaries. Step-by-step flows for scheduling, intake forms. Navigation should be simple and shallow since users may not be tech-savvy. Avoid dense dashboards unless the audience is clinical staff.

**Reference sites**: One Medical, Headspace, Calm, Oscar Health, Zocdoc

---

## Gaming / Entertainment

**Color direction**: Bold and energetic. Dark backgrounds (near-black, deep purple) with vibrant accent colors (electric blue, hot pink, neon green). Gradients are acceptable and expected. High contrast for readability against dark backgrounds. Glow effects and subtle animations.

**Typography**: Modern, slightly edgy. Geometric sans (Oxanium, Rajdhani, Exo 2) for headings. Clean sans for body. Uppercase headings with letter-spacing are common in this space. Monospace for stats and leaderboard data.

**Layout**: Immersive. Full-bleed hero images or video backgrounds. Large visual elements. Asymmetric layouts with overlapping elements. Game/content tiles in responsive grids. Hover states with scale transforms and glow effects.

**Reference sites**: Steam, Epic Games Store, Twitch, Discord, Riot Games

---

## Usage notes

These palettes describe a direction, not exact values. The design skill should:

1. Pick the relevant vertical based on `demo-spec.json` focus
2. Present the direction to the user with 2-3 reference sites
3. Get approval or adjustments before generating tokens
4. Generate concrete token values (hex codes, font names, rem values) that align with the approved direction
5. If the user's specific company doesn't match the vertical norms, the company's actual style takes priority
