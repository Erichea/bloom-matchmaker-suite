CREATE OR REPLACE FUNCTION get_matches_for_kanban(p_profile_id UUID)
RETURNS TABLE (
  match_id UUID,
  match_status TEXT,
  compatibility_score INTEGER,
  other_profile JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    m.id AS match_id,
    m.match_status::text,
    m.compatibility_score,
    json_build_object(
      'id', other_p.id,
      'first_name', other_p.first_name,
      'last_name', other_p.last_name,
      'email', other_p.email,
      'city', other_p.city,
      'country', other_p.country,
      'profession', other_p.profession,
      'date_of_birth', other_p.date_of_birth
    ) AS other_profile
  FROM matches m
  JOIN profiles p ON (p.id = m.profile_1_id OR p.id = m.profile_2_id)
  JOIN profiles other_p ON other_p.id = CASE WHEN p.id = m.profile_1_id THEN m.profile_2_id ELSE m.profile_1_id END
  WHERE p.id = p_profile_id
    AND p.deleted_at IS NULL
    AND other_p.deleted_at IS NULL;
END;
$$;
