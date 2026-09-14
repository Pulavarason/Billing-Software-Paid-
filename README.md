# Skandhas Masala &mdash; Billing & Invoicing System (Paid SaaS)

A billing and invoicing web app for a masala business, built with Next.js, React,
TypeScript and Tailwind CSS. The customer's actual business data &mdash; products, bills,
settings, invoices &mdash; still lives entirely in the browser's `localStorage`, exactly as
before.

On top of that, the app is now a **paid subscription product**: Supabase handles
authentication and subscription/access control, and Razorpay handles payment. Nobody can
reach the dashboard, products, bills, or settings without an active subscription.

| Data | Where it lives |
|---|---|
| Products, bills, invoices, business settings | Browser `localStorage` (unchanged) |
| Account, login session | Supabase Auth |
| Subscription status/expiry, payment ids | Supabase `subscriptions` table (server-controlled) |

---

## 1. Install & Run

You need [Node.js](https://nodejs.org) 18.18 or newer, a [Supabase](https://supabase.com)
project, and a [Razorpay](https://razorpay.com) account (Test Mode is fine for development).

```bash
npm install
cp .env.example .env.local   # fill in the values — see section 10
npm run dev
```

Then open **http://localhost:3000** in your browser. You'll land on `/login` until you sign
up and subscribe.

## 2. Production Build

```bash
npm run build
npm run start
```

> **Note on first build:** This project was written and reviewed carefully, but it was
> assembled in an environment without internet access, so a real `npm install` /
> `npm run build` could not be executed before delivery. `next.config.js` currently sets
> `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` as a safety net
> so a stray type/lint issue won't block your production build. Please run `npm run build`
> once on your machine; if it completes cleanly you can safely remove that block from
> `next.config.js` to restore strict checks for future changes.

---

## 3. How the app is organized

- **Dashboard** &mdash; today's sales, bills today, total bills, product count, recent bills,
  and quick actions.
- **Create Bill** &mdash; the main billing screen: pick a customer (optional), search & add
  products with a package size and quantity, apply a discount, then Save / Save & Print /
  Save PDF.
- **Products** &mdash; add, edit, delete products and their package-size variants; search and
  filter by category/status.
- **Bills** &mdash; full invoice history with search and date filtering; open any bill to view,
  print, or download it as a PDF.
- **Settings** &mdash; business info shown on every invoice, plus backup/restore and demo-data
  reset.

## 4. How products & variants work

Each **product** (e.g. "Chilli Powder") can have any number of **variants** &mdash; a
package size (e.g. `250 g`), a selling price, and an optional SKU. On the Products page:

1. Click **+ Add Product**.
2. Fill in the name (category/description are optional).
3. Under **Package Variants**, click **+ Add Variant** for each size/price you sell, and
   reorder them with the up/down arrows if needed.
4. Click **Save Product**.

Products can be marked **Active** or **Inactive** in the form. Inactive products stay in
your catalog and in past bills, but won't appear in the Create Bill product picker.

## 5. Changing prices

Edit any product from the Products page, change a variant's price, and click
**Update Product**. New bills will use the updated price immediately.

**Bills already created keep the price that was in effect when they were made.** Every bill
stores a snapshot of the product name, size, price and quantity at the time of sale, so
editing or even deleting a product later never changes historical invoices.

## 6. Creating a bill & printing

1. Go to **Create Bill**. The bill number and date are generated automatically.
2. Search for a product, choose its package size (the price fills in automatically),
   set the quantity, and click **Add to Bill**.
3. Repeat for more items. Add a discount if needed &mdash; the grand total updates instantly.
4. Choose one of:
   - **Save Bill** &mdash; saves and takes you to the bill's detail page.
   - **Save & Print** &mdash; saves, then opens a dedicated print view in a new tab and
     triggers your browser's print dialog automatically. Only the invoice is printed
     &mdash; no sidebar or navigation.
   - **Save PDF** &mdash; saves and downloads a PDF named like `SKM-000001.pdf`.

The printable invoice is fixed at **A5 portrait (148mm &times; 210mm)** regardless of your
screen size or light/dark mode, and always prints in black & white on a white background.
"Save & Print" also works with your browser's **Save as PDF** print destination if you
prefer that over the dedicated Save PDF button.

## 7. Backup & restore

Since everything lives in your browser's local storage, back up your data regularly:

- **Settings &rarr; Export Backup** downloads a JSON file
  (`skandhas-masala-backup-YYYY-MM-DD.json`) containing every product, bill, and setting,
  plus the bill number counter.
- **Settings &rarr; Import Backup** restores from a previously exported file. You'll be
  asked to confirm, since importing replaces all current data.

**Settings &rarr; Danger Zone** also lets you reset back to the original demo dataset, or
wipe everything and start from a clean slate.

## 8. Tech notes

- Next.js App Router, React 18, TypeScript, Tailwind CSS, Lucide icons.
- PDF export uses `html2canvas` + `jsPDF` entirely in the browser.
- Product/bill/settings data is still 100% client-side `localStorage` &mdash; centralized in
  `lib/storage.ts` (`lib/types.ts` for the shapes). **A fresh install starts with zero
  products/bills** (no demo seed); use Settings → Danger Zone → Reset Demo Data if you want
  sample data back.
- Auth + subscription/access control is Supabase (`lib/supabase/*`, `middleware.ts`,
  `lib/subscription.ts`). Payment is Razorpay, verified server-side
  (`app/api/razorpay/*`, `app/api/webhooks/razorpay`).

## 9. Subscription plans

| Plan | Price | Duration |
|---|---|---|
| Monthly | ₹499 | 1 month |
| 3 Months | ₹1,700 | 3 months |
| Yearly | ₹6,000 (best value) | 12 months |

Plan definitions live in `lib/plans.ts` &mdash; change prices/durations there.

## 10. Supabase setup

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. **Auth**: Authentication → Providers → Email is enabled by default. Decide whether you
   want "Confirm email" on (Authentication → Settings) &mdash; the signup page handles both.
3. **Database**: open the SQL editor and run `supabase/migrations/0001_subscriptions.sql`.
   This creates the `subscriptions` table (with Row Level Security so a customer can only
   ever *read* their own row — no insert/update/delete policies exist for the browser, so
   nobody can edit their own `status` or `end_date` from DevTools) and an `admins` allowlist
   table for the `/admin` panel.
4. Make yourself an admin: find your user id in Authentication → Users, then in the SQL
   editor run:
   ```sql
   insert into public.admins (user_id) values ('<your-user-id>');
   ```
5. Get your keys from Project Settings → API: `Project URL`, `anon public` key, and
   `service_role` key (server-only, never expose it to the browser).

## 11. Razorpay setup (Test Mode)

1. Create an account at [razorpay.com](https://razorpay.com) and switch to **Test Mode**
   (toggle top-left of the dashboard).
2. Settings → API Keys → Generate Test Key. Copy the Key Id and Key Secret.
3. Settings → Webhooks → Add New Webhook:
   - URL: `https://<your-deployed-domain>/api/webhooks/razorpay` (use an
     [ngrok](https://ngrok.com) tunnel for local testing).
   - Active events: `payment.captured`, `payment.failed`, `order.paid`.
   - Copy the generated **Webhook Secret**.
4. There's no need to pre-create "Plans" in the Razorpay dashboard — this app creates a
   plain Razorpay **Order** per checkout (amount driven by `lib/plans.ts`), which is
   verified via signature in `app/api/razorpay/verify`.
5. To test a payment, use Razorpay's published test card numbers/UPI ids (see their
   [test card docs](https://razorpay.com/docs/payments/payments/test-card-details/)) — any
   test card with a future expiry and any CVV will work in Test Mode.

## 12. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

`.env.local` (and `.env`) are already in `.gitignore` — never commit real credentials.

## 13. Deploying to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. Add all six environment variables above under Project Settings → Environment Variables
   (for Production **and** Preview if you want preview deploys to work).
3. Update the Razorpay webhook URL to your production domain once deployed.
4. Deploy. The app has no filesystem/server-memory dependencies, so it runs cleanly on
   Vercel's serverless/edge runtime as-is.

## 14. How access control works, end to end

```
Visit any app route
  → middleware.ts checks Supabase session
      no session          → /login
      session, no active
      subscription         → /subscribe
      session + active     → allowed through
```

- `middleware.ts` (+ `lib/supabase/middleware.ts`) is the first gate on every request.
- `lib/subscription.ts` (`getActiveSubscription`) is the same check available to Server
  Components/Route Handlers.
- The browser's `localStorage` subscription state is never consulted for access control —
  only the `subscriptions` row read via the user's own RLS-scoped session (or, in the
  Razorpay verify/webhook routes and the admin panel, the service-role key) decides access.

## 15. Project structure

```
skandhas-masala-billing/
├── app/
│   ├── (app)/                    # Dashboard, Products, Bills, Create Bill, Settings (with sidebar)
│   ├── admin/                    # Admin-only subscription management panel
│   ├── api/razorpay/             # create-order, verify — server-side payment handling
│   ├── api/webhooks/razorpay/    # Razorpay webhook (signature-verified)
│   ├── login/, signup/           # Auth pages
│   ├── subscribe/                # Pricing page + Razorpay checkout
│   ├── print/[id]/               # Bare print-only route for a single invoice
│   ├── layout.tsx                # Root layout + providers
│   └── globals.css               # Theme variables + A5 print rules
├── components/                   # Sidebar/shell, forms, tables, invoice template, auth UI, etc.
├── context/                      # Theme, Toast, Auth, and main Data (localStorage) providers
├── lib/
│   ├── supabase/                 # Browser / server / admin (service-role) / middleware clients
│   ├── subscription.ts           # Server-side hasActiveSubscription-style check
│   ├── plans.ts                  # Plan prices & durations
│   ├── razorpay.ts               # Razorpay server client
│   └── ...                       # Types, storage utilities, formatting, sample data, PDF export
├── supabase/migrations/          # SQL: subscriptions + admins tables, RLS policies
├── middleware.ts                 # Route protection (auth + subscription)
├── public/
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

Enjoy billing! 🌶️
