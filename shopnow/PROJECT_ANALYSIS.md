# Project analysis

## 1. Structure analysis from the uploaded template

The uploaded file was a single HTML document with React running in the browser and all state stored in `localStorage`.
The main structural areas were:

- social-login landing screen
- authenticated shell with dashboard/storefront toggle
- dashboard tabs:
  - products and categories
  - links and profile
  - orders
  - settings
- storefront with hero banner, category sections, cart drawer, and checkout modal

## 2. Migration decisions

To keep the same behavior while making it production-ready enough for extension, the project was split into:

- server-rendered page routes
- JSON API routes for CRUD
- MongoDB models for persistence
- one main client component for the interactive UI

## 3. Routing design

### Page routes

- `/` and `/dashboard`
  - dashboard-first app entry
  - still includes the storefront toggle like the original template
- `/store/[slug]`
  - public storefront route
  - dynamic slug supports future multi-store expansion

### API routes

- `bootstrap`
  - returns all required dashboard/storefront data in one payload
- resource CRUD routes
  - products
  - categories
  - links
  - profile
  - orders

## 4. Database schema design rationale

### Why `storeSlug` is repeated across models

This keeps queries simple and makes it easier to split into multi-store mode later.
Even though the current implementation seeds one store, the design does not trap you in a single-store database shape.

### Why `categoryIds` is stored on products

The original UI assigns products to multiple categories. Storing category references directly on the product preserves that behavior cleanly.

### Why order items are embedded

Orders should remain stable even if a product title or price changes later. Embedding the purchased snapshot makes order history accurate.

## 5. Payment handling decision

As requested, all online payments were skipped.
The checkout UI and order schema are locked to:

- `Cash on delivery`

This prevents accidental gateway use and keeps the codebase simple until you want to integrate payments later.

## 6. Editing hotspots

Most likely files you will edit first:

- `components/AppClient.js` for UI behavior
- `app/globals.css` for styling
- `models/*` for schema changes
- `app/api/*` for backend logic
- `lib/constants.js` for seed/demo content

## 7. Suggested future upgrades

- NextAuth or Clerk for real authentication
- image upload to Cloudinary or S3 instead of raw URLs
- inventory stock field on products
- coupon/promo code support
- division/district/thana fields for shipping in Bangladesh
- admin role protection on API routes
- bKash/Nagad/SSLCommerz integration later if needed
