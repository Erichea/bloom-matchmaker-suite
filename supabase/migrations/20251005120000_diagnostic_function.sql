-- Diagnostic function to check match relationships and profile_answers
CREATE OR REPLACE FUNCTION debug_match_answers(p_user_id_1 UUID, p_user_id_2 UUID)
RETURNS TABLE (
  step TEXT,
  result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if profiles exist
  RETURN QUERY
  SELECT
    'profile_1_exists'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE user_id = p_user_id_1 AND deleted_at IS NULL)
      THEN 'YES' ELSE 'NO' END;

  RETURN QUERY
  SELECT
    'profile_2_exists'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE user_id = p_user_id_2 AND deleted_at IS NULL)
      THEN 'YES' ELSE 'NO' END;

  -- Check if match exists
  RETURN QUERY
  SELECT
    'match_exists'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM matches m
      JOIN profiles p1 ON m.profile_1_id = p1.id
      JOIN profiles p2 ON m.profile_2_id = p2.id
      WHERE (p1.user_id = p_user_id_1 AND p2.user_id = p_user_id_2)
         OR (p1.user_id = p_user_id_2 AND p2.user_id = p_user_id_1)
    ) THEN 'YES' ELSE 'NO' END;

  -- Check if profile_answers exist for user 2
  RETURN QUERY
  SELECT
    'profile_answers_exist'::TEXT,
    COUNT(*)::TEXT
  FROM profile_answers
  WHERE user_id = p_user_id_2;

  -- Check what the RLS policy would return
  RETURN QUERY
  SELECT
    'rls_would_match'::TEXT,
    CASE WHEN p_user_id_2 IN (
      SELECT p.user_id
      FROM matches m
      JOIN profiles my_profile ON (my_profile.user_id = p_user_id_1 AND my_profile.deleted_at IS NULL)
      JOIN profiles p ON (
          (m.profile_1_id = my_profile.id AND m.profile_2_id = p.id)
          OR (m.profile_2_id = my_profile.id AND m.profile_1_id = p.id)
      )
      WHERE p.deleted_at IS NULL
    ) THEN 'YES' ELSE 'NO' END;

END;
$$;
