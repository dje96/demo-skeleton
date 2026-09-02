/**
 * Demo Management Footer Template
 *
 * The ONE UI component that is templated across all demos. Its purpose is functional,
 * not aesthetic: it provides Snowplow SDK controls that SEs use during demos.
 *
 * Structure: A real website footer in the normal document flow (NOT fixed/sticky).
 * - Top section: Brand info (left) + link columns (right, including demo controls)
 * - Bottom bar: Separator + cross-domain links (snowplow.io)
 *
 * Controls are integrated into the footer layout as a "Demo Tools" column alongside
 * the site's navigation columns, so the footer looks like a real website footer.
 *
 * Place at: src/components/DemoFooter.tsx
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

import { siteConfig } from '@/lib/config';
import { resetSession } from '@/lib/snowplow-config';
import { buildUrlWithUtm } from '@/lib/utils';
import { isSignalsEnabled, setSignalsEnabled } from '@/lib/consent';

export default function DemoFooter() {
  const router = useRouter();
  const [signalsOn, setSignalsOn] = useState(true);
  const [signalsDropdownOpen, setSignalsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync Signals state from localStorage on mount
  useEffect(() => {
    setSignalsOn(isSignalsEnabled());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSignalsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleUtmReload = () => {
    resetSession();
    const newUrl = buildUrlWithUtm(window.location.href);
    window.location.href = newUrl;
  };

  const handleManageConsent = () => {
    window.dispatchEvent(new CustomEvent('showConsentManager'));
  };

  const handleSignalsToggle = (enabled: boolean) => {
    setSignalsEnabled(enabled);
    setSignalsOn(enabled);
    setSignalsDropdownOpen(false);
  };

  const handleWatchVideo = () => {
    router.push('/video');
  };

  // Split footer links into cross-domain (snowplow.io) and regular site links
  const crossDomainLinks = siteConfig.navigation.footerLinks.filter(
    (link) => link.href.includes('snowplow.io')
  );
  const siteLinks = siteConfig.navigation.footerLinks.filter(
    (link) => !link.href.includes('snowplow.io')
  );

  return (
    <footer className="border-t border-border bg-surface">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-heading">{siteConfig.brand.name}</h3>
            <p className="mt-2 text-sm text-secondary leading-relaxed">
              {siteConfig.brand.tagline}
            </p>
            <p className="mt-4 text-xs text-secondary/70">
              &copy; {new Date().getFullYear()} {siteConfig.brand.name}
            </p>
          </div>

          {/* Site navigation column */}
          {siteLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
                Navigate
              </h4>
              <ul className="space-y-2">
                {siteConfig.navigation.mainMenu.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.href}
                      className="text-sm text-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legal / info column */}
          {siteLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
                Legal
              </h4>
              <ul className="space-y-2">
                {siteLinks.map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-sm text-secondary hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* Bottom bar: demo tools (left) + cross-domain links (right) */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4 text-xs text-secondary/70">
          {/* Demo tools — horizontal, centered */}
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {/* 1. UTM Reload */}
            {siteConfig.features.utmParameters && (
              <button
                onClick={handleUtmReload}
                className="hover:text-primary transition-colors"
              >
                UTM Reload
              </button>
            )}

            {/* 2. Manage Consent */}
            {siteConfig.features.consent && (
              <button
                onClick={handleManageConsent}
                className="hover:text-primary transition-colors"
              >
                Manage Consent
              </button>
            )}

            {/* 3. Signals Toggle */}
            {siteConfig.features.signals && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setSignalsDropdownOpen(!signalsDropdownOpen)}
                  className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      signalsOn ? 'bg-accent' : 'bg-gray-400'
                    }`}
                  />
                  Signals {signalsOn ? 'ON' : 'OFF'}
                </button>

                {signalsDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-1 w-40 bg-white rounded-md shadow-lg border border-border overflow-hidden z-50">
                    <button
                      onClick={() => handleSignalsToggle(true)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                        signalsOn ? 'font-bold text-accent' : 'text-gray-700'
                      }`}
                    >
                      Enable Signals
                    </button>
                    <button
                      onClick={() => handleSignalsToggle(false)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                        !signalsOn ? 'font-bold text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Disable Signals
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. Watch Video */}
            {siteConfig.features.video && (
              <button
                onClick={handleWatchVideo}
                className="hover:text-primary transition-colors"
              >
                Watch Video
              </button>
            )}
          </div>

          {/* Cross-domain links — right-aligned */}
          <div className="flex-1" />
          <div className="flex items-center gap-4 flex-shrink-0">
            {crossDomainLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                {link.label}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
