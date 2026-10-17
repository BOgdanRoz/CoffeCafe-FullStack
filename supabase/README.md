# Supabase setup for Morrow Coffee

This folder holds the database schema, seed data, owner-role script and database tests.

| Path | Purpose | Run |
|---|---|---|
| `migrations/20261017120000_table_availability.sql` | Tables, RLS, public availability function | Once, in SQL Editor |
| `seed.sql` | 8 tables, weekly opening hours, booking settings (idempotent) | Once, after the migration |
| `manual/assign-owner.sql` | Grants the owner role to one existing auth user | Once, after the owner account exists |
| `tests/availability.test.mjs` | Runs the migration and seed on PGlite and checks constraints, slots, timezone and RLS | `npm run test:db` |

## One-time setup in the Supabase Dashboard

1. **Authentication → Sign In / Providers → Email:** turn off "Allow new users to sign up".
   The owner account is created by hand; the public site never registers users.
2. **SQL Editor:** paste and run `migrations/20261017120000_table_availability.sql`.
3. **SQL Editor:** paste and run `seed.sql`.
4. **Authentication → Users → Add user:** create the owner with the owner email and a strong password.
   Do not send the password through chat, tickets or Git.
5. **SQL Editor:** run `manual/assign-owner.sql`. It sets `role = 'owner'` for that user.
   Verify with the query at the bottom of the script.
6. **Local environment:** copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` from **Project Settings → API**. Use only the publishable key.

## Security notes

- Clients have no privileges on `profiles`, so no one can grant themselves the owner role.
- Visitors read only active tables, opening hours, booking settings and the output of
  `get_public_availability`. Notes and author ids are never returned.
- Only `public.is_owner()` users can write tables, hours, settings and availability blocks.
  PostgreSQL enforces this through RLS, so hiding buttons in the UI is not the security boundary.
- Never put the `service_role` or secret key into `.env` files that Vite reads, or into Git.

## Rules encoded in the schema

- All times are cafe-local (`Europe/Kyiv`). Blocks are stored as wall-clock times.
- A block must lie inside opening hours on its date.
- Two blocks of the same table cannot overlap (`EXCLUDE` constraint, safe under concurrency).
- A slot is offered if its start is inside opening hours. A table is unavailable for a slot if a
  block overlaps the visit window `[slot, slot + visit_minutes)`.
- Slots whose start is not after the current local time are marked `isPast`.
