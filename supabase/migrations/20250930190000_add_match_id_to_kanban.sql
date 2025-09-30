-- Add match_id to get_matches_for_kanban function
create or replace function get_matches_for_kanban(p_profile_id uuid)
returns table (match_id uuid, match_status text, compatibility_score integer, other_profile json)
language sql
security definer
set search_path = public
as $$
  select
    m.id as match_id,
    m.match_status,
    m.compatibility_score,
    json_build_object(
      'id', other_p.id,
      'first_name', other_p.first_name,
      'last_name', other_p.last_name,
      'email', other_p.email,
      'city', other_p.city,
      'country', other_p.country,
      'profession', other_p.profession,
      'date_of_birth', other_p.date_of_birth
    ) as other_profile
  from matches m
  join profiles p on p.id = m.profile_1_id or p.id = m.profile_2_id
  join profiles other_p on other_p.id = case when p.id = m.profile_1_id then m.profile_2_id else m.profile_1_id end
  where p.id = p_profile_id and other_p.id != p.id;
$$;