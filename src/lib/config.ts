/**
 * Site configuration — the single source of truth for per-demo values.
 *
 * ────────────────────────────────────────────────────────────────────────
 * WHAT TO CHANGE PER DEMO
 *   • `siteConfig.brand` / `navigation` / `marketing` / `seo` — the demo's
 *     identity, nav, UTM campaign values, metadata.
 *   • `siteConfig.snowplow` — appId + the Signals service/intervention names
 *     you published in Console for THIS demo. All the tracking plumbing
 *     (snowplow-config.ts, signals-server.ts, api/signals, SignalsInspector)
 *     reads these from here — there are no hard-coded demo identifiers in the
 *     plumbing.
 *   • `categories` / `titles` / `plans` — the content catalog. Left EMPTY;
 *     the Content phase fills them using the interfaces below. Never hardcode
 *     catalog content in components — always read from config.
 * ────────────────────────────────────────────────────────────────────────
 */

// ─── Content catalog interfaces (shared contract) ──────────────────────────
// Generic content shapes. Rename/extend per vertical, but keep components
// reading from these types rather than inlining data.

/** A single episode / chapter / part within an Item. */
export interface Episode {
  id: string;
  title: string;
  durationLabel: string; // e.g. "42 min"
  description: string;
}

/** A catalog item (product, title, show, listing, …). */
export interface Item {
  id: string;
  slug: string;
  title: string;
  /** Author / creator / brand. */
  author: string;
  /** Category slug this item primarily belongs to. */
  category: string;
  /** Series / collection this item belongs to, if any. Powers same-series
   *  personalization and any homepage series experiment. */
  series?: string;
  /** Image path, e.g. `/images/covers/{slug}.jpg`. */
  coverImage: string;
  description: string;
  /** Average rating, 0–5. */
  rating: number;
  /** Number of ratings. */
  ratingsCount: number;
  /** Human-readable size/duration, e.g. "12 hrs 30 mins". */
  durationLabel: string;
  episodes?: Episode[];
  /** Marketing badges, e.g. ["New", "Editor's Pick"]. */
  badges?: string[];
  /** True for first-party / original content. */
  isOriginal?: boolean;
  [key: string]: unknown;
}

/** A browse category / genre. */
export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
}

/** A membership / subscription plan. */
export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  highlighted?: boolean;
}

// ─── SiteConfig interfaces ──────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
}

/**
 * A published Signals intervention clause, mirrored in the Signals Inspector so
 * presenters can watch each eligibility criterion tick from unmet → met.
 * Keep in lock-step with the intervention recipe you built in Console.
 */
export interface InterventionClause {
  /** Stream attribute name returned by the session service. */
  attribute: string;
  /** Human label shown in the inspector, e.g. "sample_play_count ≥ 2". */
  label: string;
  /** Comparison operator against `threshold`. */
  operator: "gte" | "gt" | "lte" | "lt" | "eq";
  threshold: number;
}

export interface SnowplowConfig {
  /** appId sent on every event (from demo-spec.json). */
  appId: string;
  /** Collector endpoint. Default is the Snowplow sales pipeline. */
  collectorEndpoint: string;
  /** Tracker namespace. */
  namespace: string;
  /**
   * Signals interventions SSE host (browser plugin). Usually supplied via
   * NEXT_PUBLIC_SNOWPLOW_SIGNALS_API_URL; this is the fallback.
   */
  signalsApiUrl: string;
  /** Signals session service name (server retrieval, keyed on session). */
  signalsService: string;
  /** Attribute key the session service is keyed on. */
  signalsAttributeKey: string;
  /**
   * Shared, cross-demo service that resolves snowplow_id from domain_userid.
   * Default `snowplow_id_retrieval` is a real published service on the sales
   * pipeline (bundles the `last_snowplow_id` attribute group) — every demo reuses
   * it as-is; do NOT rename per demo. It reads the `snowplow_id` from the
   * pipeline's identity entity, so it only populates once the Identity enrichment
   * is attaching that entity to events.
   */
  idService: string;
  /** Attribute key the id service is keyed on. Always `domain_userid`. */
  idAttributeKey: string;
  /** Name of the published intervention the demo surfaces. */
  interventionName: string;
  /** Eligibility clauses mirrored in the Signals Inspector. */
  interventionClauses: InterventionClause[];
}

/**
 * Warehouse (batch) attributes shown in the Signals Inspector's "Warehouse" tab,
 * alongside the real-time "Stream" tab. Two ways to populate it:
 *
 *   • source: "service" — read a REAL Signals batch service. `service` +
 *     `attributeKey` name it; the tab is always clickable and the identity gate
 *     is ignored (real data speaks for itself).
 *   • source: "mock" — render `mockAttributes`. Honors `identityGate`: when true,
 *     the tab stays greyed/unclickable until the snowplow_id resolved in the
 *     Identities section exactly equals NEXT_PUBLIC_WAREHOUSE_UNLOCK_SNOWPLOW_ID
 *     (from .env). This mimics "batch attributes appear once Snowplow Identity
 *     resolves the ID" for demos that don't have a real batch service wired.
 */
export interface WarehouseConfig {
  source: "service" | "mock";
  /** Signals batch service name (source === "service"). */
  service: string;
  /** Attribute key the batch service is keyed on (source === "service"). */
  attributeKey: "domain_userid" | "domain_sessionid" | "snowplow_id" | "user_id";
  /** Mock-only gate: grey the tab until the resolved snowplow_id matches env. */
  identityGate: boolean;
  /** Attributes rendered when source === "mock" (and unlocked, if gated). */
  mockAttributes: Record<string, unknown>;
}

export interface SiteConfig {
  brand: {
    name: string;
    tagline: string;
  };
  snowplow: SnowplowConfig;
  warehouse: WarehouseConfig;
  navigation: {
    mainMenu: NavItem[];
    footerLinks: NavItem[];
  };
  features: {
    utmParameters: boolean;
    signals: boolean;
    video: boolean;
    consent: boolean;
    /** Show the "Warehouse" (batch) tab in the Signals Inspector. */
    warehouse: boolean;
  };
  marketing: {
    utmParameters: {
      sources: string[];
      mediums: string[];
      campaigns: string[];
    };
  };
  business: {
    contact: {
      email: string;
      phone: string;
      address: string;
    };
    social: {
      twitter?: string;
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
    };
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    url: string;
    ogImage: string;
  };
}

// ─── Site configuration (placeholder — fill per demo) ────────────────────────

export const siteConfig: SiteConfig = {
  brand: {
    name: "Demo Skeleton",
    tagline: "A Snowplow demo baseline. Replace this brand per build.",
  },
  snowplow: {
    appId: "demo-skeleton-web",
    collectorEndpoint:
      "https://com-snplow-sales-aws-prod1.collector.snplow.net",
    namespace: "sp1",
    // Prefer NEXT_PUBLIC_SNOWPLOW_SIGNALS_API_URL at runtime; this is the fallback.
    signalsApiUrl: "",
    signalsService: "demo_skeleton_session",
    signalsAttributeKey: "domain_sessionid",
    // Shared, cross-demo service — leave as-is (see interface doc above).
    idService: "snowplow_id_retrieval",
    idAttributeKey: "domain_userid",
    interventionName: "demo_skeleton_nudge",
    interventionClauses: [
      { attribute: "page_ping_count", label: "page_ping_count ≥ 5", operator: "gte", threshold: 5 },
    ],
  },
  warehouse: {
    // Skeleton default: mock data, gated on identity resolution — demos the
    // "batch attributes populate once Snowplow Identity resolves the ID" story
    // without needing a real batch service. Swap source to "service" (and set
    // `service`/`attributeKey`) once a real Signals batch service exists.
    source: "mock",
    service: "",
    attributeKey: "domain_userid",
    identityGate: true,
    mockAttributes: {
      lifetime_orders: 7,
      lifetime_value: 428.5,
    },
  },
  navigation: {
    mainMenu: [{ label: "Home", href: "/" }],
    footerLinks: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Snowplow", href: "https://snowplow.io" },
    ],
  },
  features: {
    utmParameters: true,
    signals: true,
    video: true,
    consent: true,
    warehouse: true,
  },
  marketing: {
    utmParameters: {
      sources: ["google", "facebook", "linkedin", "twitter", "email", "slack"],
      mediums: ["cpc", "social", "email", "referral"],
      campaigns: ["brand", "retargeting", "launch"],
    },
  },
  business: {
    contact: { email: "hello@example.com", phone: "", address: "" },
    social: {},
  },
  seo: {
    title: "Demo Skeleton",
    description: "Snowplow demo baseline app.",
    keywords: ["snowplow", "demo"],
    url: "https://example.com",
    ogImage: "/og.png",
  },
};

// ─── Content catalog (empty — filled by the Content phase) ────────────────────

export const categories: Category[] = [];
export const items: Item[] = [];
export const plans: Plan[] = [];
