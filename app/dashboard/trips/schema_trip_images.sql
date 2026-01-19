-- 1. Create table for trip images
create table if not exists public.trip_images (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade not null,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz default now()
);

-- Index for ordering
create index if not exists trip_images_trip_id_position_idx on public.trip_images (trip_id, position);

-- 2. RLS for trip_images
alter table public.trip_images enable row level security;

-- Authenticated owners can insert/update/delete their own trip images
create policy "Owners can manage trip images"
on public.trip_images
for all
to authenticated
using (
  exists (
    select 1 from public.trips
    where trips.id = trip_images.trip_id
    and trips.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.trips
    where trips.id = trip_images.trip_id
    and trips.owner_id = auth.uid()
  )
);

-- Public read access (or just for published trips? for MVP global read is easier/ok)
create policy "Public can view trip images"
on public.trip_images
for select
to public
using (true);


-- 3. Storage Bucket Setup (Instructions for SQL Editor)
-- Note: You usually create buckets via the Dashboard, but here is the SQL way if the extension is enabled.
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;

-- Storage Policies
-- Allow public read
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'trip-photos' );

-- Allow authenticated users (owners) to upload
-- Ideally we check if they own the trip folder, but storage policies can be complex. 
-- Simple version: Authenticated users can upload to trip-photos.
create policy "Auth Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'trip-photos' );

-- Allow owners to update/delete
create policy "Auth Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'trip-photos' );
