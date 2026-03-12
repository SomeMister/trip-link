-- ============================================================
-- Fix #15: Create trip_images table (was missing from migrations)
-- ============================================================
create table if not exists public.trip_images (
  id uuid not null default uuid_generate_v4(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz default now(),
  constraint trip_images_pkey primary key (id)
);

-- Enable RLS
alter table public.trip_images enable row level security;

-- Policies: trip_images
-- Public can view images for published trips
create policy "Public can view images for published trips" on public.trip_images
  for select using (
    exists (
      select 1 from public.trips
      where id = trip_id and status = 'published'
    )
  );

-- Owners can view all their trip images
create policy "Owners can view their trip images" on public.trip_images
  for select using (
    auth.uid() = (select owner_id from public.trips where id = trip_id)
  );

-- Owners can insert images for their trips
create policy "Owners can insert trip images" on public.trip_images
  for insert with check (
    auth.uid() = (select owner_id from public.trips where id = trip_id)
  );

-- Owners can delete their trip images
create policy "Owners can delete trip images" on public.trip_images
  for delete using (
    auth.uid() = (select owner_id from public.trips where id = trip_id)
  );

-- ============================================================
-- Fix #1: Replace manage_application_status with auth check
-- The original function uses SECURITY DEFINER which bypasses RLS.
-- We add an explicit auth.uid() ownership check inside the function.
-- ============================================================
create or replace function manage_application_status(
  p_trip_id uuid,
  p_app_id uuid,
  p_new_status text
) returns json as $$
declare
  v_trip_owner_id uuid;
  v_trip_seats_left int;
  v_trip_status text;
  v_app_status text;
  v_app_seats int;
  v_seat_delta int := 0;
begin
  -- !! Security: verify the caller owns this trip
  select owner_id, seats_left, status
    into v_trip_owner_id, v_trip_seats_left, v_trip_status
    from public.trips
    where id = p_trip_id
    for update;

  if not found then
    return json_build_object('success', false, 'message', 'Trip not found');
  end if;

  if v_trip_owner_id != auth.uid() then
    return json_build_object('success', false, 'message', 'Unauthorized');
  end if;

  -- Lock the application row
  select status, seats_requested into v_app_status, v_app_seats
  from public.applications
  where id = p_app_id and trip_id = p_trip_id
  for update;

  if not found then
    return json_build_object('success', false, 'message', 'Application not found');
  end if;

  -- No change needed
  if v_app_status = p_new_status then
    return json_build_object('success', true, 'message', 'Status unchanged');
  end if;

  -- Calculate Delta
  if p_new_status = 'approved' and v_app_status != 'approved' then
      if v_trip_seats_left is not null and v_trip_seats_left < v_app_seats then
          return json_build_object('success', false, 'message', 'Not enough seats available');
      end if;
      v_seat_delta := -v_app_seats;
  elsif v_app_status = 'approved' and p_new_status != 'approved' then
      v_seat_delta := v_app_seats;
  else
      v_seat_delta := 0;
  end if;

  -- Perform Updates
  if v_seat_delta != 0 and v_trip_seats_left is not null then
      update public.trips
      set seats_left = seats_left + v_seat_delta
      where id = p_trip_id;
  end if;

  update public.applications
  set status = p_new_status
  where id = p_app_id;

  return json_build_object('success', true, 'message', 'Status updated successfully');

exception when others then
  return json_build_object('success', false, 'message', SQLERRM);
end;
$$ language plpgsql security definer;
