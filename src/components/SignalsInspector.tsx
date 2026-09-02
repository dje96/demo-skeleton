'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Check,
  Database,
  Fingerprint,
  Lock,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

import {
  getSessionId,
  getUserId,
  triggerIntervention,
  INTERVENTION_NAME,
} from '@/lib/snowplow-config';
import { siteConfig } from '@/lib/config';
import { useUser } from '@/contexts/user-context';

/* ---------------------------------------------------------------------------
 * Presenter-only panel that visualizes the live Snowplow Signals state for the
 * current session. Layout, top → bottom:
 *
 *   • Identities   — snowplow_id / domain_userid / user_id (persists across tabs)
 *   • Stream | Warehouse tabs:
 *       - Stream    — real-time attributes from the session service
 *       - Warehouse — batch attributes. Two sources (siteConfig.warehouse):
 *           · "service" → a real Signals batch service (always clickable)
 *           · "mock"    → siteConfig.warehouse.mockAttributes. When
 *             warehouse.identityGate is true the tab stays greyed/locked until
 *             the resolved snowplow_id equals NEXT_PUBLIC_WAREHOUSE_UNLOCK_SNOWPLOW_ID,
 *             mimicking "batch attrs appear once Snowplow Identity resolves".
 *   • Interventions — each eligibility clause (siteConfig.snowplow.interventionClauses)
 *     with a live met/unmet tick + a manual "trigger" button (persists across tabs)
 *
 * Visible to demo presenters only — polls /api/signals every few seconds while
 * open.
 * ------------------------------------------------------------------------- */

const POLL_MS = 4000;

// Mock-mode identity gate: the snowplow_id that unlocks the Warehouse tab. See
// .env.example / siteConfig.warehouse. Empty ⇒ tab stays locked in gated mode.
const WAREHOUSE_UNLOCK_ID =
  process.env.NEXT_PUBLIC_WAREHOUSE_UNLOCK_SNOWPLOW_ID ?? '';

type SignalsAttributes = Record<string, unknown>;
type WarehouseTab = 'stream' | 'warehouse';

// ─── Value formatting ─────────────────────────────────────────────────────────

function unwrap(v: unknown): unknown {
  return Array.isArray(v) && v.length === 1 ? v[0] : v;
}

function readNumber(attrs: SignalsAttributes | null, key: string): number | null {
  if (!attrs) return null;
  const v = unwrap(attrs[key]);
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))
    return Number(v);
  return null;
}

function fmtList(v: unknown[]): string {
  if (v.length === 0) return '—';
  return v.length <= 3 ? v.map(String).join(', ') : `${v.length} items`;
}

function fmtDict(v: Record<string, unknown>): string {
  const entries = Object.entries(v);
  if (entries.length === 0) return '—';
  return entries.map(([k, n]) => `${k}: ${n}`).join(', ');
}

function fmtValue(v: unknown): string {
  if (v == null || v === '') return '—';
  if (Array.isArray(v)) return fmtList(v);
  if (typeof v === 'object') return fmtDict(v as Record<string, unknown>);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

// ─── Intervention monitor (mirrors siteConfig.snowplow.interventionClauses) ────

type EvaluatedClause = { label: string; value: string; met: boolean };

function evaluateClauses(attrs: SignalsAttributes | null): EvaluatedClause[] {
  return siteConfig.snowplow.interventionClauses.map((clause) => {
    const value = readNumber(attrs, clause.attribute);
    const v = value ?? 0;
    let met = false;
    switch (clause.operator) {
      case 'gte': met = v >= clause.threshold; break;
      case 'gt': met = v > clause.threshold; break;
      case 'lte': met = v <= clause.threshold; break;
      case 'lt': met = v < clause.threshold; break;
      case 'eq': met = v === clause.threshold; break;
    }
    return { label: clause.label, value: value === null ? '—' : String(value), met };
  });
}

export default function SignalsInspector() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WarehouseTab>('stream');
  const [attrs, setAttrs] = useState<SignalsAttributes | null>(null);
  const [warehouseAttrs, setWarehouseAttrs] =
    useState<SignalsAttributes | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [domainUserid, setDomainUserid] = useState<string | null>(null);
  const [snowplowId, setSnowplowId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [configured, setConfigured] = useState<boolean>(true);

  const { user } = useUser();
  const currentEmail = user?.email ?? null;

  const fetchAttributes = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;
    setSessionId(sid);
    const duid = getUserId() ?? null;
    setDomainUserid(duid);

    // Mirror the live login state — user_id clears the moment the user logs out.
    setUserId(currentEmail);

    try {
      setLoading(true);
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          domainUserid: duid,
          userId: currentEmail,
        }),
      });
      const data = await res.json();
      if (typeof data?.meta?.signals_configured === 'boolean') {
        setConfigured(data.meta.signals_configured);
      }
      setSnowplowId(
        typeof data?.snowplow_id === 'string' ? data.snowplow_id : null
      );
      setWarehouseAttrs(
        data?.warehouse_attributes && typeof data.warehouse_attributes === 'object'
          ? data.warehouse_attributes
          : null
      );
      if (data.success && data.attributes) {
        setAttrs(data.attributes);
        setSyncedAt(Date.now());
      }
    } catch (e) {
      console.error('Signals inspector fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [currentEmail]);

  // Poll only while open.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAttributes();
    const id = setInterval(fetchAttributes, POLL_MS);
    return () => clearInterval(id);
  }, [open, fetchAttributes]);

  // Keep the "synced Ns ago" badge ticking while open.
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  const rows = attrs ? Object.entries(attrs) : [];
  const hasData = rows.length > 0 || !!sessionId;
  const clauses = evaluateClauses(attrs);

  // ─── Warehouse (batch) tab gating ─────────────────────────────────────────
  const warehouse = siteConfig.warehouse;
  const warehouseEnabled = siteConfig.features.warehouse;
  // Real service ⇒ always clickable (gate ignored). Mock ⇒ honor identityGate:
  // unlock only when the resolved snowplow_id exactly matches the env value.
  const warehouseUnlocked =
    warehouse.source === 'service'
      ? true
      : !warehouse.identityGate
        ? true
        : !!WAREHOUSE_UNLOCK_ID && snowplowId === WAREHOUSE_UNLOCK_ID;
  // Fall back to Stream if the warehouse tab is selected but (re)locked.
  const effectiveTab: WarehouseTab =
    activeTab === 'warehouse' && warehouseUnlocked ? 'warehouse' : 'stream';
  const warehouseRows =
    warehouse.source === 'service'
      ? warehouseAttrs
        ? Object.entries(warehouseAttrs)
        : []
      : Object.entries(warehouse.mockAttributes);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 left-6 z-[60] flex max-h-[80vh] w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg sm:w-96">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface-raised px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-h4 font-bold text-heading">
                Signals Live
              </h3>
              <span className="relative flex h-2.5 w-2.5">
                {configured && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    configured ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted">
              <Wifi size={12} />
              {syncedAt
                ? `synced ${Math.max(0, Math.round((now - syncedAt) / 1000))}s ago`
                : 'syncing…'}
              <button
                onClick={() => setOpen(false)}
                className="ml-2 cursor-pointer p-0.5 text-muted hover:text-heading"
                aria-label="close signals panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-5 overflow-y-auto p-4 text-sm">
            {!configured ? (
              <div className="flex flex-col items-center py-8 text-muted">
                <Activity className="mb-3 h-10 w-10 opacity-50" />
                <p className="font-bold text-body">Signals not configured</p>
                <p className="mt-1 text-center text-xs">
                  Set SIGNALS_API_URL and the SNOWPLOW_CONSOLE_API_KEY* vars in
                  your environment.
                </p>
              </div>
            ) : loading && !hasData ? (
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 rounded bg-surface-raised" />
                ))}
              </div>
            ) : !hasData ? (
              <div className="flex flex-col items-center py-8 text-muted">
                <Activity className="mb-3 h-10 w-10 opacity-50" />
                <p className="font-bold text-body">no data yet</p>
                <p className="mt-1 text-center text-xs">
                  Interact with the app and Signals attributes will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Identities */}
                <div>
                  <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-heading">
                    <Fingerprint className="h-3 w-3" /> identities
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <code className="shrink-0 font-mono text-xs font-bold text-primary">
                        snowplow_id
                      </code>
                      <span
                        className="truncate text-right font-mono text-xs font-bold text-heading"
                        title={snowplowId ?? undefined}
                      >
                        {snowplowId ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <code className="shrink-0 font-mono text-xs font-normal text-primary">
                        domain_userid
                      </code>
                      <span
                        className="truncate text-right font-mono text-xs font-normal text-body"
                        title={domainUserid ?? undefined}
                      >
                        {domainUserid ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <code className="shrink-0 font-mono text-xs font-normal text-primary">
                        user_id
                      </code>
                      <span
                        className="truncate text-right font-mono text-xs font-normal text-body"
                        title={userId ?? undefined}
                      >
                        {userId ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Stream / Warehouse tabs (Identities above + Interventions
                    below persist across both). */}
                {warehouseEnabled && (
                  <div className="flex gap-1 rounded-md bg-surface-raised p-1">
                    <button
                      onClick={() => setActiveTab('stream')}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                        effectiveTab === 'stream'
                          ? 'bg-surface text-heading shadow-sm'
                          : 'text-muted hover:text-heading'
                      }`}
                    >
                      <Zap className="h-3 w-3" /> Stream
                    </button>
                    <button
                      onClick={() =>
                        warehouseUnlocked && setActiveTab('warehouse')
                      }
                      disabled={!warehouseUnlocked}
                      title={
                        warehouseUnlocked
                          ? undefined
                          : 'Unlocks once Snowplow Identity resolves the ID'
                      }
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                        !warehouseUnlocked
                          ? 'cursor-not-allowed text-muted/50'
                          : effectiveTab === 'warehouse'
                            ? 'bg-surface text-heading shadow-sm'
                            : 'text-muted hover:text-heading'
                      }`}
                    >
                      {warehouseUnlocked ? (
                        <Database className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}{' '}
                      Warehouse
                    </button>
                  </div>
                )}

                {effectiveTab === 'warehouse' ? (
                  /* Warehouse (batch) attributes */
                  <section>
                    <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-heading">
                      <Database className="h-3 w-3" /> warehouse attributes
                    </h4>
                    {warehouseRows.length > 0 ? (
                      <div className="space-y-2.5">
                        {warehouseRows.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-start justify-between gap-3"
                          >
                            <code className="break-all font-mono text-xs text-muted">
                              {key}
                            </code>
                            <span className="break-words text-right font-bold text-heading">
                              {fmtValue(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">
                        {warehouse.source === 'service'
                          ? 'No batch attributes yet for this identifier.'
                          : 'No mock attributes configured.'}
                      </p>
                    )}
                    {warehouse.source === 'mock' && (
                      <p className="mt-3 text-[10px] uppercase tracking-wider text-muted/70">
                        mock data
                      </p>
                    )}
                  </section>
                ) : (
                  /* Stream attributes */
                  <section>
                    <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-heading">
                      <Zap className="h-3 w-3" /> stream attributes
                    </h4>
                    {rows.length > 0 ? (
                      <div className="space-y-2.5">
                        {rows.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-start justify-between gap-3"
                          >
                            <code className="break-all font-mono text-xs text-muted">
                              {key}
                            </code>
                            <span className="break-words text-right font-bold text-heading">
                              {fmtValue(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">
                        No attributes yet — interact with the app to populate them.
                      </p>
                    )}
                  </section>
                )}

                {clauses.length > 0 && (
                  <>
                    <hr className="border-border" />

                    {/* Intervention monitor */}
                    <section>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-heading">
                          <Activity className="h-3 w-3" /> intervention
                        </h4>
                        <button
                          onClick={() => triggerIntervention()}
                          className="cursor-pointer rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-inverse transition-colors hover:bg-highlight"
                        >
                          trigger
                        </button>
                      </div>
                      <code
                        className="mb-3 block truncate font-mono text-[10px] text-muted"
                        title={INTERVENTION_NAME}
                      >
                        {INTERVENTION_NAME}
                      </code>
                      <ul className="space-y-2.5">
                        {clauses.map((clause) => (
                          <li
                            key={clause.label}
                            className="flex items-start justify-between gap-3"
                          >
                            <span className="flex min-w-0 items-start gap-2">
                              <span
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                  clause.met
                                    ? 'border-transparent bg-primary'
                                    : 'border-muted bg-transparent'
                                }`}
                              >
                                {clause.met && (
                                  <Check
                                    className="h-3 w-3 text-inverse"
                                    strokeWidth={3}
                                  />
                                )}
                              </span>
                              <code className="break-all font-mono text-xs text-muted">
                                {clause.label}
                              </code>
                            </span>
                            <span
                              className={`max-w-[9rem] shrink-0 truncate text-right font-bold ${
                                clause.met ? 'text-heading' : 'text-primary'
                              }`}
                              title={clause.value}
                            >
                              {clause.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                )}
              </>
            )}
            <p className="pt-2 text-center text-[10px] text-muted/70">
              this panel is visible to demo presenters only
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 left-6 z-[60] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-primary shadow-lg transition-transform hover:scale-105"
        aria-label={open ? 'close signals panel' : 'open signals panel'}
      >
        {open ? <X className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
      </button>
    </>
  );
}
