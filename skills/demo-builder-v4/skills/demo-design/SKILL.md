---
name: demo-design
description: >
  Extract or create a design system for a Snowplow demo and produce approvable design tokens.
  Use this skill after the demo interview (Phase 1) when the user has a demo-spec.json and
  needs to establish the visual identity before building. Triggers on: "design the demo",
  "extract styles", "design tokens", "match this site's style", "what should the demo look
  like", "design phase", or any request about demo visual identity, color palette, typography,
  or theming. Also triggers when the user provides a URL or screenshot to style-match.
---

# Demo Design

Extract or create a design system for the demo and produce a set of approvable design tokens. This phase exists to solve a specific problem: when you try to eyeball a design and build simultaneously, colors drift, typography doesn't match, and each iteration introduces new inconsistencies. By extracting tokens first and getting them approved, you establish a single source of truth before any components are built.

## User interaction

Follow the AskUserQuestion conventions from the router skill. Exception for this phase: do NOT use `AskUserQuestion` when the user needs to paste URLs, brand guideline links, or hex codes.

## Prerequisites

- `demo-spec.json` exists with at least `focus`, `designReference`, and `pages` fields
- If `designReference.type` is `"url"`, the URL should be accessible

## Workflow

The approach depends on `designReference.type` in the spec. Read the spec first, then follow the matching workflow.

### Workflow A: URL reference (most common)

Use Playwright to extract styles from the target URL. If Playwright is unavailable, ask the user for screenshots.

#### When site access fails

This is common. The browser might not be connected, Playwright might not install in the current environment, or the site might block automated access. Do NOT silently fall back to guessing from training data. The whole point of this phase is extracting real values, not inventing plausible ones.

If you cannot access the target site, STOP and ask the user what to do:

**Site access** (header: "Access"):
- "I'll provide the URL" — Suggest the user provide the URL so you can attempt Playwright extraction. If Playwright fails, fall back to screenshots.
- "I'll provide screenshots" — The user will upload screenshots of the target site. Switch to Workflow B (screenshots input).
- "Skip extraction, propose a direction" — Fall back to Workflow C (industry palettes). Flag clearly that the tokens will be approximate, not extracted from the real site.

Never proceed with fabricated tokens from training data without the user's explicit knowledge and consent. A demo built on guessed colors and fonts will look wrong, and the user will waste time iterating on something that could have been right from the start.

#### Programmatic extraction (Playwright)

1. Install Playwright if needed (`npm install playwright` then `npx playwright install chromium`). If installation fails (e.g., browser binary can't be downloaded in a sandboxed environment), follow the "When site access fails" flow above. Do not silently skip extraction.
2. Write and run an extraction script that navigates to the URL, executes the same extraction JavaScript, and captures screenshots
3. Parse the extracted data into design tokens

#### What to extract

The extraction script targets these elements and properties:

**Colors**: Background colors on body, nav, hero, cards, footer. Text colors on headings, body, links, muted text. Border colors. Button backgrounds and hover states. Any accent or highlight colors.

**Typography**: Font families on headings, body, nav, small text. Font sizes for h1 through h6, body, small, nav items. Font weights. Line heights. Letter spacing if notable.

**Spacing**: Padding on cards, sections, containers. Margin between sections. Gap in grid/flex layouts. Page max-width.

**Shape and effects**: Border radii on cards, buttons, inputs, images. Box shadows. Any notable transitions or hover effects.

**Component patterns**: Nav layout (horizontal/vertical, sticky, transparent). Card structure (image position, padding, content density). Button treatments (filled, outlined, text). Grid patterns (columns, gap, breakpoints).

### Workflow B: Screenshots or brand guidelines

1. Analyze the provided images for colors (sample key areas), typography (identify fonts if possible, note sizes and weights), layout patterns, and component styles
2. Search the web for the company's public brand guidelines or style guide if available
3. Make informed inferences for values that can't be extracted precisely (exact spacing, font weights)
4. Flag inferred values in the output so the user knows what's approximate vs. measured

### Workflow C: No reference ("propose a direction")

1. Read `reference/industry-palettes.md` for curated design directions by vertical
2. Based on the demo's focus and audience, propose a direction with:
   - A color palette with hex values
   - Font pairing recommendation
   - Layout approach (content-dense vs. spacious, card-heavy vs. editorial, etc.)
   - 2-3 reference sites the user can look at for inspiration
3. Present the direction via `AskUserQuestion` and iterate before generating tokens

## Design principles

These principles apply to the tokens generated here and the components built in Phase 3. They're the difference between a demo that looks AI-generated and one that looks intentionally designed.

**Study the reference first.** If there's a target site, extract its actual patterns before generating anything. If there's no reference, study industry leaders in the relevant vertical. Don't default to generic startup aesthetics.

**Prioritize information density.** Pack useful content above the fold. Every scroll should reveal something new. Avoid giant hero sections with a single headline and a colored keyword.

**Use asymmetric layouts.** 65/35 or 70/30 splits, varied section widths. Avoid symmetric center-aligned everything.

**Restrain color.** Start with a mostly monochrome base and add one accent color. Data colors only appear in charts or visualizations. If the reference site uses bold color, match it, but don't invent bold color where the reference is restrained.

**Use whitespace as structure,** not borders and card wrappers. Let items breathe on the background rather than boxing everything.

**Choose distinctive typography.** Avoid the "AI default five": Inter, Roboto, Open Sans, Montserrat, Poppins. Use pairings that match the industry. Serif + sans for publishing. Geometric + neutral for fintech. Humanist + mono for developer tools. If the reference site uses one of the default five, that's fine, match it. But don't default to them when proposing.

**Vary component treatments.** Not every list needs to be a uniform card grid. Mix image sizes, use different button styles (filled, outlined, text, icon-only), and vary typography weight/size across at least 5 levels. The design tokens should support this variety.

## Output artifacts

Generate three files and present them for approval:

### 1. design-tokens.json

The canonical token file. All values are concrete (hex codes, rem values, font strings), not semantic aliases. See `reference/design-tokens-schema.json` for the full schema.

Key sections: `colors` (primary, secondary, accent, highlight, background, surface, text variants), `typography` (fontFamily, fontSize, fontWeight, lineHeight), `spacing` (xs through section), `borderRadius`, `shadows`, `componentPatterns` (prose descriptions of nav, cards, buttons, grid patterns).

### 2. tailwind.config.ts

Maps all tokens into the Tailwind v4 theme extension so components can use semantic class names like `bg-primary`, `text-heading`, `font-heading`, `rounded-card`. This file is generated from the tokens, not hand-authored.

Include Google Fonts import in the CSS layer if the fonts aren't system fonts.

### 3. style-reference.md

A human-readable summary of the design system. Includes:
- Color swatches (hex values with descriptions of where each is used)
- Typography scale with examples
- Spacing system
- Component pattern descriptions
- Screenshots from extraction (if URL workflow was used)
- Any values flagged as approximate/inferred

This file is for the user to review. It should be scannable in under 2 minutes.

## Approval flow

Present the style reference to the user via `AskUserQuestion`:

**Design review** (header: "Design"):
- "Approved, proceed to build" — Save all artifacts and move to Phase 3
- "Needs adjustments" — Specify what to change (colors, fonts, spacing, etc.)

If adjustments are needed, update the tokens and regenerate the Tailwind config. Don't rebuild the entire extraction. Token iteration is fast; that's the whole point of this phase.

## Where to save

Save artifacts to the project directory:
- `specs/design-tokens.json`
- `specs/style-reference.md`
- `tailwind.config.ts` at the project root (or the theme extension portion, to be merged during build)

Save any screenshots taken during design extraction to the project's `screenshots/` folder (created by the router skill as part of the standard project structure).

## Reference files

- `reference/extraction-prompt.md` — JavaScript extraction snippets for browser and Puppeteer workflows
- `reference/industry-palettes.md` — Curated design directions by industry vertical
- `reference/design-tokens-schema.json` — JSON schema for the token output file
