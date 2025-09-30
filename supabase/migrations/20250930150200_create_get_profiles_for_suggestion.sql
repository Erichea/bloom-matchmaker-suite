create or replace function get_profiles_for_suggestion(p_profile_id uuid)
returns table (id uuid, first_name text, last_name text, email text, city text, country text, profession text, date_of_birth date, is_already_suggested boolean)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.city,
    p.country,
    p.profession,
    p.date_of_birth,
    exists(
      select 1 from matches m
      where (m.profile_1_id = p_profile_id and m.profile_2_id = p.id) or (m.profile_2_id = p_profile_id and m.profile_1_id = p.id)
    ) as is_already_suggested
  from
    profiles p
  where
    p.id != p_profile_id and p.status = 'approved';
$$;