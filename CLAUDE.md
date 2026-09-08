# CLAUDE.md — raquelboutique

Public-facing storefront for Raquel Boutique. Built with Astro 5, Tailwind CSS v4, and Nano Stores. Self-hosted on DigitalOcean via Coolify. Part of the Raquel Boutique ecosystem — see parent `../CLAUDE.md` for ecosystem overview.

---

## Tech Stack

| Layer          | Technology                                            |
| -------------- | ----------------------------------------------------- |
| Framework      | Astro 5 (SSR via `@astrojs/node`, standalone mode)    |
| Styling        | Tailwind CSS v4 + `@tailwindcss/forms`                |
| State          | Nano Stores + `@nanostores/persistent` (localStorage) |
| Deployment     | Self-hosted (DigitalOcean + Coolify)                  |
| Error tracking | Sentry (`@sentry/astro`)                              |
| Analytics      | Microsoft Clarity + Google Analytics                  |
| Testing        | Vitest + jsdom + Testing Library                      |
| Node version   | 24.13.1 (enforced in `package.json`)                  |

## Key Scripts

```bash
pnpm run dev        # Start dev server
pnpm run build      # Production build
pnpm run preview    # Preview production build
pnpm run typecheck  # astro check (TypeScript)
pnpm run lint       # ESLint
pnpm run format     # Prettier (write)
pnpm run test       # Vitest run
```

> **Note:** Requires Node 24.13.1 (`nvm use 24.13.1`) and pnpm 10.x via corepack.

---

## Project Structure

```
src/
  assets/       # Images and SVGs
  components/   # Reusable Astro components
  data/         # Static product data (products.ts, output.json)
  layouts/      # Layout.astro — main HTML shell
  pages/        # File-based routing
    index.astro
    catalogo.astro
    contacto.astro
    producto/[slug].astro
  services/
    api.ts        # All API calls to the backend
    cartStore.ts  # Nano Store for cart (persistent)
  styles/
    global.css    # Tailwind @theme tokens
  types/
    api.ts        # All TypeScript interfaces (Product, Variant, etc.)
```

---

## Architecture Patterns

- **Astro Islands**: Zero JS by default. Add interactivity only where needed with `client:*` directives.
- **Server-side data fetching**: Fetch data in the frontmatter of `.astro` files. Do not fetch in the browser unless unavoidable.
- **API layer**: All calls to the backend go through `src/services/api.ts`. Never fetch directly from pages or components.
- **Cart state**: Managed exclusively via `src/services/cartStore.ts` (Nano Stores). Cross-component communication uses custom DOM events (e.g., `toggle-cart`).
- **URL query params**: Used for filter/sort/pagination state in the catalog — no client-side router.
- **Image optimization**: Use Cloudinary URL transformation for resizing. Apply `loading="lazy"` and `fetchpriority` hints.

---

## Data & Types

- All TypeScript interfaces live in `src/types/api.ts` — always type API responses against these.
- Key types: `Product`, `PublicProductWithDetails`, `PublicProductVariant`, `ProductImage`, `ApiResponse<T>`, `CatalogFiltersData`.
- Product data model: `categories` (array), `color` (string), `images` (array of URLs), `sizes` (array), `variants` (SKU, price, stock).
- The backend API is at `PUBLIC_API_URL` (env var). See `src/services/api.ts` for all available endpoints.

---

## Brand & UI

### Colors (defined in `src/styles/global.css` via `@theme`)

| Token               | Hex       | Usage                                             |
| ------------------- | --------- | ------------------------------------------------- |
| `--color-primary`   | `#E3CCEF` | Lavender — nav hovers, focus rings, main accents  |
| `--color-secondary` | `#FFB8D2` | Pink — buttons, interactive elements, card hovers |
| `--color-accent`    | `#F7D1A4` | Peach — reserved for future use                   |

### Typography

- Font: **Outfit** (Google Fonts, weights 300–600), loaded with preload optimization.

### Design Principles

- Clean, feminine, minimalist aesthetic suited to a fashion brand.
- Follow `.agents/skills/frontend-design/SKILL.md` for UI decisions.
- Follow `.agents/skills/accessibility/SKILL.md` — semantic HTML, keyboard nav, ARIA where necessary.
- Do NOT modify existing text, input styles, or buttons unless explicitly requested.

---

## Code Quality (SonarJS + ESLint)

Same thresholds as the rest of the ecosystem:

- **Cognitive Complexity**: max **15** (`sonarjs/cognitive-complexity`)
- **No duplicate strings**: enforced (`sonarjs/no-duplicate-string`)
- `no-set-html-directive` in Astro files: **error** (XSS prevention)
- No `any` — use `unknown` + narrowing
- Unused vars prefixed with `_` are allowed

## Formatting (Prettier)

- Double quotes `"`
- Semicolons `;`
- 2-space indentation
- Trailing commas
- `prettier-plugin-astro` for `.astro` files

---

## Environment Variables

```
PUBLIC_API_URL=            # Backend API base URL
PUBLIC_CLARITY_PROJECT_ID= # Microsoft Clarity
PUBLIC_SENTRY_DSN=         # Sentry DSN
PUBLIC_SENTRY_AUTH_TOKEN=  # Sentry auth token
```

See `.env.example` for reference.
