/**
 * Presenter-only Signals Inspector endpoint.
 *
 * Given the visitor's domain_sessionid, returns the full set of live Signals
 * attributes served by the session service (config: siteConfig.snowplow), plus
 * a small meta block describing the wiring so the inspector can show a
 * "configured?" indicator and a "synced Ns ago" badge. All credentials stay
 * server-side (see signals-server.ts).
 */

import { NextRequest } from 'next/server';

import {
  getRawSessionAttributes,
  getSnowplowId,
  isSignalsConfigured,
} from '@/lib/signals-server';
import { siteConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { sessionId, domainUserid } = await request
    .json()
    .catch(() => ({ sessionId: '', domainUserid: '' }));

  const meta = {
    service: siteConfig.snowplow.signalsService,
    attribute_key: siteConfig.snowplow.signalsAttributeKey,
    intervention: siteConfig.snowplow.interventionName,
    signals_configured: isSignalsConfigured(),
    synced_at: new Date().toISOString(),
  };

  if (!sessionId) {
    return Response.json({
      success: false,
      attributes: null,
      snowplow_id: null,
      meta,
    });
  }

  // Fetch the session attributes and the identity (snowplow_id via
  // domain_userid) in parallel.
  const [attributes, snowplowId] = await Promise.all([
    getRawSessionAttributes(sessionId),
    domainUserid ? getSnowplowId(domainUserid) : Promise.resolve(null),
  ]);

  return Response.json({
    success: attributes !== null,
    attributes,
    snowplow_id: snowplowId,
    meta,
  });
}
