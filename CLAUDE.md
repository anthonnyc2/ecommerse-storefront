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

## Analytics

- GA4 and Clarity load **only in production** (`import.meta.env.PROD`). In dev nothing is sent; `track()` logs events to the console as `[analytics]`.
- All events go through `track()` in `src/services/analytics.ts` (typed event map). Never call `gtag` or `Clarity.event` directly.
- Clicks are tracked with attributes, not listeners: `data-track="click_contact | click_social | select_item"` plus `data-placement` / `data-network` / `data-item-*`.
- Clarity gets only 4 milestone events plus session tags (`producto`, `lista`, `busqueda`, `busqueda_resultados`, `contacto`), defined in `CLARITY_TAGS` in `analytics.ts`. The raw search term is sent as a tag.
- `item_id` is always the product **slug**; the variant goes in `item_variant`.
- Inline `define:vars` scripts cannot import modules: they call `window.rbTrack`.
- Product pages emit schema.org `Product` JSON-LD through `components/JsonLd.astro`, the only place allowed to use `set:html` (it escapes `<`).
- Missing products use `Astro.rewrite("/404")` so the response keeps a real 404 status; `src/pages/404.astro` reports `page_not_found` with the requested path.
- Catalog search/filter/pagination events are sent on page load from the rendered grid (`src/services/catalogAnalytics.ts`), not on click.

## SEO

- Public URLs (canonical, `og:url`, `og:image`) are built from `Astro.site`, never `Astro.url`: behind the proxy `Astro.url` is `localhost:4321`.
- The default social image is `public/og-default.png` (1200×630). SVG does not work as `og:image`.
- Every page passes its own `description` to `Layout`. Product pages build theirs from the product (fallback in `producto/[slug].astro`, max 160 chars).
- `@astrojs/sitemap` only sees static pages. Products live in `src/pages/sitemap-productos.xml.ts` (reads the whole API) and are listed in the index through `customSitemaps` in `astro.config.mjs`.
- JSON-LD: `ClothingStore` + `WebSite` on the home, `Product` + `BreadcrumbList` on products, all via `JsonLd.astro`.

## Quick add (product cards)

- Each `ProductCard` has an "Agregar" button. One in-stock variant: it adds directly. Several: it opens the shared `<dialog>` in `components/QuickAddSheet.astro` (mounted once in `Layout`).
- Variant rules live in `services/quickAdd.ts` (pure, unit-tested); DOM wiring in `services/quickAddUi.ts`. Cards carry `data-variants` as `[id, color, size, price]` tuples (in-stock only) and `data-color-images`, so cards rendered by the infinite-scroll action work with no extra code.
- The card root is a `<div data-item-id>` with a stretched link on the title (a button cannot live inside a link). Code that counts or reads cards must use `[data-item-id]`, not `a`.
- Cart item `id` is the variant id, the same as the product page, so both paths merge into one line. `add_to_cart` items carry `item_list_name` (`catalogo`, a category, `busqueda`, `destacados`).

## Catalog search

- On desktop (>=1024px) the search runs by itself 400 ms after the shopper stops typing (min 2 characters; emptying the field clears it). On phones it still needs Enter or the button: a search reloads the page, which would close the keyboard. Logic and tests live in `services/searchAutoSubmit.ts`.
- After an automatic search the page puts the cursor back at the end of the field (flag in `sessionStorage`). Keys typed while the page is reloading are lost.

## Sold-out products

- `GET /products/{slug}` also returns active products with no stock (every variant at `stock: 0`); only inactive or unknown slugs are 404. The product page then shows an "Agotado" block with a WhatsApp link and up to 4 similar products instead of the purchase buttons, and the JSON-LD says `OutOfStock`.
- Sold-out products stay out of the catalog listing and the product sitemap, which only list products with stock. The page needs the API from `admin-rb` to be deployed first; with the old API it still falls back to the 404.

---

## Home hero collage

- `HeroCollage.astro` shows three photos (one per category) beside the hero text on desktop and below the button on mobile. Each photo links to `/catalogo?category=<name>`, never to a product (most products have 1 unit and would sell out).
- `services/heroCollage.ts` holds `HERO_SLOTS`: per slot, product slugs in order of preference. `pickHeroTiles` takes the first in-stock one (`getProductBySlug`). The collage only renders when every slot is filled; otherwise the hero stays centered text.
- The slugs were chosen because their photos have no supplier watermarks ("Generado por IA", "Cotton", badges). Keep that in mind when changing them. Replace them with the shop's own photos when available.

## UI building blocks

- Buttons: `class="btn btn-<variant> btn-<size>"` plus layout classes (`w-full`, `gap-2`). Variants: `btn-primary` (pink, the main action everywhere, including add to cart), `btn-outline` (white with border), `btn-whatsapp`, `btn-plum` and `btn-outline-dark` (landing/product page), `btn-glass` (round buttons over photos), `btn-success` (the brief "added" flash). Sizes: `btn-sm`, `btn-md`, `btn-lg`, `btn-xl` (hero and checkout). `btn` already adds the press effect (`active:scale-95`) and the focus ring. Do not copy long class strings for new buttons.
- Defined in `src/styles/global.css`: `focus-ring`, `btn*`, `filter-title`, and the tokens `--color-whatsapp`, `--text-chip` (11px), `--text-badge` (10px). No hex colors or `text-[Npx]` in components.
- Form controls: `field` (search input and selects, rounded-full; add `pl-*`/`pr-*` on the element), `check` (filter checkboxes). Options the shopper picks: `choice` + `choice-idle` or `choice-selected` (filters use `peer-checked:choice-selected`). Static card tags: `chip` and `chip-more`. Selection is pink (`secondary`) everywhere; `primary` (lavender) is only for hovers.
- Shape and type rules: buttons, inputs and selects are `rounded-full`; chips, options and checkboxes `rounded-md`; product cards `rounded-xl`; dialogs and panels `rounded-2xl`. Borders: `gray-200` for separators and static tags, `gray-400` for controls the shopper uses. Type: page title `text-3xl font-bold`, drawer or panel title `panel-title`, group label `filter-title`, body `text-sm`. Icon-only buttons: `btn btn-icon` (close, 40px), `btn btn-icon-sm` (cart quantity, 32px), `btn btn-icon-danger` (cart remove). Contact channels on `/contacto` are `ContactCard.astro` (link cards get the focus ring; pass tracking attributes through `attrs`).
- Text contrast: never use `text-secondary` or `text-primary` for text or icons on white (1.6:1); use `text-berry`. Gray text on white is `gray-500` or darker (`gray-400` only on the dark footer). `btn-whatsapp` uses dark text on the green.
- `quickAddUi.ts` swaps `btn-primary` for `btn-success` on the card button; keep both class names in sync with `global.css`.
- Catalog filters live in `components/FilterGroups.astro` (rendered once for the desktop sidebar and once for the mobile drawer, `variant` picks the `-mobile` class names the page script binds to). The loading skeleton is `ProductCardSkeleton.astro`: change it together with `ProductCard.astro`.

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
