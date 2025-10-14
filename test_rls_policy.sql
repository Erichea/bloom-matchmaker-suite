-- Test query to check if the RLS policy conditions would match
-- This simulates the EXISTS clause in the RLS policy

-- Check profiles table for our test users
SELECT 'Profiles check:' as step;
SELECT p.id, p.user_id, p.first_name, p.deleted_at
FROM profiles p
WHERE p.user_id IN ('fa3eb40b-27e4-4266-8021-1b4f2ed2abc8', 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2');

-- Check matches between these profiles
SELECT 'Matches check:' as step;
SELECT m.id, m.profile_1_id, m.profile_2_id, m.match_status
FROM matches m
WHERE (m.profile_1_id = '16ee50c0-510a-4d0d-b670-ed3ee5b6e439' AND m.profile_2_id = '26edcffe-f0c1-410f-9fed-af129be6ed08')
   OR (m.profile_2_id = '16ee50c0-510a-4d0d-b670-ed3ee5b6e439' AND m.profile_1_id = '26edcffe-f0c1-410f-9fed-af129be6ed08');

-- Test the full EXISTS clause that the RLS policy uses
-- Simulating auth.uid() = 'fa3eb40b-27e4-4266-8021-1b4f2ed2abc8' (test17)
-- Trying to read profile_answers.user_id = 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2' (Test27)
SELECT 'RLS policy simulation:' as step;
SELECT
    m.id as match_id,
    p_requester.id as requester_profile_id,
    p_requester.user_id as requester_user_id,
    p_requester.deleted_at as requester_deleted_at,
    p_target.id as target_profile_id,
    p_target.user_id as target_user_id,
    p_target.deleted_at as target_deleted_at,
    m.match_status
FROM matches m
JOIN profiles p_requester ON (p_requester.user_id = 'fa3eb40b-27e4-4266-8021-1b4f2ed2abc8')
JOIN profiles p_target ON (p_target.user_id = 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2')
WHERE
    p_requester.deleted_at IS NULL
    AND p_target.deleted_at IS NULL
    AND (
        (m.profile_1_id = p_requester.id AND m.profile_2_id = p_target.id)
        OR
        (m.profile_2_id = p_requester.id AND m.profile_1_id = p_target.id)
    )
    AND m.match_status IN ('pending', 'profile_1_accepted', 'profile_2_accepted', 'both_accepted');

-- Check profile_answers for Test27
SELECT 'Profile answers for Test27:' as step;
SELECT COUNT(*) as answer_count
FROM profile_answers
WHERE user_id = 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2';
