# Billing Software

Next.js billing and invoicing app with Supabase Auth and shared Supabase storage.

## Supabase and environment setup

1. In the Supabase SQL Editor, run `supabase/migrations/0001_subscriptions.sql` and then `supabase/migrations/0002_manual_access_cloud_data.sql`. The second migration creates `user_access` (payment/access decisions) and `account_data` (per-user business data), enables row-level security, creates rows for existing Auth users, and creates rows automatically for future signups. No additional tables need manual creation.
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key, and service role key. Keep the service role key private. Set `NEXT_PUBLIC_ACCESS_CONTACT` to the email or phone number users should contact.
3. Create your admin login through Supabase Auth. In Authentication > Users, copy its UUID and run:

   ```sql
   insert into public.admins (user_id)
   values ('YOUR_AUTH_USER_UUID');
   ```

   Log in at `/login` with that Auth email and password, then open `/admin`. Set or change the password through Supabase Auth. The app does not include a hardcoded admin password.

## Granting access

Every signup appears in `/admin` with email, business name, and signup date. **Mark paid & grant** records the one-time payment and grants software access indefinitely. Paid status and access can also be changed separately. New accounts are denied access until you grant it. Admins must have their Auth UUID in the `admins` table.

## Shared business data

Products, bills, and business settings are saved in each user's `account_data` row. Supabase row-level security restricts each account to its own data, so it is shared across devices when that user signs in. The service role key is used only on the server for admin account management.

Data previously stored only in a browser's localStorage is not automatically uploaded. On that device, use Settings > Export backup, sign in to the same account after deploying this change, then use Settings > Import backup. The old subscription table/data is retained for reference, but no longer controls access. Razorpay checkout and webhook code have been removed.

## Development

```sh
npm install
npm run dev
```

