-- Morrow Coffee: table availability schema.
--
-- Concepts
--   * cafe_tables            physical tables, capacity, active flag. No global "occupied" status.
--   * opening_hours          weekly schedule in cafe local time (Europe/Kyiv), ISO weekday 1..7.
--   * booking_settings       one row: slot step, visit duration, first and last slot start.
--   * table_availability_blocks
--                            owner-entered "occupied" or "unavailable" periods for one table on one date.
--                            Availability is derived per date and slot. No block means available.
--   * profiles               role per auth user. Clients cannot write it; the owner row is inserted manually.
--
-- Time model
--   All dates and times are cafe-local wall-clock values (no timestamptz), so a block at 18:00 stays at
--   18:00 across daylight saving changes. "Now" is taken in Europe/Kyiv inside get_public_availability.
--
-- Conflict model
--   An EXCLUDE constraint forbids two blocks of the same table whose [start, end) ranges overlap.
--   Concurrent inserts are serialized by PostgreSQL, so contradictory data cannot be committed.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  role text not null default 'customer' check (role in ('owner', 'customer')),
  created_at timestamptz not null default now()
);

create table public.cafe_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 40),
  capacity integer not null check (capacity between 1 and 20),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.opening_hours (
  weekday smallint primary key check (weekday between 1 and 7),  -- ISO: 1 = Monday, 7 = Sunday
  is_closed boolean not null default false,
  opens_at time,
  closes_at time,
  check (
    (is_closed and opens_at is null and closes_at is null)
    or (not is_closed and opens_at is not null and closes_at is not null and opens_at < closes_at)
  )
);

create table public.booking_settings (
  id smallint primary key default 1 check (id = 1),  -- single-row settings table
  slot_minutes integer not null default 30 check (slot_minutes in (15, 30, 60)),
  visit_minutes integer not null default 90 check (visit_minutes between 30 and 240),
  first_slot time not null default time '08:00',
  last_slot time not null default time '20:00',
  check (first_slot <= last_slot),
  updated_at timestamptz not null default now()
);

create table public.table_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.cafe_tables (id) on delete cascade,
  block_date date not null,
  starts_at time not null,
  ends_at time not null,
  kind text not null check (kind in ('occupied', 'unavailable')),
  note text check (char_length(note) <= 300),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Half-open interval on the cafe-local timeline, used by the exclusion constraint.
  during tsrange generated always as (
    tsrange(block_date::timestamp + starts_at, block_date::timestamp + ends_at, '[)')
  ) stored,
  check (ends_at > starts_at),
  -- Two blocks of the same table cannot overlap, whatever their kind.
  constraint table_availability_blocks_no_overlap
    exclude using gist (table_id with =, during with &&)
);

-- Common queries: the owner's day view and the public day lookup.
create index table_availability_blocks_table_date_idx
  on public.table_availability_blocks (table_id, block_date);
create index table_availability_blocks_date_idx
  on public.table_availability_blocks (block_date);
create index cafe_tables_sort_idx
  on public.cafe_tables (sort_order, name) where is_active;

-- ---------------------------------------------------------------------------
-- Owner check, used by RLS policies and functions
-- ---------------------------------------------------------------------------

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'owner'
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Block validation and audit fields
-- ---------------------------------------------------------------------------

create or replace function public.validate_availability_block()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_hours public.opening_hours%rowtype;
begin
  -- Keep the audit field honest: the author is always the authenticated owner.
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  end if;

  -- Checked here, before the generated "during" column is computed, so a reversed interval
  -- gets a clear error instead of a range-construction error.
  if new.ends_at <= new.starts_at then
    raise exception 'block must end after it starts'
      using errcode = '23514';
  end if;

  select * into v_hours
  from public.opening_hours
  where weekday = extract(isodow from new.block_date)::smallint;

  if not found or v_hours.is_closed
     or new.starts_at < v_hours.opens_at
     or new.ends_at > v_hours.closes_at then
    raise exception 'availability block must lie inside opening hours'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger table_availability_blocks_validate
  before insert or update on public.table_availability_blocks
  for each row execute function public.validate_availability_block();

-- ---------------------------------------------------------------------------
-- Public read: availability for one date
-- ---------------------------------------------------------------------------
-- Returns JSON with slots and per-table statuses. It exposes no notes and no author ids.
-- A slot is offered only inside opening hours. A table is "occupied" or "unavailable" when a block
-- overlaps the visit window [slot start, slot start + visit_minutes). Otherwise it is "available".
-- Slots whose start is not after the current cafe-local time are marked isPast.

create or replace function public.get_public_availability(p_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_now timestamp := (now() at time zone 'Europe/Kyiv');
  v_settings public.booking_settings%rowtype;
  v_hours public.opening_hours%rowtype;
begin
  if p_date is null then
    raise exception 'date is required' using errcode = '22023';
  end if;

  if p_date > (v_now::date + 120) then
    raise exception 'date is more than 120 days ahead' using errcode = '22023';
  end if;

  select * into v_settings from public.booking_settings where id = 1;
  if not found then
    raise exception 'booking settings are not configured' using errcode = 'P0002';
  end if;

  select * into v_hours
  from public.opening_hours
  where weekday = extract(isodow from p_date)::smallint;

  if not found or v_hours.is_closed then
    return jsonb_build_object(
      'date', p_date,
      'timezone', 'Europe/Kyiv',
      'isOpen', false,
      'tables', '[]'::jsonb,
      'slots', '[]'::jsonb
    );
  end if;

  return (
    with slot_list as (
      select g.ts, g.ts::time as slot_time
      from generate_series(
        p_date + v_settings.first_slot,
        p_date + v_settings.last_slot,
        make_interval(mins => v_settings.slot_minutes)
      ) as g (ts)
      where g.ts::time >= v_hours.opens_at
        and g.ts::time < v_hours.closes_at
    ),
    table_list as (
      select t.id, t.name, t.capacity,
             row_number() over (order by t.sort_order, t.name) as position
      from public.cafe_tables t
      where t.is_active
    ),
    grid as (
      select s.ts, s.slot_time, t.id as table_id,
             tsrange(s.ts, s.ts + make_interval(mins => v_settings.visit_minutes), '[)') as visit_window
      from slot_list s
      cross join table_list t
    ),
    statused as (
      select g.ts, g.slot_time, g.table_id,
             coalesce(
               (select b.kind
                from public.table_availability_blocks b
                where b.table_id = g.table_id
                  and b.during && g.visit_window
                order by case b.kind when 'unavailable' then 0 else 1 end
                limit 1),
               'available'
             ) as status
      from grid g
    ),
    slots_json as (
      select jsonb_agg(
               jsonb_build_object(
                 'time', to_char(x.slot_time, 'HH24:MI'),
                 'isPast', x.ts <= v_now,
                 'statuses', x.statuses
               )
               order by x.ts
             ) as value
      from (
        select st.ts, st.slot_time,
               jsonb_object_agg(st.table_id::text, st.status) as statuses
        from statused st
        group by st.ts, st.slot_time
      ) x
    ),
    tables_json as (
      select jsonb_agg(
               jsonb_build_object('id', tl.id, 'name', tl.name, 'capacity', tl.capacity)
               order by tl.position
             ) as value
      from table_list tl
    )
    select jsonb_build_object(
      'date', p_date,
      'timezone', 'Europe/Kyiv',
      'isOpen', true,
      'tables', coalesce((select value from tables_json), '[]'::jsonb),
      'slots', coalesce((select value from slots_json), '[]'::jsonb)
    )
  );
end;
$$;

revoke all on function public.get_public_availability(date) from public;
grant execute on function public.get_public_availability(date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.cafe_tables enable row level security;
alter table public.opening_hours enable row level security;
alter table public.booking_settings enable row level security;
alter table public.table_availability_blocks enable row level security;

-- Start from zero privileges, then grant only what each role needs.
revoke all on public.profiles from anon, authenticated;
revoke all on public.cafe_tables from anon, authenticated;
revoke all on public.opening_hours from anon, authenticated;
revoke all on public.booking_settings from anon, authenticated;
revoke all on public.table_availability_blocks from anon, authenticated;

-- profiles: a user may read their own row. No client-side writes at all.
grant select on public.profiles to authenticated;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- cafe_tables: everyone reads active tables; the owner manages all tables.
grant select on public.cafe_tables to anon;
grant select, insert, update, delete on public.cafe_tables to authenticated;
create policy cafe_tables_public_read
  on public.cafe_tables for select
  to anon, authenticated
  using (is_active or (select public.is_owner()));
create policy cafe_tables_owner_write
  on public.cafe_tables for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

-- opening_hours: public read, owner write.
grant select on public.opening_hours to anon;
grant select, insert, update, delete on public.opening_hours to authenticated;
create policy opening_hours_public_read
  on public.opening_hours for select
  to anon, authenticated
  using (true);
create policy opening_hours_owner_write
  on public.opening_hours for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

-- booking_settings: public read, owner write.
grant select on public.booking_settings to anon;
grant select, insert, update, delete on public.booking_settings to authenticated;
create policy booking_settings_public_read
  on public.booking_settings for select
  to anon, authenticated
  using (true);
create policy booking_settings_owner_write
  on public.booking_settings for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

-- table_availability_blocks: owner only. Visitors read availability through get_public_availability.
grant select, insert, update, delete on public.table_availability_blocks to authenticated;
create policy table_availability_blocks_owner_all
  on public.table_availability_blocks for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));
