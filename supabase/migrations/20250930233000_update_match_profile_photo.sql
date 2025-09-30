CREATE OR REPLACE FUNCTION get_matches_for_user(p_user_id UUID)
RETURNS TABLE (match_data JSON)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_actor <> p_user_id AND NOT public.has_role(v_actor, 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT json_build_object(
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
        'photo_url', (
          SELECT photo_url
          FROM profile_photos
          WHERE profile_id = p1.id
          ORDER BY is_primary DESC NULLS LAST, created_at DESC
          LIMIT 1
        )
      ),
      'profile_2', json_build_object(
        'id', p2.id,
        'first_name', p2.first_name,
        'last_name', p2.last_name,
        'date_of_birth', p2.date_of_birth,
        'city', p2.city,
        'country', p2.country,
        'profession', p2.profession,
        'photo_url', (
          SELECT photo_url
          FROM profile_photos
          WHERE profile_id = p2.id
          ORDER BY is_primary DESC NULLS LAST, created_at DESC
          LIMIT 1
        )
      )
    )
  FROM matches m
  JOIN profiles p1 ON m.profile_1_id = p1.id
  JOIN profiles p2 ON m.profile_2_id = p2.id
  WHERE
    p1.deleted_at IS NULL
    AND p2.deleted_at IS NULL
    AND (
      m.profile_1_id = (
        SELECT id FROM profiles WHERE user_id = p_user_id AND deleted_at IS NULL
      )
      OR m.profile_2_id = (
        SELECT id FROM profiles WHERE user_id = p_user_id AND deleted_at IS NULL
      )
    );
END;
$$;
