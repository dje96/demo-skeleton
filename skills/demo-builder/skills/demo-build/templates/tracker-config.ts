/**
 * Snowplow Tracker Configuration Template
 *
 * This file initializes the Snowplow browser tracker with all required plugins.
 * Only the appId changes per demo. Everything else is standard.
 *
 * Place at: src/lib/snowplow-config.ts
 */

import {
  newTracker,
  enableActivityTracking,
  enableCrossDomainLinking,
  trackPageView,
  setUserId,
  newSession,
} from '@snowplow/browser-tracker';
import { LinkClickTrackingPlugin, enableLinkClickTracking } from '@snowplow/browser-plugin-link-click-tracking';
import { EnhancedConsentPlugin, trackConsentAllow, trackConsentDeny, trackConsentSelected, trackCmpVisible } from '@snowplow/browser-plugin-enhanced-consent';
import { SnowplowMediaPlugin } from '@snowplow/browser-plugin-media';
import { YouTubeTrackingPlugin, startYouTubeTracking, endYouTubeTracking } from '@snowplow/browser-plugin-youtube-tracking';
import { SignalsPlugin, subscribeToInterventions } from '@snowplow/signals-browser-plugin';
import { enableAnonymousTracking, disableAnonymousTracking } from '@snowplow/browser-tracker';

import { siteConfig } from './config';
import { getConsentPreferences, isSignalsEnabled } from './consent';

// ─── Constants ───────────────────────────────────────────────────────────────

const COLLECTOR_ENDPOINT = 'https://com-snplow-sales-aws-prod1.collector.snplow.net';
const TRACKER_NAMESPACE = 'sp1';
const SIGNALS_ENDPOINT = 'https://signals.snplow.net'; // Update per environment if needed

// ─── Tracker initialization ─────────────────────────────────────────────────

let isInitialized = false;

export function initializeSnowplow(): void {
  if (isInitialized || typeof window === 'undefined') return;

  newTracker(TRACKER_NAMESPACE, COLLECTOR_ENDPOINT, {
    appId: siteConfig.brand.appId, // From demo-spec.json via config.ts
    appVersion: '1.0.0',
    cookieSameSite: 'Lax',
    eventMethod: 'post',
    bufferSize: 1, // Send immediately (demo, not production)
    contexts: { webPage: true }, // Required for event-to-page-view joins
    plugins: [
      LinkClickTrackingPlugin(),
      EnhancedConsentPlugin(),
      SnowplowMediaPlugin(),
      YouTubeTrackingPlugin(),
      SignalsPlugin(),
    ],
    crossDomainLinker: function (linkElement: HTMLAnchorElement | HTMLAreaElement) {
      return linkElement.hostname === 'snowplow.io';
    },
  });

  // Activity tracking MUST be enabled before the first trackPageView()
  enableActivityTracking({ minimumVisitLength: 20, heartbeatDelay: 10 });
  enableLinkClickTracking({ trackContent: true });
  enableCrossDomainLinking();

  // Check initial consent state
  const preferences = getConsentPreferences();
  if (preferences && !preferences.analytics) {
    enableAnonymousTracking({
      options: { withServerAnonymisation: true, withSessionTracking: true },
    });
  }

  // Initialize Signals if enabled
  if (siteConfig.features.signals && isSignalsEnabled()) {
    subscribeToInterventions(SIGNALS_ENDPOINT);
  }

  isInitialized = true;
}

// ─── Page view tracking ─────────────────────────────────────────────────────

export function trackPageViewEvent(): void {
  trackPageView();
  cleanUpSpParam();
}

/**
 * Remove the _sp cross-domain parameter from the URL after tracking.
 * Prevents accidental sharing of domain_userid via copied URLs.
 */
function cleanUpSpParam(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (url.searchParams.has('_sp')) {
    url.searchParams.delete('_sp');
    window.history.replaceState({}, '', url.toString());
  }
}

// ─── User identity ──────────────────────────────────────────────────────────

export function setUserForTracking(email: string): void {
  setUserId(email);
}

export function clearUserForTracking(): void {
  setUserId(null as unknown as string);
}

// ─── Session management ─────────────────────────────────────────────────────

export function resetSession(): void {
  newSession();
}

// ─── Consent tracking ───────────────────────────────────────────────────────

const consentBasePayload = () => ({
  basisForProcessing: 'consent' as const,
  consentUrl: window.location.origin + '/privacy-policy',
  consentVersion: '1.0',
  domainsApplied: [window.location.hostname],
  gdprApplies: true,
});

export function trackConsentAllowEvent(scopes: string[]): void {
  trackConsentAllow({
    ...consentBasePayload(),
    consentScopes: scopes,
  });
}

export function trackConsentDenyEvent(scopes: string[]): void {
  trackConsentDeny({
    ...consentBasePayload(),
    consentScopes: scopes,
  });
}

export function trackConsentSelectedEvent(scopes: string[]): void {
  trackConsentSelected({
    ...consentBasePayload(),
    consentScopes: scopes,
  });
}

export function trackCmpVisibleEvent(): void {
  trackCmpVisible({
    elapsedTime: performance.now(),
  });
}

// ─── Anonymous tracking ─────────────────────────────────────────────────────

export function enableAnonymousMode(): void {
  enableAnonymousTracking({
    options: { withServerAnonymisation: true, withSessionTracking: true },
  });
}

export function disableAnonymousMode(): void {
  disableAnonymousTracking();
}

// ─── Video tracking ─────────────────────────────────────────────────────────

export { startYouTubeTracking, endYouTubeTracking };
