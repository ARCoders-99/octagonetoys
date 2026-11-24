# Octagonetoys

A production-ready toy store built with Next.js, Tailwind CSS and MongoDB. It ships with a polished customer storefront and a Shopify-style admin panel for managing products, collections, inventory, orders, customers, reviews and discounts.

## Highlights

- **Storefront**: home page, faceted shop, collections, product pages with image gallery, reviews, cart, guest checkout, order tracking, customer accounts with a saved address book, a contact form and self-service password reset.
- **Admin panel**: dashboard with a hand-built SVG sales chart, product CRUD with multi-image uploads, collection ordering, inline inventory editing, order fulfilment with status history, customer management, review moderation, discount codes, a contact-message inbox and store-wide settings.
- **Money is safe**: every price is stored as an **integer number of paisa** (`1 PKR = 100 paisa`). No floating-point money anywhere.
- **Permanent order snapshots**: orders keep their own copies of product titles, prices, images and the shipping address, so later catalogue edits never rewrite history.
- **Soft deletes**: products, collections, customers, reviews and discounts are flagged `isDeleted: true`; historical orders are never hard-deleted.
- **Fast by default**: server-rendered pages, Next.js `<Image>`, pagination, server-side filtering and MongoDB indexes.
- **Email ready**: Resend integration for order confirmation, status updates, contact notifications and password reset, with a console fallback until credentials are added.
- **Uploads ready**: Cloudinary in production, automatic local `public/uploads` fallback in development. Only JPG, PNG, WebP and AVIF files that pass a magic-byte check are accepted.

## Tech stack

| Layer      | Choice                                      |
| ---------- | ------------------------------------------- |
| Framework  | Next.js 16 (App Router, JavaScript only)    |
| UI         | React 19 + Tailwind CSS v4                  |
| Database   | MongoDB + Mongoose 9                        |
| Auth       | JWT stored in an HttpOnly cookie (`auth`)   |
| Email      | Resend (optional)                           |
| Uploads    | Cloudinary REST API (optional)              |

## Getting started

### 1. Requirements

- Node.js 20 or newer (Node 22+ recommended)
- MongoDB 6+ running locally, or a MongoDB Atlas connection string

### 2. Install

```bash
cd ecommerce
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Minimum required values:

```env
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=<a long random string>
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`NEXT_PUBLIC_BASE_URL` is optional in development (it falls back to `http://localhost:3000`) but must be set to your public origin before deploying.

### 4. Seed the admin account

```bash
npm run seed:admin
```

Default credentials (change them in `.env.local` before seeding):

- **Email:** `admin@store.com`
- **Password:** `admin123`

### 5. Seed demo catalogue (optional)

```bash
npm run seed:demo
```

This adds 6 collections, 8 products with local demo images, approved reviews (with recalculated ratings) and two discount codes: `WELCOME10` and `TOYS500`.

### 6. Run it

```bash
npm run dev
```

- Storefront: <http://localhost:3000>
- Admin panel: <http://localhost:3000/admin> (or <http://localhost:3000/admin/login>)

## Environment variables

| Variable                    | Required | Purpose                                                                 |
| --------------------------- | -------- | ----------------------------------------------------------------------- |
| `MONGODB_URI`               | Yes      | MongoDB connection string.                                              |
| `JWT_SECRET`                | Yes      | Signs the `auth` session cookie. Use a long random value.               |
| `NEXT_PUBLIC_BASE_URL`      | Prod     | Canonical site origin used by metadata, sitemap and robots.             |
| `ADMIN_EMAIL`               | No       | Admin email used by `npm run seed:admin` (default `admin@store.com`).   |
| `ADMIN_PASSWORD`            | No       | Admin password used by `npm run seed:admin` (default `admin123`).       |
| `RESEND_API_KEY`            | No       | Enables real email delivery. Without it, emails log to the console.     |
| `EMAIL_FROM`                | No       | Verified sender, e.g. `Octagonetoys <orders@yourdomain.com>`.           |
| `CLOUDINARY_CLOUD_NAME`     | Prod     | Cloudinary cloud name.                                                  |
| `CLOUDINARY_API_KEY`        | Prod     | Cloudinary API key.                                                     |
| `CLOUDINARY_API_SECRET`     | Prod     | Cloudinary API secret.                                                  |
| `NEXT_PUBLIC_STORE_EMAIL`   | No       | Public contact email in the footer and transactional emails.            |
| `NEXT_PUBLIC_STORE_PHONE`   | No       | Public contact phone number.                                            |
| `NEXT_PUBLIC_STORE_WHATSAPP`| No       | WhatsApp number for the floating chat button (defaults to the phone).   |

## Scripts

| Script              | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `npm run dev`       | Start the development server.                                  |
| `npm run build`     | Create an optimised production build.                          |
| `npm run start`     | Run the production build.                                      |
| `npm run lint`      | Run ESLint.                                                    |
| `npm test`          | Run the unit test suite (Node's built-in test runner).         |
| `npm run seed:admin`| Create/update the default admin account.                       |
| `npm run seed:demo` | Seed demo collections, products, reviews and discounts.        |

## Project structure

```text
ecommerce/
├── app/
│   ├── (storefront)/          # Customer-facing pages
│   │   ├── page.js            # Home
│   │   ├── shop/              # Faceted product listing
│   │   ├── collections/       # Collection index + detail
│   │   ├── product/[slug]/    # Product detail + reviews
│   │   ├── cart/              # Cart
│   │   ├── checkout/          # Checkout form
│   │   ├── order/[orderNumber]/
│   │   ├── login/ register/ account/
│   │   └── error.js not-found.js loading.js
│   ├── admin/
│   │   ├── login/             # Public admin sign-in
│   │   └── (protected)/       # Guarded admin pages + layout
│   └── api/                   # Route handlers (public + admin)
├── components/
│   ├── admin/                 # Admin shell, forms, tables, UI primitives
│   ├── providers/             # Cart provider
│   └── storefront/            # Header, footer, cards, forms, gallery
├── lib/
│   ├── models/                # Mongoose schemas
│   ├── server/                # Data queries, checkout rules, email, uploads
│   ├── auth.js                # JWT + cookie helpers
│   ├── constants.js           # Currency, statuses, shipping rules
│   ├── format.js              # Price/date/rating formatting
│   ├── mongoose.js            # Cached connection singleton
│   └── serialize.js           # Server → client serialization
├── public/
│   ├── demo/                  # Seeded demo images
│   └── uploads/               # Local upload fallback (dev)
├── scripts/
│   ├── seed-admin.js
│   └── seed-demo.js
└── tests/                     # Unit tests (`npm test`)
    ├── checkout.test.js       # Pricing, discounts, shipping, totals
    ├── models.test.js         # Schema + money invariants
    ├── format.test.js
    ├── validation.test.js
    ├── auth.test.js
    └── rate-limit.test.js
```

## Data rules

- **Prices** are integers in paisa. Enter rupees in the admin UI; the forms convert to paisa before saving.
- **Orders** store a snapshot of every item (`title`, `price`, `image`, `sku`) and the full `shippingAddress`.
- **Soft delete** is used for catalogue and people records. Order history is immutable.
- **Ratings** (`ratingAverage`, `ratingCount`) are denormalised on the product and recalculated whenever a review is approved, unapproved or deleted.
- **Stock** is reserved inside `/api/checkout` and rolled back if any step fails.

## Store settings, messages and account tools

- **Settings** (`/admin/settings`) stores brand contact details, the WhatsApp number, shipping fee, free-shipping threshold and social links in a single MongoDB document. The storefront layout reads it on every request, so footer details, the WhatsApp button, cart totals and checkout pricing update immediately.
- **Messages** (`/admin/messages`) is the inbox for the public contact form. Each submission is stored in MongoDB, emailed to the store address when Resend is configured, and can be marked read or soft-deleted.
- **Contact form** (`/contact`) is rate-limited to 5 submissions per 10 minutes per IP.
- **Password reset** is self-service: `/forgot-password` emails a single-use link that expires after 30 minutes. Only a SHA-256 hash of the token is stored. The reset link uses `NEXT_PUBLIC_BASE_URL` when set, otherwise the request origin.
- **Address book** on `/account` lets customers save up to 10 addresses. The first address is the default and prefills checkout; customers can also edit their name and phone and change their password there.

## Uploads

- If all three `CLOUDINARY_*` variables are set, images go to Cloudinary and the returned `secure_url` / `public_id` are stored.
- Otherwise, in development, images are written to `public/uploads/` and served from `/uploads/<file>`.
- In production, local uploads are disabled on purpose (serverless filesystems are ephemeral). Configure Cloudinary before deploying.
- Accepted formats are JPG, PNG, WebP and AVIF. The server ignores the browser-supplied MIME type and checks the file's magic bytes; anything else is rejected with a 400 before it reaches storage.

## Email

With `RESEND_API_KEY` set, the store sends:

- an order confirmation when checkout succeeds;
- a status update when an admin changes the order status;
- a notification to the store inbox when the contact form is submitted;
- a single-use password reset link, valid for 30 minutes.

Without a key, the full email content is printed to the server console, so development and testing are never blocked.

With a key but **no verified domain**, Resend test mode sends only to the email address that owns the Resend account, from `onboarding@resend.dev`. Verify a domain in Resend and set `EMAIL_FROM` to an address on it (for example `orders@yourdomain.com`) before launch, otherwise customer order confirmations and contact-form notifications will be rejected.

## Production checklist

1. Set `NEXT_PUBLIC_BASE_URL=https://yourdomain.com` so metadata, `sitemap.xml` and `robots.txt` reference the real domain.
2. Set a strong `JWT_SECRET` and change the seeded admin password. In production `npm run seed:admin` refuses the default or any password under 12 characters.
3. Point `MONGODB_URI` at a managed MongoDB instance and allow-list your host.
4. Configure Cloudinary so admin uploads work.
5. Configure Resend and verify your sending domain (`EMAIL_FROM`).
6. Run `npm run build` and `npm run lint`.
7. Serve over HTTPS so the secure session cookie and HSTS header are honoured.

## API overview

Public:

- `GET /api/health`
- `GET /api/products`, `GET /api/products/[slug]`
- `GET /api/collections`, `GET /api/collections/[slug]`
- `POST /api/reviews`
- `POST /api/checkout`
- `POST /api/discounts/validate`
- `GET /api/orders/[orderNumber]?token=...`
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `POST /api/contact`

Customer (requires a customer session):

- `PATCH /api/account/profile`
- `POST /api/account/password`
- `GET|POST /api/account/addresses`, `PATCH|DELETE /api/account/addresses/[index]`

Admin (requires an admin session):

- `GET /api/admin/stats`
- `POST /api/admin/upload`
- `GET|POST /api/admin/products`, `GET|PUT|PATCH|DELETE /api/admin/products/[id]`
- `GET|POST /api/admin/collections`, `GET|PUT|PATCH|DELETE /api/admin/collections/[id]`
- `GET /api/admin/orders`, `GET|PATCH /api/admin/orders/[id]`
- `GET /api/admin/customers`, `GET|PATCH|DELETE /api/admin/customers/[id]`
- `GET /api/admin/reviews`, `PATCH|DELETE /api/admin/reviews/[id]`
- `GET|POST /api/admin/discounts`, `GET|PUT|PATCH|DELETE /api/admin/discounts/[id]`
- `GET /api/admin/messages`, `GET|PATCH|DELETE /api/admin/messages/[id]`
- `GET|PUT /api/admin/settings`
- `GET /api/admin/me`

## Troubleshooting

- **`connect ECONNREFUSED 127.0.0.1:27017`** — MongoDB is not running. Start it, or use an Atlas URI in `.env.local`.
- **Build fails loading the native SWC binary** — the `node_modules` install is corrupted. Delete `node_modules` and run `npm ci` again.
- **Uploads fail in production** — Cloudinary credentials are missing. Local uploads are intentionally disabled outside development.
- **Emails not arriving** — `RESEND_API_KEY` or a verified `EMAIL_FROM` domain is missing. Check the server console for the logged fallback.
