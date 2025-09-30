-- Add soft delete support for profiles and ensure downstream functions ignore deleted profiles

ALTER TYPE profile_status ADD VALUE IF NOT EXISTS 'deleted';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS status_before_deletion profile_status;

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);

-- Function to soft delete a profile
CREATE OR REPLACE FUNCTION soft_delete_profile(p_profile_id UUID, p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_status profile_status;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin role required');
  END IF;

  SELECT user_id, status INTO v_user_id, v_current_status
  FROM profiles
  WHERE id = p_profile_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profile not found');
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND deleted_at IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profile already deleted');
  END IF;

  UPDATE profiles
  SET
    status_before_deletion = CASE WHEN status <> 'deleted' THEN status ELSE status_before_deletion END,
    status = 'deleted',
    deleted_at = NOW(),
    deleted_by = p_admin_id,
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'message', 'Profile deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a previously deleted profile
CREATE OR REPLACE FUNCTION restore_profile(p_profile_id UUID, p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_previous_status profile_status;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin role required');
  END IF;

  SELECT user_id, status_before_deletion INTO v_user_id, v_previous_status
  FROM profiles
  WHERE id = p_profile_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profile not found');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND deleted_at IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profile is not deleted');
  END IF;

  UPDATE profiles
  SET
    status = COALESCE(status_before_deletion, 'incomplete'),
    status_before_deletion = NULL,
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'message', 'Profile restored successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION soft_delete_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_profile(UUID, UUID) TO authenticated;

-- Ensure approve/reject guards against deleted profiles
CREATE OR REPLACE FUNCTION approve_profile(p_profile_id UUID, p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin role required');
  END IF;

  SELECT user_id INTO v_user_id FROM profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profile not found');
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND deleted_at IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot approve a deleted profile');
  END IF;

  UPDATE profiles
  SET
    status = 'approved',
    approved_at = NOW(),
    reviewed_by = p_admin_id,
    rejection_reason = NULL,
    rejected_at = NULL,
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'message', 'Profile approved successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_profile(p_profile_id UUID, p_admin_id UUID, p_rejection_reason TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin role required');
  END IF;

  SELECT user_id INTO v_user_id FROM profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Profile not found');
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND deleted_at IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot reject a deleted profile');
  END IF;

  UPDATE profiles
  SET
    status = 'rejected',
    rejected_at = NOW(),
    reviewed_by = p_admin_id,
    rejection_reason = p_rejection_reason,
    approved_at = NULL,
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'message', 'Profile rejected successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Filter deleted profiles out of match/user helper functions
CREATE OR REPLACE FUNCTION get_matches_for_user(p_user_id UUID)
RETURNS TABLE (match_data JSON)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
        'photo_url', p1.photo_url
      ),
      'profile_2', json_build_object(
        'id', p2.id,
        'first_name', p2.first_name,
        'last_name', p2.last_name,
        'date_of_birth', p2.date_of_birth,
        'city', p2.city,
        'country', p2.country,
        'profession', p2.profession,
        'photo_url', p2.photo_url
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
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.id AS profile_id,
    p.first_name,
    p.last_name,
    p.email,
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
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.city,
    p.country,
    p.profession,
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
$$;

CREATE OR REPLACE FUNCTION get_matches_for_kanban(p_profile_id UUID)
RETURNS TABLE (
  match_id UUID,
  match_status TEXT,
  compatibility_score INTEGER,
  other_profile JSON
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id AS match_id,
    m.match_status,
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
$$;
