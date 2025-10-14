-- Test the OLD policy: "Users can read matched profiles' answers"
-- This checks if Test27's user_id would be in the subquery result

SELECT 'Testing OLD policy subquery:' as step;

SELECT p.user_id
FROM ((matches m
  JOIN profiles my_profile ON ((my_profile.user_id = 'fa3eb40b-27e4-4266-8021-1b4f2ed2abc8') AND (my_profile.deleted_at IS NULL)))
  JOIN profiles p ON (((m.profile_1_id = my_profile.id) AND (m.profile_2_id = p.id)) OR ((m.profile_2_id = my_profile.id) AND (m.profile_1_id = p.id))))
WHERE (p.deleted_at IS NULL);

-- Check if Test27's user_id is in that result
SELECT 'Is Test27 user_id in the result?' as step;
SELECT CASE
  WHEN 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2' IN (
    SELECT p.user_id
    FROM ((matches m
      JOIN profiles my_profile ON ((my_profile.user_id = 'fa3eb40b-27e4-4266-8021-1b4f2ed2abc8') AND (my_profile.deleted_at IS NULL)))
      JOIN profiles p ON (((m.profile_1_id = my_profile.id) AND (m.profile_2_id = p.id)) OR ((m.profile_2_id = my_profile.id) AND (m.profile_1_id = p.id))))
    WHERE (p.deleted_at IS NULL)
  )
  THEN 'YES - Policy should work'
  ELSE 'NO - Policy will not work'
END as result;
