---
name: demo-interview
description: >
  Scope a Snowplow demo through a guided interview and produce a structured demo-spec.json.
  Use this skill whenever starting a new demo build from scratch, or when the user needs to
  create or update a demo specification. Triggers on: "new demo", "build a demo", "demo for
  [company/industry]", "start a demo", "demo interview", "demo spec", or any request that
  implies scoping a new Snowplow demo application.
---

# Demo Interview

Guide the user through a structured interview to scope a Snowplow demo application. The output is a `demo-spec.json` file that downstream skills (design, build) consume as their primary input.

## User interaction

Follow the AskUserQuestion conventions from the router skill. Exception for this phase: do NOT use `AskUserQuestion` when the user needs to paste URLs, company names, IDs, or email addresses.

## Philosophy

Be opinionated. The SE building this demo may not have strong opinions about page structure or functionality depth, and that's fine. Propose a smart default based on the industry and use case, then let them adjust. The interview should feel like a conversation with a knowledgeable colleague, not a blank form.

## Interview flow

Work through these topics in order. Batch related questions where it makes sense (the tool supports 1-4 questions per call). Not every question needs its own call.

### 1. Demo focus

**Demo focus** (header: "Focus"):
- "Industry vertical" — Build a generic demo for an industry (media, ecommerce, fintech, etc.)
- "Specific company" — Match a real company's branding and use case
- "Use case" — Focus on a Snowplow capability (real-time personalization, marketing attribution, etc.)

If they pick "Industry vertical," follow up asking which industry. If they pick "Specific company," ask for the company name. These are conversational follow-ups, not formal interview steps.

### 2. Demo story

This is one of the few semi-open questions. Use `AskUserQuestion` with story templates as starting points:

**Story templates** (header: "Story", multiSelect: false):
- "Data quality and governance" — Show how Snowplow validates data at creation time, not after the fact
- "Real-time personalization" — Demonstrate Signals-powered experiences that adapt to user behavior
- "Marketing attribution" — Capture granular campaign and channel data for accurate attribution
- "Customer 360 / identity" — Stitch anonymous and identified sessions into a complete user journey

The user can pick one as a base or select "Other" to describe their own narrative. Either way, ask them to add a sentence or two of context about what resonates with the prospect.

### 3. Pages, features, and functionality depth

The homepage is always included — do not ask about it. Ask the user which **other** pages, features, or tools they want in the demo. Propose industry-appropriate suggestions as a multi-select, and let them add more via "Other."

**Industry-specific suggestions** (header: "Pages & Features" — the homepage is already included):

Media / publishing:
- Article detail page
- Subscription or paywall flow
- User profile / reading history
- Category or search page

E-commerce:
- Product listing / category page
- Product detail page
- Shopping cart
- Checkout flow

Financial services:
- Transaction history
- Product comparison
- Account onboarding
- Settings / preferences

SaaS / B2B:
- Feature detail pages
- Pricing page
- Signup / onboarding flow
- App dashboard

Healthcare / pharma:
- Provider directory
- Appointment scheduling
- Patient portal dashboard
- Health content library
- Prescription management

If the focus is a specific company, study their actual site structure and propose pages that mirror it. If the use case doesn't fit a standard industry template, ask what pages they need. Ask clarifying questions about any page or feature whose scope is ambiguous.

### 4. Functionality depth (per page)

After confirming pages, ask about functionality depth **for each page individually**. Present this as a batch — list each selected page and ask the user to pick a depth for it. Propose a sensible default per page (e.g., a checkout flow benefits from semi-functional, while an "about" page is fine at surface-level).

**Depth options per page** (header: "Depth for [page name]"):
- "Surface-level" — Looks authentic but nothing is interactive beyond navigation and Snowplow tracking
- "Semi-functional" — Key interactions work (filters, search, modals) but no real backend (recommended default for most pages)
- "Fully functional" — As close to a real app as possible within the demo scope

To keep the interview moving, you can present all pages at once with recommended defaults and let the user override only the ones they disagree with. Don't force them to answer individually for every page if the defaults look right.

### 5. Visual reference and images (batch these)

Ask two questions in a single call:

**Design reference** (header: "Design"):
- "Match a website" — Provide a URL and the design skill will extract its style
- "Brand guidelines" — Upload screenshots or brand assets
- "Propose a direction" — The design skill picks a polished style based on the industry

**Image approach** (header: "Images"):
- "Scrape from reference" — Pull images from the target site (fastest, works well when matching a real company)
- "AI-generated" — Generate unique images (takes longer, more distinctive)
- "Icons and placeholders" — Use Lucide icons and vector illustrations (simplest, most reliable)

### 6. Custom tracking

**Custom tracking** (header: "Tracking"):
- "Yes, beyond baseline" — I'll need custom events for specific interactions
- "No, baseline is enough" — Page views, link clicks, consent, and video tracking cover my needs

If they select yes, follow up with a multi-select of common tracking areas relevant to their industry:

Media: content engagement, subscription funnel, ad interaction, search behavior
E-commerce: product interaction, cart behavior, checkout funnel, wishlist activity
Fintech: transaction tracking, product comparison, onboarding completion, alert interaction
SaaS: feature adoption, onboarding progress, upgrade funnel, search and discovery
General: form interaction, scroll depth, error tracking, A/B test exposure

The user picks areas of interest. These are stored as high-level labels, not event definitions. Schema design happens later in Phase 4.

## Generating the spec

After collecting all inputs, generate `demo-spec.json` and present it for confirmation.

### app_id derivation

Format: `demo-[scope]-web`

The scope comes from the focus:
- Industry: use the industry name in kebab-case (e.g., `demo-media-publishing-web`)
- Company: use the company name in kebab-case (e.g., `demo-acme-corp-web`)
- Use case: use a short descriptor (e.g., `demo-real-time-personalization-web`)

### demo-spec.json schema

```json
{
  "demoName": "Human-readable name for the demo",
  "appId": "demo-[scope]-web",
  "focus": {
    "type": "industry | company | useCase",
    "value": "The specific industry, company name, or use case"
  },
  "story": "The narrative thread — what problem does this demo solve and why does it matter",
  "pages": [
    {
      "name": "Page name",
      "path": "/route-path",
      "description": "What this page shows and does",
      "functionality": "surface | semi-functional | fully-functional",
      "features": ["Key interactive elements on this page"]
    }
  ],
  "designReference": {
    "type": "url | screenshots | proposed",
    "value": "URL, file paths, or 'industry-default'",
    "notes": "Any specific design notes from the user"
  },
  "imageApproach": "scrape | ai-generated | icons-placeholders",
  "customTracking": {
    "needed": true,
    "areas": ["High-level tracking area labels"]
  },
  "snowplowBaseline": true
}
```

The `snowplowBaseline` field is always `true`. Every demo includes baseline Snowplow tracking (page views, page pings, link clicks, consent events, video events). This field exists so downstream skills can confirm it.

### Confirmation

Present the generated spec to the user via `AskUserQuestion`:

**Spec review** (header: "Spec"):
- "Looks good, proceed to design" — Save the spec and move to Phase 2
- "Needs changes" — Specify what to adjust

If changes are needed, make them conversationally and re-confirm. Don't re-run the full interview.

## Output

Create the project directory named after the app_id (e.g., `demo-media-publishing-web/`) and save `demo-spec.json` into its `specs/` subfolder (e.g., `demo-media-publishing-web/specs/demo-spec.json`). Create the `specs/` folder at this point. The `screenshots/` folder is created by the router skill as part of the standard project structure — do not duplicate that here.

## What this skill does NOT do

- Design anything visual (that's Phase 2)
- Build any code (that's Phase 3)
- Define tracking schemas, event names, or properties (that's Phase 4)
- Make assumptions about Snowplow product capabilities without flagging uncertainty

## Edge cases

- **User already has a partial spec**: Load it, fill in gaps via targeted questions, and confirm the complete spec.
- **User wants to update an existing spec**: Load the existing `demo-spec.json`, ask what changed, update, and re-confirm.
- **User skips straight to build**: Check if `demo-spec.json` exists. If not, run a condensed interview (focus + pages + design reference minimum). If it exists, validate it has the required fields and proceed.
