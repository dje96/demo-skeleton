# Naming Conventions

## app_id

Format: `demo-[scope]-web`

The scope is the industry, use case, or company name in kebab-case. Examples:
- `demo-media-publishing-web`
- `demo-ecommerce-web`
- `demo-acme-corp-web`
- `demo-financial-services-web`

The app_id is set in `demo-spec.json` during the interview phase and used in the tracker config.

## Project directory

Same as the app_id. Created by cloning the skeleton (see demo-build Step 1):
```bash
git clone https://github.com/dje96/demo-skeleton.git demo-[scope]-web
cd demo-[scope]-web && rm -rf .git && git init -q
```

## File naming

- Components: PascalCase files (e.g., `ConsentManager.tsx`, `DemoFooter.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useSnowplowTracking.ts`)
- Lib modules: kebab-case (e.g., `snowplow-config.ts`, `consent.ts`)
- Config properties: camelCase
- CSS variables: kebab-case with `brand-` prefix (e.g., `--color-brand-primary`)

## Route structure

Follows Next.js App Router conventions:
```
app/
  layout.tsx           # Root layout (server component)
  page.tsx             # Home page
  video/page.tsx       # Video page (baseline)
  [vertical-specific]/ # Custom pages per demo
```

## Directory structure

```
src/
  components/    # React components
  contexts/      # React context providers
  hooks/         # Custom hooks
  lib/           # Utilities, config, Snowplow setup
  styles/        # Global CSS
  types/         # TypeScript type definitions
public/
  images/        # Static images
    products/
    categories/
    heroes/
    articles/
    logos/
  videos/        # Local video assets (if any)
```
