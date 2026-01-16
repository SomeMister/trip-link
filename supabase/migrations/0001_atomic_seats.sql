-- Function to manage application status updates and seat counts atomically
create or replace function manage_application_status(
  p_trip_id uuid,
  p_app_id uuid,
  p_new_status text
) returns json as $$
declare
  v_trip_seats_left int;
  v_trip_status text;
  v_app_status text;
  v_app_seats int;
  v_seat_delta int := 0;
begin
  -- Lock the trip row for update to prevent race conditions
  select seats_left, status into v_trip_seats_left, v_trip_status
  from public.trips
  where id = p_trip_id
  for update;

  if not found then
    return json_build_object('success', false, 'message', 'Trip not found');
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
  -- 1. Approving (New/Waitlist/Rejected -> Approved)
  if p_new_status = 'approved' and v_app_status != 'approved' then
      if v_trip_seats_left is not null and v_trip_seats_left < v_app_seats then
          return json_build_object('success', false, 'message', 'Not enough seats available');
      end if;
      v_seat_delta := -v_app_seats;
  
  -- 2. Un-Approving (Approved -> Waitlist/Rejected/New)
  elsif v_app_status = 'approved' and p_new_status != 'approved' then
      v_seat_delta := v_app_seats;
      
  -- 3. Others (New <-> Waitlist <-> Rejected)
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
