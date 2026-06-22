## What I'm building

A complete India-ready ecommerce site for **TECHLAB** (niche tech / keypad Android & minimalist gadgets), matching the design of the three reference HTML mockups: minimalist black/white, Hanken Grotesk, Shopify-style borders, Material Symbols icons.

This is a large build. I'll ship it in clearly-scoped phases so you see progress and can correct course.

---

## Phase 1 — Design system + storefront UI

Goal: pixel-faithful translation of the three mockups, click-through navigation, mock product data.

- Tailwind v4 tokens in `src/styles.css` matching the reference palette (primary `#000`, surface `#f9f9f9`, on-surface `#1b1b1b`, outline-variant `#cfc4c5`, etc.)
- Hanken Grotesk + Material Symbols Outlined loaded in `__root.tsx`
- Shared layout: sticky header (Shop / Catalog / About / Journal + search/account/cart), footer
- Routes:
  - `/` — Hero, trending grid, keypad collection feature, minimalist daily drivers, newsletter
  - `/catalog` — filterable product grid (Phones / Audio / Accessories / Wearables)
  - `/product/$slug` — Qin F22 Pro–style PDP: gallery, specs, variants, add-to-cart
  - `/cart`, `/checkout`
  - `/account`, `/account/orders`, `/account/orders/$id`
  - `/auth` (email + Google sign-in)

## Phase 2 — Lovable Cloud backend

- Enable Cloud
- Schema (with GRANTs + RLS):
  - `categories`, `products`, `product_variants`, `product_images`
  - `profiles` (auto-created on signup), `addresses`
  - `carts`, `cart_items`
  - `orders`, `order_items`, `order_events`
  - `app_role` enum + `user_roles` + `has_role()` (admin gate)
- Server functions for catalog reads (publishable client, anon-safe), cart, checkout, order history
- Seed migration with ~12 demo products

## Phase 3 — Admin dashboard (`/_authenticated/admin/*`, gated by `has_role(admin)`)

- Overview (revenue, orders, low stock)
- Products CRUD (create/edit/delete, images, variants, stock)
- Orders list + detail (status, fulfillment, Shiprocket actions)
- Customers, Categories

## Phase 4 — Razorpay (test-mode-ready, keys later)

- Secrets slots: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Server fn `createRazorpayOrder` — creates RZP order, returns order_id + key_id
- Client checkout uses Razorpay Checkout JS (`checkout.razorpay.com/v1/checkout.js`)
- Public webhook route `/api/public/webhooks/razorpay` — HMAC-verified, marks order paid, triggers Shiprocket
- Failure / pending / refund handling

## Phase 5 — Shiprocket

- Secrets slots: `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` (token cached in DB)
- Server fns: `shiprocketAuth`, `createShipment`, `getCourierServiceability`, `trackShipment`, `cancelShipment`
- Triggered automatically after successful payment; manually re-triggerable from admin
- Tracking page `/account/orders/$id/track`

## Phase 6 — Legal pages (India-compliant baseline)

All in main nav footer, plain factual copy with `[Business Name]` / `[Address]` / `[GSTIN]` placeholders you can fill in:

- `/legal/terms` — Terms & Conditions
- `/legal/privacy` — Privacy Policy
- `/legal/shipping` — Shipping & Delivery Policy
- `/legal/returns` — Return & Refund Policy
- `/legal/cancellation` — Cancellation Policy
- `/legal/contact` — Contact Us (mandatory under Consumer Protection (E-Commerce) Rules 2020)
- `/legal/about` — About Us
- Cookie banner (consent stored in localStorage)

These pages are required for Razorpay KYC and India's E-Commerce Rules 2020. Copy will be factual and conservative — you (or your lawyer) should review before going live.

## Phase 7 — SEO / polish

- Per-route `head()` meta (title, description, OG, Twitter)
- `sitemap.xml` server route enumerating static + product routes
- `robots.txt`
- JSON-LD `Product` schema on PDPs

---

## Technical notes

- Stack stays as-is: TanStack Start + Tailwind v4 + shadcn + Lovable Cloud (Supabase under the hood)
- Razorpay is **not** in Lovable's built-in Payments (Stripe/Paddle/Shopify) — implemented directly via REST API + server functions, secrets via `add_secret`
- Shiprocket likewise — direct REST integration
- All money in paise (INR smallest unit) server-side; rendered as ₹ on client
- Admin role assigned via `user_roles` table — I'll wire it so the first signed-up user can be promoted via a one-off SQL snippet I'll give you

## What I need from you later (not now)

- Razorpay test Key ID + Key Secret (from dashboard.razorpay.com → Settings → API Keys)
- Shiprocket account email + password (from app.shiprocket.in)
- Business name, address, GSTIN, support email/phone for legal pages

I'll prompt for each at the right moment via the secrets form. For now I'll use placeholders and `[BUSINESS NAME]`-style tokens you can find-and-replace.

## Starting point

I'll begin with Phase 1 (design system + storefront UI) right after you approve this plan.