-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: trips
create table public.trips (
  id uuid not null default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id),
  slug text not null unique,
  title text not null,
  description_raw text,
  description_clean text,
  start_date date,
  end_date date,
  from_city text,
  to_place text,
  price_amount numeric,
  price_currency text,
  price_text text,
  seats_total int,
  seats_left int,
  cover_image_url text,
  status text check (status in ('draft', 'published', 'closed')) default 'draft',
  created_at timestamptz default now(),
  constraint trips_pkey primary key (id)
);

-- Table: applications
create table public.applications (
  id uuid not null default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  contact_phone text,
  contact_instagram text,
  contact_telegram text,
  seats_requested int default 1 check (seats_requested > 0),
  note text,
  status text check (status in ('new', 'approved', 'waitlist', 'rejected')) default 'new',
  created_at timestamptz default now(),
  constraint applications_pkey primary key (id)
);

-- Enable RLS
alter table public.trips enable row level security;
alter table public.applications enable row level security;

-- Policies: Trips
-- 1. Read: Public can read published trips. Owner can read all their trips.
create policy "Public trips are viewable by everyone" on public.trips
  for select using (status = 'published');

create policy "Owners can view their own trips" on public.trips
  for select using (auth.uid() = owner_id);

-- 2. Insert/Update/Delete: Only owner
create policy "Owners can insert their own trips" on public.trips
  for insert with check (auth.uid() = owner_id);

create policy "Owners can update their own trips" on public.trips
  for update using (auth.uid() = owner_id);

create policy "Owners can delete their own trips" on public.trips
  for delete using (auth.uid() = owner_id);

-- Policies: Applications
-- 1. Insert: Public can create application if trip is published.
create policy "Public can apply to published trips" on public.applications
  for insert with check (
    exists (
      select 1 from public.trips
      where id = trip_id and status = 'published'
    )
  );

-- 2. Select: Only the trip owner can view applications for their trips.
-- (Users who applied cannot implicitly view their application after submission without auth, 
--  unless we add a "cookie" session or similar, but for MVP instructions say "no auth for participants").
create policy "Trip owners can view applications" on public.applications
  for select using (
    auth.uid() = (select owner_id from public.trips where id = trip_id)
  );

-- 3. Update: Only trip owner can update status.
create policy "Trip owners can update applications" on public.applications
  for update
  using (
    auth.uid() = (select owner_id from public.trips where id = trip_id)
  )
  with check (
    auth.uid() = (select owner_id from public.trips where id = trip_id)
  );
  
  -- 4. Update: Only trip owner can delete application.
  create policy "Trip owners can delete applications" on public.applications
  for delete using (
    auth.uid() = (select owner_id from public.trips where id = trip_id)
  );
