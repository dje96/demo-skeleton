# Snowplow Baseline Tracking

Read this file before implementing any Snowplow tracking in a demo. It covers the tracker setup, plugin registration, provider architecture, and known gotchas.

## Technology stack

- Next.js 16 (App Router) — pinned in the skeleton's `package.json`
- TypeScript
- React 19+
- Tailwind CSS v4
- Lucide React (icons)
- npm (package manager)

## Dependencies

```bash
# Core tracker
npm install @snowplow/browser-tracker

# Required plugins
npm install @snowplow/browser-plugin-link-click-tracking
npm install @snowplow/browser-plugin-enhanced-consent
npm install @snowplow/browser-plugin-media
npm install @snowplow/browser-plugin-youtube-tracking
npm install @snowplow/signals-browser-plugin

# UI utilities
npm install lucide-react class-variance-authority clsx tailwind-merge
```

Optional (install only when explicitly needed):
```bash
npm install @snowplow/browser-plugin-form-tracking    # Form tracking
npm install @snowplow/browser-plugin-web-vitals        # Core web vitals
npm install @snowplow/signals-node                     # Server-side Signals
npm install --save-dev @snowplow/snowtype              # Custom tracking (Phase 5)
```

## Tracker initialization

The tracker is initialized once via `initializeSnowplow()` in `src/lib/snowplow-config.ts`. Plugins are registered during `newTracker()` and cannot be added later.

```typescript
newTracker('sp1', 'https://com-snplow-sales-aws-prod1.collector.snplow.net', {
  appId: 'demo-[scope]-web',  // From demo-spec.json
  appVersion: '1.0.0',
  cookieSameSite: 'Lax',
  eventMethod: 'post',
  bufferSize: 1,
  contexts: { webPage: true },
  plugins: [
    LinkClickTrackingPlugin(),
    EnhancedConsentPlugin(),
    SnowplowMediaPlugin(),
    YouTubeTrackingPlugin(),
    SignalsPlugin()
  ],
  crossDomainLinker: function (linkElement) {
    return linkElement.hostname === 'snowplow.io';
  }
});
```

After `newTracker()`, immediately call:
```typescript
enableActivityTracking({ minimumVisitLength: 20, heartbeatDelay: 10 });
enableLinkClickTracking({ trackContent: true });
```

### Key config values

- **Collector**: `com-snplow-sales-aws-prod1.collector.snplow.net` (Sales AWS prod)
- **`bufferSize: 1`**: Send events immediately (demo, not production)
- **`eventMethod: 'post'`**: Avoid URL length limits, supports batching
- **`webPage: true`**: Attaches the `web_page` context entity with a unique page view ID. Required for joining events to page views in the warehouse.
- **`crossDomainLinker`**: Checks `linkElement.hostname === 'snowplow.io'`

## Page view tracking

Page views are tracked via a custom hook (`src/hooks/use-snowplow-tracking.ts`) that fires on route changes. The hook uses refs to prevent duplicate fires:

- `lastPathnameRef`: Prevents duplicate page views if the effect re-runs with the same pathname
- `isInitialMount`: Ensures the first page view fires on mount

The `trackPageViewEvent()` function calls `trackPageView()` and then cleans up any `_sp` parameter from the URL (cross-domain linking artifact).

Page views are NEVER fired during tracker initialization. Only the hook fires page views.

## Provider nesting order

This order is mandatory. Getting it wrong causes subtle bugs (user_id not attached to events, page views before tracker ready).

```
<SnowplowInit>        // Initializes tracker, enables cross-domain, tracks page views via hook
  <UserProvider>       // Manages login state, calls setUserId() on the tracker
    {children}
  </UserProvider>
</SnowplowInit>
```

- Root layout (`app/layout.tsx`) is a server component.
- `SnowplowInit` and `UserProvider` are client components (`"use client"`).
- `UserProvider` must be inside `SnowplowInit` because login calls `setUserForTracking()`, which requires the tracker to be initialized.

## Config-driven architecture

All site-specific content lives in `src/lib/config.ts`. Components read from config, never hardcode values. See the build skill's SKILL.md for the full `SiteConfig` interface and theming guidance.

## File creation order

See the build skill's SKILL.md Step 5 for the definitive file creation order with dependency notes. The order matters because each file may import from files above it.

## Baseline events (out of the box)

Only these events are tracked in the baseline. Do NOT add custom self-describing events unless the user explicitly moves to Phase 4/5.

- Page views (via hook on route changes)
- Page pings (20s min visit, 10s heartbeat)
- Link clicks (LinkClickTrackingPlugin)
- Consent events (Enhanced Consent Plugin: allow, deny, selected, withdrawn, cmp_visible)
- Video events (YouTube Tracking Plugin: play, pause, end, seek, volume, quality, percent progress, pings)

## Common mistakes to avoid

1. **Activity tracking after page view**: `enableActivityTracking()` MUST be called before the first `trackPageView()`. Otherwise page pings won't fire.

2. **Double page views**: Tracking page views in the provider AND in the route-change hook. Only the hook should fire page views. The provider initializes the tracker.

3. **Stale `_sp` parameter**: Not cleaning up the `_sp` cross-domain parameter from the URL after the page view is tracked. If left in the URL, users may copy/share it and leak the domain_userid.

4. **Missing `newSession()` before UTM reload**: The UTM reload button must call `newSession()` before reloading with UTM params. Without this, UTMs attach to the existing session.

5. **Hardcoded consent state**: Always check `localStorage("consent-given")` on init. Never assume a default consent state.

6. **`"use client"` on root layout**: Only provider components should be client components. The root layout must be a server component.

7. **Missing `webPage: true`**: Without `contexts: { webPage: true }` in the tracker config, the page view context entity isn't attached to events. This breaks event-to-page-view joins in the warehouse.

8. **Custom events without Phase 4/5**: Adding `trackSelfDescribingEvent` calls or custom schemas without the user requesting them. Baseline is OOTB tracking only.
