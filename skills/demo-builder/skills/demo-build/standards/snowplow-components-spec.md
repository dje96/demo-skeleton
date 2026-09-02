# Snowplow Component Functional Specs

These specs define the required Snowplow behavior for each baseline component. They describe WHAT each component must do, not how it looks. The build skill generates these components fresh per demo, matching the demo's visual style and design tokens, while following these behavioral specs exactly.

For implementation patterns and code examples, read the relevant sections of `snowplow-baseline.md` first.

---

## User authentication

**Purpose**: Set the Snowplow `user_id` so prospects can see identity stitching between anonymous and identified sessions.

**Required behavior**:
- Email-based login (any email works, no real auth). Serves as both login and account creation.
- On login: call `setUserId(email)` on the Snowplow tracker. Store `{ email, isLoggedIn }` in localStorage key `"demo-user"`.
- On logout: call `setUserId(null)`. Remove `"demo-user"` from localStorage.
- On app init: check localStorage for saved user. If found, restore the user state and call `setUserId(email)` so the tracker has the identity from the start.
- Use a loading state (`isLoading`) to prevent flash of logged-out UI while localStorage is checked.
- Use `requestAnimationFrame` for the localStorage read to avoid hydration mismatches.
- Managed via a React context (`UserProvider`) with a `useUser()` hook.
- `UserProvider` MUST be inside `SnowplowInit` (tracker must exist before `setUserId()` is called).

**UI integration**: Header shows Login button when logged out, email + Logout when logged in. Login modal is triggered by the header button.

---

## Consent management

**Purpose**: Demonstrate Snowplow's privacy-first approach with the Enhanced Consent Plugin and anonymous tracking mode.

**Required behavior**:
- Four consent categories: Necessary (always on, cannot disable), Analytics, Marketing, Preferences.
- Consent state stored in localStorage:
  - `"consent-given"`: `"true"` if any consent recorded
  - `"consent-preferences"`: JSON stringified `{ necessary, analytics, marketing, preferences }`
  - `"consent-date"`: ISO timestamp of last consent action
- The consent modal is NOT shown on mount by default. It is triggered via a custom DOM event: `window.dispatchEvent(new CustomEvent('showConsentManager'))` from the footer.
- **Accept All**: Set all preferences true, call `disableAnonymousTracking()`, fire `trackConsentAllow` with all scopes.
- **Reject All**: Set only necessary true, call `enableAnonymousTracking({ options: { withServerAnonymisation: true, withSessionTracking: true } })`, fire `trackConsentDeny` with `["necessary"]`.
- **Save Preferences**: Save custom selection, toggle anonymous tracking based on analytics consent, fire `trackConsentSelected` with selected scopes.
- **CMP Visible**: Fire `trackCmpVisible({ elapsedTime: performance.now() })` when the consent modal is shown.
- All consent event payloads include: `basisForProcessing: "consent"`, `consentUrl: window.location.origin + "/privacy-policy"`, `consentVersion: "1.0"`, `domainsApplied: [window.location.hostname]`, `gdprApplies: true`.

**Anonymous tracking mapping**:

| Consent state | Tracking mode |
|---|---|
| Analytics accepted | Full tracking (network_userid cookie, IP captured) |
| Analytics denied | Anonymous + server anonymisation (no network_userid, no IP, sessions preserved) |
| No consent given yet | Anonymous + server anonymisation (default safe state) |

---

## Embedded video with media tracking

**Purpose**: Demonstrate Snowplow's out-of-the-box media tracking with the YouTube Tracking Plugin.

**Required behavior**:
- Dedicated page at `/video` with an embedded YouTube iframe.
- Always use YouTube video ID: `4ClPw87tiV0`. Always muted (`mute=1`).
- iframe src MUST include `enablejsapi=1` (required for the YouTube IFrame API, without it tracking silently fails).
- Use 16:9 aspect ratio container (`paddingBottom: '56.25%'` on relative parent, iframe absolutely positioned).
- On mount: call `startYouTubeTracking({ id: crypto.randomUUID(), video: elementId, boundaries: [25, 50, 75, 100], captureEvents: ['DefaultEvents'] })`. Store the returned session ID.
- On unmount: call `endYouTubeTracking(sessionId)` to prevent memory leaks.
- The YouTube Tracking Plugin handles all events automatically (play, pause, end, seek, volume, quality, percent progress, buffer, pings). No manual event listeners needed.

**Footer integration**: A "Watch Video" text link in the Demo Tools column navigates to `/video`.

---

## Cross-domain linking

**Purpose**: Demonstrate Snowplow's ability to stitch user journeys across domains by linking to snowplow.io with the `_sp` parameter.

**Required behavior**:
- The `crossDomainLinker` function in `newTracker()` checks if `linkElement.hostname === 'snowplow.io'` and decorates matching links with the `_sp` parameter (contains domain_userid + timestamp).
- After tracker init, also call `enableCrossDomainLinking()` for dynamically added links.
- After each page view, clean up the `_sp` parameter from the URL using `history.replaceState()` to prevent accidental sharing.
- Footer links MUST include at least one snowplow.io link (e.g., Privacy Policy at `https://snowplow.io/privacy-policy/`, and a direct Snowplow.io link).
- Cross-domain links should have a subtle visual indicator on hover (e.g., a small arrow icon or tooltip saying "Cross-domain tracking enabled").

---

## Signals toggle

**Purpose**: Let presenters toggle Snowplow Signals personalization on/off during a demo to show the difference.

**Required behavior**:
- Signals preference stored in localStorage key `"signals-enabled"`. Defaults to `true` (enabled) if not set.
- `isSignalsEnabled()` and `setSignalsEnabled(enabled)` functions in the consent utilities module.
- When preference changes, dispatch `window.dispatchEvent(new CustomEvent('signalsPreferenceChanged', { detail: { enabled } }))` so components can react.
- Signals Plugin registered during tracker init. Intervention handlers check `isSignalsEnabled()` before acting. If disabled, handlers return early (no personalization), but tracking continues normally.
- `subscribeToInterventions()` called with the Signals endpoint after tracker init.

**Footer integration**: Renders as a dropdown menu (opens upward) with a status indicator dot. Visual states: ON = accent-colored dot, OFF = gray dot.

---

## UTM generation

**Purpose**: Simulate marketing campaign traffic by reloading the page with random UTM parameters.

**Required behavior**:
- On click: call `newSession()` to reset the Snowplow session, then generate random UTM params from the site config, rebuild the URL, and reload.
- UTM sources are generic (Google, Facebook, LinkedIn, Twitter, email, Slack, etc.) and stay the same across demos. UTM campaigns are themed per vertical and configured in `lib/config.ts`.
- `buildUrlWithUtm()` utility supports: utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, msclkid, dclid.
- Snowplow's Campaign Attribution Enrichment automatically captures UTMs from the page URL. No additional tracker config needed.
- Feature-flagged via `siteConfig.features.utmParameters`.

**Footer integration**: "UTM Reload" text link in the Demo Tools column.
