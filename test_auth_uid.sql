-- Create a test function to check what auth.uid() returns
-- This will help us understand if the RLS policies are seeing the correct authenticated user

CREATE OR REPLACE FUNCTION test_auth_context()
RETURNS TABLE (
  current_auth_uid uuid,
  current_role text,
  test17_profile_exists boolean,
  test27_profile_exists boolean,
  match_exists_between_them boolean,
  can_read_test27_answers boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid() as current_auth_uid,
    current_user as current_role,
    EXISTS(SELECT 1 FROM profiles WHERE user_id = 'fa3eb40b-27e4-4266-8021-1b4f2ed2abc8') as test17_profile_exists,
    EXISTS(SELECT 1 FROM profiles WHERE user_id = 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2') as test27_profile_exists,
    EXISTS(
      SELECT 1 FROM matches m
      WHERE (m.profile_1_id = '16ee50c0-510a-4d0d-b670-ed3ee5b6e439' AND m.profile_2_id = '26edcffe-f0c1-410f-9fed-af129be6ed08')
         OR (m.profile_2_id = '16ee50c0-510a-4d0d-b670-ed3ee5b6e439' AND m.profile_1_id = '26edcffe-f0c1-410f-9fed-af129be6ed08')
    ) as match_exists_between_them,
    EXISTS(SELECT 1 FROM profile_answers WHERE user_id = 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2') as can_read_test27_answers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call it to see what the current context is
SELECT * FROM test_auth_context();
