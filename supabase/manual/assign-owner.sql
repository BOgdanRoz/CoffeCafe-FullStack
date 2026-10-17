-- MANUAL STEP. Not a migration and not reachable from the app.
--
-- How to use:
--   1. Create the owner account in Supabase Dashboard > Authentication > Users
--      (public sign-ups must stay disabled).
--   2. The owner email is already set below; change it only if the owner account changes.
--   3. Run this script once in Dashboard > SQL Editor. It runs as the project owner, which bypasses RLS.
--
-- Why this is safe: clients have no INSERT or UPDATE privilege on public.profiles and no policy for it,
-- so a signed-in user cannot grant the owner role to themselves.

insert into public.profiles (id, display_name, role)
select u.id, 'Власник', 'owner'
from auth.users u
where u.email = 'MauroCoffee.example@gmail.com'
on conflict (id) do update
  set role = 'owner';

-- Verify: should return one row with role = 'owner'.
-- select p.id, p.role from public.profiles p where p.role = 'owner';
