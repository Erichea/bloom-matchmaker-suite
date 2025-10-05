-- Function to get profile answers for matched users
CREATE OR REPLACE FUNCTION get_matched_profile_answers(p_matched_user_id UUID)
RETURNS TABLE (question_id TEXT, answer JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if the current user is matched with the requested user
  IF NOT EXISTS (
    SELECT 1
    FROM matches m
    JOIN profiles p1 ON m.profile_1_id = p1.id
    JOIN profiles p2 ON m.profile_2_id = p2.id
    WHERE p1.deleted_at IS NULL
      AND p2.deleted_at IS NULL
      AND (
        (p1.user_id = v_current_user AND p2.user_id = p_matched_user_id)
        OR (p2.user_id = v_current_user AND p1.user_id = p_matched_user_id)
      )
  ) THEN
    RAISE EXCEPTION 'Not authorized - no match exists';
  END IF;

  -- Return the profile answers
  RETURN QUERY
  SELECT pa.question_id, pa.answer
  FROM profile_answers pa
  WHERE pa.user_id = p_matched_user_id;
END;
$$;
