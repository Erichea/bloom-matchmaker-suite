create or replace function get_matches_for_user(p_user_id uuid)
returns table (match_data json)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    json_build_object(
      'id', m.id,
      'profile_1_id', m.profile_1_id,
      'profile_2_id', m.profile_2_id,
      'match_status', m.match_status,
      'compatibility_score', m.compatibility_score,
      'suggested_at', m.suggested_at,
      'profile_1_response', m.profile_1_response,
      'profile_2_response', m.profile_2_response,
      'viewed_by_profile_1', m.viewed_by_profile_1,
      'viewed_by_profile_2', m.viewed_by_profile_2,
      'profile_1', json_build_object(
        'id', p1.id,
        'first_name', p1.first_name,
        'last_name', p1.last_name,
        'date_of_birth', p1.date_of_birth,
        'city', p1.city,
        'country', p1.country,
        'profession', p1.profession,
        'photo_url', p1.photo_url
      ),
      'profile_2', json_build_object(
        'id', p2.id,
        'first_name', p2.first_name,
        'last_name', p2.last_name,
        'date_of_birth', p2.date_of_birth,
        'city', p2.city,
        'country', p2.country,
        'profession', p2.profession,
        'photo_url', p2.photo_url
      )
    )
  from
    matches m
    join profiles p1 on m.profile_1_id = p1.id
    join profiles p2 on m.profile_2_id = p2.id
  where
    m.profile_1_id = (select id from profiles where user_id = p_user_id) or
    m.profile_2_id = (select id from profiles where user_id = p_user_id);
end;
$$;