create or replace function create_bulk_matches(p_profile_1_id uuid, p_profile_2_ids uuid[], p_suggested_by uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  for i in 1..array_length(p_profile_2_ids, 1) loop
    insert into matches (profile_1_id, profile_2_id, suggested_by, match_status, suggested_at)
    values (p_profile_1_id, p_profile_2_ids[i], p_suggested_by, 'pending', now());
  end loop;
end;
$$;