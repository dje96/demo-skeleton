---
name: demo-tracking-requirements
description: >
  Scope and build the custom Snowplow implementation for a demo — both CDI (raw event
  tracking) and Signals (real-time profiles, interventions, pull-based context). Use this
  skill after the demo app is built (Phase 3) when the user wants custom tracking and/or a
  Signals demo beyond the baseline. Triggers on: "custom tracking", "tracking design",
  "Phase 4", "add Signals", "signals demo", "interventions", "what should we track", or any
  request about custom events, schemas, attribute groups, or personalization for the demo.
  This skill orchestrates the Snowplow plugin skills (tracking-design, signals,
  implementation-guidance) and the Console MCP server — it does not hand-author schemas.
---

# Demo Custom Implementation (CDI + Signals)

Scope and build the custom Snowplow implementation for a demo. This phase is an **orchestration layer**: it frames the scope, then drives the real work through the Snowplow plugin skills and Console MCP server. It does not define schemas, attribute groups, or tracking code by hand — those skills do, with their own governance guardrails.

A custom Snowplow implementation has two parts:

1. **Snowplow CDI** — the raw events collected from the app.
2. **Snowplow Signals** — the aggregation of those raw events into a profile that serves context to other systems or personalizes the in-app experience.

## Prerequisites

- The demo app is built and working (Phase 3 complete).
- `specs/demo-spec.json` should exist for context (`story`, pages, features). Read it if present, but do **not** hard-gate on `customTracking` fields — this phase can run from a fresh scoping conversation. If the spec is sparse, scope from the conversation and the built app.

Baseline tracking (page views, page pings, link clicks, consent events, video events) is already implemented in Phase 3. This phase is only for custom tracking and/or Signals.

## Step 1 — Define the scope

Before any building, establish what this demo covers. Use `AskUserQuestion`:

- **CDI only** — custom raw-event tracking, no profile/personalization layer.
- **CDI + Signals** — also demo Signals (real-time profiles, interventions, pull-based context).

The answer determines the flow:

- **CDI only** → skip to Step 3 (CDI tracking design).
- **CDI + Signals** → do Step 2 first (Signals is scoped first, then you work *backwards* to the tracking that feeds it).

Write a **lightweight scope note** to `specs/custom-implementation.md` capturing: chosen scope, the Signals use cases (if any), and the list of custom events/schemas you expect to build. This is a short record, not a formal requirements doc — keep it to a page. Update it as scope firms up.

## Step 2 — Scope Signals use cases (only if Signals is in scope)

Signals is scoped **first**, then tracking is derived from it. Start from the outcome the demo needs to show, then work backwards to the attributes, then to the raw events required to compute those attributes.

Each Signals demo defaults to **two** use cases:

1. **One proactive, trigger-based use case** — an **Intervention** (push). Something happens in-session and Signals pushes an action back to the app.
2. **One reactive, pull-based use case** — reading directly from the **profile store** (pull) to serve context or personalize.

Use the **`/snowplow:signals`** skill for all Signals work — it targets the Snowplow **Sales** Signals deployment. Read before write, confirm before mutating, and **build + publish live** (attribute groups, service, intervention) once the user approves.

### Signals guardrails

- **Reuse first.** Prefer existing attribute groups / services where they fit (e.g. the existing ecommerce session-level attribute group for other ecommerce use cases). List what exists before creating anything.
- **New attribute groups: stay small.** If a new group is genuinely needed, default to a **single stream attribute group scoped to `domain_sessionid`** (so the demo resets easily) with **3–5 attributes**. Not a hard cap, but do not create excessively large groups unless truly required.
- **Non-trivial interventions.** Build intervention criteria from **at least 2 different attributes** so the use case does not look trivial.
- Order matters: an attribute group references raw events by name/vendor/version, so the **CDI schemas (Step 3) must exist and be published before you create/publish the Signals objects that reference them.** Scope Signals here, derive the required events, then create the Signals objects after Step 3.

## Step 3 — CDI tracking design

Use the **`/snowplow:tracking-design`** skill to design and create the custom tracking. If Signals is in scope, the event set is driven by what those use cases need; otherwise it is driven by the demo narrative and the built app's interaction points.

### CDI tracking design guardrails

- **Reusability check is scoped.** The Sales Iglu repo is bloated with hundreds of similar schemas — when checking for reusable schemas, **only evaluate schemas with the `com.demo` vendor prefix.** Ignore the rest.
- **Vendor prefixes for new schemas.**
  - `com.demo` — generic, cross-industry schemas (e.g. `search`).
  - `com.demo.[industry]` — industry-specific schemas (e.g. `com.demo.media` for an `article` schema).
- **Grouped vs atomic data structures.** Lean toward **grouped** event data structures for workflows of similar events (e.g. a subscription funnel). Use an **atomic** schema when an event is discrete enough to carry properties specific only to that action.
- **Tracking plan size.** Default to a **single tracking plan with 2–6 custom Event Specifications**.
- **Naming.** Avoid using the exact same name for both the event schema and the event specification, unless it is something very simple (e.g. `login`, `search`).
- **Grouped-schema event specs.** When a grouped data structure backs several event specs, use the **Event Specification instructions** to define how the group schema is used for that specific spec. E.g. for a funnel, scope each event spec to a step and use the instructions to set `step_name` to the step that spec represents.
- **Source Application.** Create a source application representing this demo app.
- **Global entities.** Use **Source Application entities** to represent any entity that should be captured globally on every event.

Create and publish the schemas / tracking plan / source app via the skill. Then, if Signals is in scope, return to **Step 2's Signals objects** and create + publish them now that the events they reference exist.

## Step 4 — Hand off implementation to a subagent

Once tracking design is complete **and everything is published** (CDI schemas + Signals objects), hand off the actual code implementation to a **subagent** (Agent tool). Do not implement inline — spawn a dedicated agent so the implementation runs with a clean, focused context.

Brief the subagent to:

- Use the **`/snowplow:implementation-guidance`** skill.
- **Use Snowtype** to implement the events, since a tracking plan has been created (generate types from the plan, then wire the tracking calls).
- **Use global contexts** to capture entities that should be present on every event (mirroring the Source Application entities defined in Step 3).
- Wire the events into the built demo app at the interaction points identified during tracking design.

Pass the subagent: the path to `specs/custom-implementation.md`, the tracking plan / source app identifiers from Step 3, and the app's relevant pages/components.

## What this skill does NOT do

- Hand-author schema JSON, attribute group definitions, or `trackSelfDescribingEvent` calls. The plugin skills do that with their own guardrails.
- Bypass the Console / Iglu governance (no local schema creation).
- Re-implement baseline tracking — that already ships from Phase 3.
