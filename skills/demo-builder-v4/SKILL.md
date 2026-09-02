---
name: demo-builder-v4
description: >
  Build polished Snowplow demo web applications through a guided, multi-phase workflow.
  Use this skill whenever the user wants to build, scope, design, or create a Snowplow demo
  app. Triggers on: "build a demo", "new demo", "demo for [company/industry]", "demo builder",
  "start a demo build", "scope a demo", "design a demo", or any request that involves creating
  a web application to demonstrate Snowplow's behavioral data capabilities. Also triggers when
  the user has an existing demo-spec.json or design-tokens.json and wants to continue the
  build process. If the user wants custom tracking (CDI) or a Signals demo, Phase 4 scopes it
  and orchestrates the Snowplow plugin skills (tracking-design, signals, implementation-guidance)
  to design, publish, and implement it.
---

# Snowplow Demo Builder

Build polished, standards-compliant Snowplow demo web applications. Designed for the SE team. Runs in Claude Code.

This is the router skill. It determines which phase the user is in and points to the right sub-skill. Each phase has its own SKILL.md with detailed instructions, reference files, and templates.

## User interaction

ALWAYS use the `AskUserQuestion` tool when gathering user input. Present clear options with short descriptions. Batch related questions (1-4 per call) to keep things moving. The tool provides an implicit "Other" option for freeform input, so use it even for semi-open questions by offering starting-point options.

Never ask the user to type letter/number choices in chat. Never dump a wall of text and ask the user to parse it.

**Exceptions — do NOT use `AskUserQuestion` when the user needs to type or paste something directly.** In these cases, just ask in plain text and let them respond in chat:
- URLs (design reference, site to match)
- IDs (event specification IDs, data product IDs, organization IDs)
- Email addresses
- Any other raw text input where presenting options would be meaningless

The rule of thumb: if there are reasonable options to present, use `AskUserQuestion`. If the user is just providing a value, ask in chat.

## Workflow phases

Default flow is Phase 1 > 2 > 3 > 4. Users can skip phases explicitly ("I already have a spec," "skip to build," etc.). Before skipping, verify the required input artifact exists.

| Phase | Sub-skill | Input | Output | Gate |
|-------|-----------|-------|--------|------|
| 1. Interview | `skills/demo-interview/SKILL.md` | Conversation | `specs/demo-spec.json` | User confirms spec |
| 2. Design | `skills/demo-design/SKILL.md` | `specs/demo-spec.json` + reference URL/screenshots | `specs/design-tokens.json` + `tailwind.config.ts` + `specs/style-reference.md` | User approves tokens |
| 3. Build | `skills/demo-build/SKILL.md` | `specs/demo-spec.json` + `specs/design-tokens.json` | Working Next.js app with Snowplow baseline | User confirms app works |
| 4. Custom implementation (CDI + Signals) | `skills/demo-tracking-requirements/SKILL.md` | Built app (+ `specs/demo-spec.json` for context) | Published CDI schemas/tracking plan + Signals objects, `specs/custom-implementation.md` | User approves scope |

Phase 4 is optional. Only proceed if the user wants custom tracking and/or a Signals demo beyond the baseline.

Phase 4 is an **orchestration layer** over the Snowplow plugin skills (`tracking-design`, `signals`, `implementation-guidance`) and the Console MCP server. It scopes CDI vs CDI+Signals, drives the design/build/publish through those skills, then **hands off implementation to a subagent** (Snowtype + global contexts). It does not hand-author schemas or tracking code.

**For each phase, read the corresponding sub-skill SKILL.md before starting work.** The sub-skills are located relative to this file in the `skills/` subdirectory. Each contains detailed instructions, and some include reference files, templates, and standards documents that must also be read before writing code.

### Phase routing

When the user invokes this skill, determine which phase to start:

1. **No artifacts exist**: Start at Phase 1 (interview)
2. **`demo-spec.json` exists, no design tokens**: Start at Phase 2 (design)
3. **`demo-spec.json` + `design-tokens.json` exist, no app**: Start at Phase 3 (build)
4. **App exists, user wants custom tracking and/or a Signals demo**: Start at Phase 4 (custom implementation)

If ambiguous, ask the user which phase to start via `AskUserQuestion`.

## Global rules

- **app_id format**: `demo-[scope]-web` where scope is the industry, use case, or company in kebab-case
- **Project folder**: Create the project folder named after the app_id (e.g., `demo-finance-web/`) by **cloning the skeleton** — this is the single source of the plumbing baseline and gives you `specs/`, `screenshots/`, and the whole Snowplow baseline up front. Do this once, at the very start, before delegating to any sub-skill. Never scaffold into the current working directory.
  ```bash
  git clone https://github.com/dje96/demo-skeleton.git demo-[scope]-web
  cd demo-[scope]-web && rm -rf .git && git init -q
  ```
- **Folder structure within the project** (all present in the fresh clone):
  - `specs/` — All spec files. The clone ships `demo-spec.template.json` and `design-tokens.template.json`; sub-skills write the real `demo-spec.json`, `design-tokens.json`, `style-reference.md`, `custom-implementation.md` here.
  - `screenshots/` — All captured screenshots (design reference, site scrapes, verification). Sub-skills save screenshots here.
  - App source code is at the project root (already scaffolded in the skeleton).
- **Terminology**: Use "behavioral data," "data creation" (not "data collection" or "tracking users"). See the Snowplow company context for the full terminology guide.
- **Design quality**: Demos must look polished and distinctive, not like generic AI-generated applications. Study the reference site or industry leaders. Prioritize information density, asymmetric layouts, and restrained use of color.
- **Baseline tracking only**: Do not add custom self-describing events unless the user explicitly moves to Phase 4. Baseline is page views, page pings, link clicks, consent events, and video events.
- **Schemas stay in Console**: Never create schemas via CLI or MCP. All schema creation happens in the Snowplow Console (manually or via the Tracking Design Agent).

## Environment

This skill runs in Claude Code, Codex, or similar. Phase 2 (design extraction) uses Playwright or user-provided screenshots to extract styles from the target site.

## When tools or access are unavailable

If a required tool or external resource is unavailable (browser not connected, Playwright won't install, site blocked by proxy), do NOT silently degrade or fall back to guessing. Stop and tell the user what's needed, then ask how they'd like to proceed via `AskUserQuestion`. Offer concrete alternatives (connect the browser, provide screenshots, switch to a different approach). The user is better positioned to solve access issues than the agent is to work around them.
