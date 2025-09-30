create or replace function get_user_match_stats()
returns table (user_id uuid, profile_id uuid, first_name text, last_name text, email text, total_matches bigint, in_progress_matches bigint, pending_matches bigint, mutual_matches bigint, rejected_matches bigint)
language sql
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.id as profile_id,
    p.first_name,
    p.last_name,
    p.email,
    count(m.id) as total_matches,
    count(case when m.match_status = 'pending' then 1 end) as in_progress_matches,
    count(case when m.match_status in ('profile_1_accepted', 'profile_2_accepted') then 1 end) as pending_matches,
    count(case when m.match_status = 'both_accepted' then 1 end) as mutual_matches,
    count(case when m.match_status in ('profile_1_rejected', 'profile_2_rejected', 'rejected') then 1 end) as rejected_matches
  from
    profiles p
    left join matches m on p.id = m.profile_1_id or p.id = m.profile_2_id
  group by
    p.id
  order by
    p.first_name, p.last_name;
$$;