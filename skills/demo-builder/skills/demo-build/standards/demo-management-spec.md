# Demo Management Footer

The demo management footer is the ONE UI component that is templated (via `templates/demo-footer.tsx`). Its purpose is functional, not aesthetic: it provides Snowplow SDK controls that SEs use during demos. The structure and control order are identical across all demos so SEs can find controls instinctively. It uses Tailwind theme classes to visually match each demo's design.

## Structure

A full-width footer in the normal document flow (NOT fixed or sticky). It should look like a real website footer, not a floating toolbar. The layout follows common website footer patterns:

**Main section** (generous padding, grid layout):
- **Brand column** (left): Brand name, tagline/description, copyright year
- **Navigate column**: Site navigation links from `siteConfig.navigation.mainMenu`
- **Legal column**: Non-Snowplow footer links (privacy policy, terms, etc.)

**Bottom bar** (separated by a border): Demo tool controls (left) + cross-domain snowplow.io links (right), laid out horizontally in a single row.

## Demo tool controls

Controls appear in this order in the bottom bar, styled as small inline text links matching the footer's muted style:

| # | Control | Action | Snowplow integration |
|---|---------|--------|---------------------|
| 1 | UTM Reload | Generates random UTM params, reloads page | `newSession()` before reload; Campaign Attribution Enrichment captures UTMs |
| 2 | Manage Consent | Opens the consent modal | Dispatches `showConsentManager` custom event |
| 3 | Signals | Toggle with status indicator dot | `isSignalsEnabled()` / `setSignalsEnabled()` in localStorage |
| 4 | Watch Video | Navigates to `/video` | Video page uses YouTube Tracking Plugin |

## Behavior

- The footer is part of the page flow — it appears at the bottom of the content, not fixed to the viewport.
- Signals toggle shows a small colored dot (accent when ON, gray when OFF) and a dropdown that opens upward.
- UTM Reload calls `newSession()` THEN reloads (order matters).
- Cross-domain links to snowplow.io appear in the bottom bar, separated from the main footer content. The `crossDomainLinker` appends the `_sp` parameter to these links.
- Feature-flagged controls check `siteConfig.features.*` before rendering.

## Why this is templated

SEs switch between multiple demos. The footer needs to be in the same place with the same controls every time. Unlike headers, navs, or content components (which should vary per demo to look authentic), the footer is purely functional. A fintech demo and a media demo should have identical footer behavior.
