-- Test the simpler IN subquery from the alternative policy
-- This will tell us if Test27's user_id is in the list of matched users for test17

SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "fa3eb40b-27e4-4266-8021-1b4f2ed2abc8"}';

-- Test the subquery
SELECT
    'Testing IN subquery' as test,
    CASE
        WHEN 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2' IN (
            SELECT CASE
                WHEN m.profile_1_id = my_profile.id THEN other_profile.user_id
                WHEN m.profile_2_id = my_profile.id THEN other_profile.user_id
            END as matched_user_id
            FROM matches m
            CROSS JOIN profiles my_profile
            CROSS JOIN profiles other_profile
            WHERE
                my_profile.user_id = 'fa3eb40b-27e4-4266-8021-1b4f2ed2abc8'
                AND my_profile.deleted_at IS NULL
                AND other_profile.deleted_at IS NULL
                AND (
                    (m.profile_1_id = my_profile.id AND m.profile_2_id = other_profile.id)
                    OR
                    (m.profile_2_id = my_profile.id AND m.profile_1_id = other_profile.id)
                )
                AND m.match_status IN ('pending', 'profile_1_accepted', 'profile_2_accepted', 'both_accepted')
        )
        THEN 'YES - Should work'
        ELSE 'NO - Will not work'
    END as result;

-- Also list all matched user_ids
SELECT CASE
    WHEN m.profile_1_id = my_profile.id THEN other_profile.user_id
    WHEN m.profile_2_id = my_profile.id THEN other_profile.user_id
END as matched_user_id
FROM matches m
CROSS JOIN profiles my_profile
CROSS JOIN profiles other_profile
WHERE
    my_profile.user_id = 'fa3eb40b-27e4-4266-8021-1b4f2ed2abc8'
    AND my_profile.deleted_at IS NULL
    AND other_profile.deleted_at IS NULL
    AND (
        (m.profile_1_id = my_profile.id AND m.profile_2_id = other_profile.id)
        OR
        (m.profile_2_id = my_profile.id AND m.profile_1_id = other_profile.id)
    )
    AND m.match_status IN ('pending', 'profile_1_accepted', 'profile_2_accepted', 'both_accepted');

RESET role;
