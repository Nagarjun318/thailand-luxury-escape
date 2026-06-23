-- ============================================================================
-- Thailand Luxury Escape 2026 — Supabase schema
-- ----------------------------------------------------------------------------
-- HOW TO USE
--   1. Create a project at https://supabase.com
--   2. Open  SQL Editor  →  New query
--   3. Paste this entire file and click  RUN
--   4. Copy your Project URL + anon public key into  .env.local
--
-- Access model: ONE shared trip, NO login. The browser uses the public anon
-- key, so RLS policies below intentionally allow the `anon` role full access
-- to this single trip's data. Keep your project URL/anon key private-ish
-- (treat the link like a shared password). NEVER expose the service_role key.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Tables --------------------------------------------------------------------
create table if not exists trips (
  id              text primary key,
  name            text not null,
  subtitle        text,
  travelers       jsonb default '[]'::jsonb,
  start_date      date,
  end_date        date,
  destinations    text[] default '{}',
  budget_cash_inr integer default 0,
  budget_thb      integer default 0,
  updated_at      timestamptz default now()
);

create table if not exists activities (
  id          text primary key,
  trip_id     text references trips(id) on delete cascade,
  day         integer,
  title       text not null,
  location    text,
  start_time  timestamptz,
  end_time    timestamptz,
  transport   text,
  cost        numeric default 0,
  notes       text,
  completed   boolean default false,
  emoji       text,
  updated_at  timestamptz default now()
);

create table if not exists expenses (
  id          text primary key,
  trip_id     text references trips(id) on delete cascade,
  title       text not null,
  category    text,
  amount_thb  numeric default 0,
  date        timestamptz,
  notes       text,
  updated_at  timestamptz default now()
);

create table if not exists shopping_items (
  id          text primary key,
  trip_id     text references trips(id) on delete cascade,
  name        text not null,
  priority    text,
  budget_thb  numeric default 0,
  actual_thb  numeric default 0,
  purchased   boolean default false,
  notes       text,
  updated_at  timestamptz default now()
);

create table if not exists packing_items (
  id          text primary key,
  trip_id     text references trips(id) on delete cascade,
  category    text,
  name        text not null,
  packed      boolean default false,
  quantity    integer,
  updated_at  timestamptz default now()
);

create table if not exists journal_entries (
  id          text primary key,
  trip_id     text references trips(id) on delete cascade,
  date        timestamptz,
  title       text not null,
  content     text,
  mood        text,
  photos      text[] default '{}',
  updated_at  timestamptz default now()
);

create table if not exists tickets (
  id             text primary key,
  trip_id        text references trips(id) on delete cascade,
  category       text,
  title          text not null,
  booking_number text,
  passenger      text,
  date           timestamptz,
  seat           text,
  status         text,
  qr_data        text,
  notes          text,
  image_url      text,
  pdf_url        text,
  qr_image_url   text,
  qr_text        text,
  codes          jsonb,
  updated_at     timestamptz default now()
);

-- If the tickets table already exists from an earlier run, add the new
-- PDF/QR columns (safe to run repeatedly).
alter table tickets add column if not exists pdf_url      text;
alter table tickets add column if not exists qr_image_url text;
alter table tickets add column if not exists qr_text      text;
alter table tickets add column if not exists codes        jsonb;

create table if not exists hotels (
  id          text primary key,
  trip_id     text references trips(id) on delete cascade,
  name        text not null,
  city        text,
  address     text,
  phone       text,
  check_in    timestamptz,
  check_out   timestamptz,
  maps_url    text,
  notes       text,
  image       text,
  updated_at  timestamptz default now()
);

create table if not exists flights (
  id             text primary key,
  trip_id        text references trips(id) on delete cascade,
  type           text,
  airline        text,
  flight_number  text,
  from_city      text,
  to_city        text,
  from_code      text,
  to_code        text,
  departure      timestamptz,
  arrival        timestamptz,
  terminal       text,
  seat           text,
  status         text,
  booking_number text,
  updated_at     timestamptz default now()
);

create table if not exists bus_tickets (
  id                    text primary key,
  trip_id               text references trips(id) on delete cascade,
  route                 text,
  from_loc              text,
  to_loc                text,
  booking_number        text,
  departure             timestamptz,
  arrival               timestamptz,
  duration_mins         integer,
  seat                  text,
  status                text,
  boarding_instructions text,
  updated_at            timestamptz default now()
);

create table if not exists emergency_contacts (
  id          text primary key,
  trip_id     text references trips(id) on delete cascade,
  label       text,
  name        text,
  phone       text,
  category    text,
  updated_at  timestamptz default now()
);

create table if not exists settings (
  id          text primary key,        -- equals trip_id
  thb_to_inr  numeric default 2.4,
  theme       text default 'dark',
  last_backup timestamptz,
  updated_at  timestamptz default now()
);

-- Row Level Security --------------------------------------------------------
-- Single shared trip, no auth: allow the anon (and authenticated) role to do
-- everything. Tighten this later if you add login.
do $$
declare t text;
begin
  foreach t in array array[
    'trips','activities','expenses','shopping_items','packing_items',
    'journal_entries','tickets','hotels','flights','bus_tickets',
    'emergency_contacts','settings'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "shared_all" on %I;', t);
    execute format(
      'create policy "shared_all" on %I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- Realtime ------------------------------------------------------------------
-- Add tables to the realtime publication so changes broadcast live.
do $$
declare t text;
begin
  foreach t in array array[
    'activities','expenses','shopping_items','packing_items',
    'journal_entries','tickets','hotels','flights','bus_tickets',
    'emergency_contacts','settings','trips'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table %I;', t);
    exception when duplicate_object then
      null;
    end;
  end loop;
end $$;

-- Storage bucket for ticket & journal photos --------------------------------
insert into storage.buckets (id, name, public)
values ('trip-media', 'trip-media', true)
on conflict (id) do nothing;

drop policy if exists "trip_media_read" on storage.objects;
create policy "trip_media_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'trip-media');

drop policy if exists "trip_media_write" on storage.objects;
create policy "trip_media_write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'trip-media');

drop policy if exists "trip_media_update" on storage.objects;
create policy "trip_media_update" on storage.objects
  for update to anon, authenticated using (bucket_id = 'trip-media');

-- Done. The app auto-seeds its starter data on first load if tables are empty.
