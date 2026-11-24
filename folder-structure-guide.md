# 📁 Octagonetoys — Folder Structure Guide

> **Project root:** `f:\Octagonetoys\ecommerce\`  
> Think of this project as two apps living in one codebase: a **Customer Store** and an **Admin Panel**.

---

## 🗺️ Big Picture — 1-Line Summary per Folder

```
ecommerce/
├── app/              ← All pages & API routes (Next.js App Router)
├── components/       ← Reusable UI building blocks (React)
├── lib/              ← Backend brain (DB, models, auth, helpers)
├── public/           ← Static files (images, logos, favicon)
├── scripts/          ← One-off tools (seed DB, test DB connection)
├── tests/            ← Automated tests
├── assets/           ← Source brand images (not served directly)
├── design/           ← Architecture notes / data model docs
├── .env.local        ← Secret keys (MongoDB URI, JWT secret)
├── next.config.mjs   ← Next.js configuration
└── package.json      ← Installed packages list
```

---

## 📂 1. `app/` — Pages & API Routes

This is the **heart of Next.js App Router**. Every folder here becomes a URL.

```
app/
├── layout.js                    ← Root HTML wrapper for the ENTIRE site
├── globals.css                  ← Global CSS (Tailwind base styles)
├── robots.js                    ← SEO: tells Google what to crawl
├── sitemap.js                   ← SEO: auto-generated sitemap
│
├── (storefront)/                ← 👕 CUSTOMER-FACING pages
│   ├── layout.js                ← Wraps all customer pages with Header + Footer
│   ├── page.js                  ← Home page  → URL: /
│   ├── shop/page.js             ← All products → URL: /shop
│   ├── product/[slug]/          ← Single product → URL: /product/toy-car
│   ├── collections/page.js      ← All collections → URL: /collections
│   ├── collections/[slug]/      ← Single collection → URL: /collections/action-toys
│   ├── cart/page.js             ← Cart page → URL: /cart
│   ├── checkout/page.js         ← Checkout form → URL: /checkout
│   ├── order/[orderNumber]/     ← Order confirmation → URL: /order/OCT-1001
│   ├── login/page.js            ← Customer login → URL: /login
│   ├── register/page.js         ← Sign up → URL: /register
│   ├── account/page.js          ← My account → URL: /account
│   ├── about/page.js            ← About us → URL: /about
│   ├── contact/page.js          ← Contact → URL: /contact
│   └── error.js / not-found.js  ← Error pages
│
├── admin/                       ← 🔐 ADMIN PANEL pages
│   ├── login/page.js            ← Admin login → URL: /admin/login
│   └── (protected)/             ← All pages behind auth check
│       ├── layout.js            ← Admin sidebar + navbar wrapper
│       ├── page.js              ← Dashboard → URL: /admin
│       ├── products/            ← Product list + add/edit → URL: /admin/products
│       ├── collections/         ← Collections → URL: /admin/collections
│       ├── orders/              ← Orders list → URL: /admin/orders
│       ├── inventory/           ← Stock levels → URL: /admin/inventory
│       ├── reviews/             ← Approve/reject reviews → URL: /admin/reviews
│       ├── customers/           ← Customer list → URL: /admin/customers
│       ├── settings/            ← Store settings → URL: /admin/settings
│       └── discounts/           ← Discounts → URL: /admin/discounts
│
└── api/                         ← 🔌 API ENDPOINTS (backend logic)
    ├── auth/                    ← Login, logout, register, me
    │   ├── login/route.js       → POST /api/auth/login
    │   ├── logout/route.js      → POST /api/auth/logout
    │   ├── register/route.js    → POST /api/auth/register
    │   └── me/route.js          → GET  /api/auth/me
    │
    ├── admin/                   ← 🔐 Admin-only API (requires JWT)
    │   ├── products/route.js    → GET/POST  /api/admin/products
    │   ├── products/[id]/       → GET/PUT/DELETE /api/admin/products/:id
    │   ├── collections/route.js → GET/POST  /api/admin/collections
    │   ├── collections/[id]/    → GET/PUT/DELETE /api/admin/collections/:id
    │   ├── orders/route.js      → GET       /api/admin/orders
    │   ├── orders/[id]/         → GET/PATCH /api/admin/orders/:id
    │   ├── reviews/route.js     → GET/PATCH /api/admin/reviews
    │   ├── stats/               → GET       /api/admin/stats (dashboard numbers)
    │   └── me/route.js          → GET       /api/admin/me
    │
    ├── products/route.js        → GET  /api/products        (public, customers)
    ├── products/[slug]/         → GET  /api/products/:slug  (public)
    ├── collections/route.js     → GET  /api/collections     (public)
    ├── checkout/route.js        → POST /api/checkout        (place order)
    ├── reviews/route.js         → POST /api/reviews         (submit review)
    └── health/route.js          → GET  /api/health          (is server alive?)
```

> **Key rule:** `(storefront)` and `(protected)` with parentheses are **Route Groups** in Next.js.  
> The parentheses mean the folder name does **NOT** appear in the URL — it's just for organization.

---

## 📂 2. `components/` — Reusable UI Pieces

These are React components — pieces of UI you drop into pages.

```
components/
├── admin/                       ← Admin panel UI components
│   ├── AdminShell.js            ← Admin sidebar + layout wrapper
│   ├── AdminLoginForm.js        ← Admin login form
│   ├── ProductForm.js           ← Add/Edit product form
│   ├── ProductsClient.js        ← Products list table (client-side)
│   ├── CollectionForm.js        ← Add/Edit collection form
│   ├── CollectionsClient.js     ← Collections list
│   ├── OrdersClient.js          ← Orders list table
│   ├── OrderDetailClient.js     ← Single order detail view
│   ├── ReviewsClient.js         ← Approve/reject reviews
│   ├── DashboardClient.js       ← Dashboard charts & stats
│   ├── InventoryClient.js       ← Stock management table
│   ├── CustomersClient.js       ← Customer list
│   ├── SettingsForm.js          ← Store settings form
│   ├── adminFetch.js            ← Helper: adds auth token to admin API calls
│   └── ui.js                   ← Shared UI atoms (buttons, modals, etc.)
│
├── storefront/                  ← Customer-facing UI components
│   ├── Header.js                ← Top navigation bar
│   ├── Footer.js                ← Site footer
│   ├── ProductCard.js           ← Product card shown in grids
│   ├── ProductGallery.js        ← Image gallery on product page
│   ├── ProductActions.js        ← Add to cart button + quantity
│   ├── AddToCartButton.js       ← Just the cart button
│   ├── CartView.js              ← Cart sidebar/page
│   ├── CheckoutForm.js          ← Checkout form
│   ├── ReviewForm.js            ← Submit a review
│   ├── LoginForm.js             ← Customer login form
│   ├── RegisterForm.js          ← Sign up form
│   ├── AccountSettings.js       ← My account page
│   ├── Pagination.js            ← Page 1, 2, 3... navigation
│   └── WhatsAppButton.js        ← Floating WhatsApp contact button
│
└── providers/                   ← Global state wrappers
    ├── CartProvider.js          ← Cart state available everywhere
    └── SettingsProvider.js      ← Store settings (name, logo, etc.) available everywhere
```

---

## 📂 3. `lib/` — The Backend Brain

This folder contains all the **server-side logic** that the API routes use.  
**You never import `lib/` from a customer-facing page — only from API routes.**

```
lib/
├── mongoose.js                  ← Connects to MongoDB (singleton — one connection)
├── auth.js                      ← Generate & verify JWT tokens
├── constants.js                 ← Shared values (order statuses, etc.)
├── format.js                    ← Price formatting (paisa → "Rs 500")
├── serialize.js                 ← Convert MongoDB objects to plain JSON
│
├── middleware/                  ← Route guards
│   ├── auth.js                  ← Reads JWT from cookie or header
│   ├── withAdminAuth.js         ← Blocks non-admin users (wraps admin routes)
│   └── withCustomerAuth.js      ← Blocks unauthenticated customers
│
├── models/                      ← 🗃️ Database schemas (what data looks like)
│   ├── Product.js               ← Product schema (name, price, stock, images...)
│   ├── Collection.js            ← Collection schema (name, products list...)
│   ├── Order.js                 ← Order schema (items snapshot, shipping, status...)
│   ├── User.js                  ← User schema (email, password hash, role...)
│   ├── Review.js                ← Review schema (rating, text, approved?)
│   ├── Discount.js              ← Discount codes schema
│   ├── Setting.js               ← Store settings schema (store name, logo...)
│   └── Message.js               ← Contact form messages schema
│
└── server/                      ← Reusable server-side helper functions
    ├── checkout.js              ← Checkout logic (stock decrement, order create)
    ├── email.js                 ← Send order confirmation emails
    ├── validation.js            ← Input validation helpers
    ├── data.js                  ← Common DB query helpers
    ├── collections.js           ← Collection-specific queries
    ├── settings.js              ← Load/save store settings
    ├── rating.js                ← Calculate average star rating
    ├── rateLimit.js             ← Prevent spam (too many requests)
    ├── session.js               ← Session/cookie helpers
    ├── account.js               ← Customer account helpers
    ├── passwordReset.js         ← Forgot password flow
    ├── imageValidation.js       ← Check image URLs
    ├── cloudinary.js            ← Image upload to Cloudinary
    └── api.js                   ← Generic API fetch helper (server-side)
```

---

## 📂 4. `public/` — Static Files

Anything here is served directly by the web server — no code needed.

```
public/
├── brand/
│   ├── logo.png                 ← Main logo (used in Header)
│   └── logo-square.png          ← Square logo (used in favicon, admin)
├── demo/                        ← Demo product images for testing
│   ├── toy-car.jpg
│   └── ...
├── uploads/                     ← User-uploaded product images (local dev)
└── favicon.ico                  ← Browser tab icon
```

> **Rule:** To use an image from `public/` in code, write `/brand/logo.png` (no "public" prefix).

---

## 📂 5. `scripts/` — Developer Tools

One-off scripts you run from the terminal. They are NOT part of the website.

```
scripts/
├── check-db.js          ← Test: can we connect to MongoDB?
├── seed-admin.js        ← Creates admin@store.com account in DB
├── seed-demo.js         ← Fills DB with demo products & collections
└── generate-demo-images.js  ← Creates placeholder product images
```

**How to run:** `node scripts/check-db.js`

---

## 📂 6. `tests/` — Automated Tests

These verify that specific pieces of code work correctly.

```
tests/
├── models.test.js        ← Tests all DB schemas (Product, Order, etc.)
├── auth.test.js          ← Tests login/JWT logic
├── checkout.test.js      ← Tests order placement logic
├── validation.test.js    ← Tests input validation
├── format.test.js        ← Tests price formatting
└── ...
```

---

## 📂 7. Config Files (Root Level)

| File | What it does |
|------|-------------|
| `.env.local` | **Secret keys** — MongoDB URI, JWT secret. Never share this! |
| `.env.example` | Template showing what keys are needed (safe to share) |
| `package.json` | Lists all installed npm packages + run scripts |
| `next.config.mjs` | Next.js settings (image domains, redirects, etc.) |
| `jsconfig.json` | Tells VS Code about `@/` path alias |
| `postcss.config.mjs` | Tailwind CSS processing setup |
| `eslint.config.mjs` | Code quality rules |

---

## 🧭 How It All Connects — Flow Diagram

```
Customer visits /product/toy-car
        │
        ▼
app/(storefront)/product/[slug]/page.js   ← PAGE (React, renders HTML)
        │
        │ calls
        ▼
app/api/products/[slug]/route.js          ← API ROUTE (backend logic)
        │
        │ uses
        ▼
lib/models/Product.js                     ← MODEL (MongoDB schema)
        │
        │ queries
        ▼
MongoDB Atlas                             ← DATABASE (real data)
```

---

## 🔐 Admin Flow

```
Admin visits /admin/products
        │
        ▼
app/admin/(protected)/products/page.js    ← Admin PAGE
        │
        │ renders
        ▼
components/admin/ProductsClient.js        ← Admin UI Component
        │
        │ calls (with JWT token)
        ▼
app/api/admin/products/route.js           ← PROTECTED API ROUTE
        │
        │ verified by
        ▼
lib/middleware/withAdminAuth.js           ← AUTH GUARD
        │
        │ queries
        ▼
lib/models/Product.js → MongoDB           ← DATABASE
```

---

## 💡 Simple Rule: What to Edit for Common Tasks

| Task | File(s) to Edit |
|------|----------------|
| Change home page content | `app/(storefront)/page.js` |
| Change header / navbar | `components/storefront/Header.js` |
| Change how product cards look | `components/storefront/ProductCard.js` |
| Add a new product field to DB | `lib/models/Product.js` |
| Change how orders are listed in admin | `components/admin/OrdersClient.js` |
| Change admin sidebar links | `components/admin/AdminShell.js` |
| Change checkout logic | `lib/server/checkout.js` + `app/api/checkout/route.js` |
| Change email template | `lib/server/email.js` |
| Add a new API endpoint | Create `app/api/your-route/route.js` |
| Change store name / logo | `lib/models/Setting.js` + Admin Settings page |
| Change MongoDB connection string | `.env.local` |
