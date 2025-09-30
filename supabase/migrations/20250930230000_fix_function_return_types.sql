CREATE OR REPLACE FUNCTION get_user_match_stats()
RETURNS TABLE (
  user_id UUID,
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  total_matches BIGINT,
  in_progress_matches BIGINT,
  pending_matches BIGINT,
  mutual_matches BIGINT,
  rejected_matches BIGINT
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
    p.user_id,
    p.id AS profile_id,
    p.first_name::text,
    p.last_name::text,
    p.email::text,
    COUNT(m.id) AS total_matches,
    COUNT(CASE WHEN m.match_status = 'pending' THEN 1 END) AS in_progress_matches,
    COUNT(CASE WHEN m.match_status IN ('profile_1_accepted', 'profile_2_accepted') THEN 1 END) AS pending_matches,
    COUNT(CASE WHEN m.match_status = 'both_accepted' THEN 1 END) AS mutual_matches,
    COUNT(CASE WHEN m.match_status IN ('profile_1_rejected', 'profile_2_rejected', 'rejected') THEN 1 END) AS rejected_matches
  FROM profiles p
  LEFT JOIN matches m ON (p.id = m.profile_1_id OR p.id = m.profile_2_id)
  LEFT JOIN profiles p1 ON m.profile_1_id = p1.id
  LEFT JOIN profiles p2 ON m.profile_2_id = p2.id
  WHERE p.deleted_at IS NULL
    AND (m.id IS NULL OR (p1.deleted_at IS NULL AND p2.deleted_at IS NULL))
  GROUP BY p.id
  ORDER BY p.first_name, p.last_name;
END;
$$;

CREATE OR REPLACE FUNCTION get_profiles_for_suggestion(p_profile_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  city TEXT,
  country TEXT,
  profession TEXT,
  date_of_birth DATE,
  is_already_suggested BOOLEAN
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
    p.id,
    p.first_name::text,
    p.last_name::text,
    p.email::text,
    p.city::text,
    p.country::text,
    p.profession::text,
    p.date_of_birth,
    EXISTS (
      SELECT 1
      FROM matches m
      WHERE (m.profile_1_id = p_profile_id AND m.profile_2_id = p.id)
         OR (m.profile_2_id = p_profile_id AND m.profile_1_id = p.id)
    ) AS is_already_suggested
  FROM profiles p
  WHERE p.id <> p_profile_id
    AND p.status = 'approved'
    AND p.deleted_at IS NULL;
END;
$$;
