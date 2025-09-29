-- Add rejection_reason and submitted_for_review_at to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Create index for efficient querying by status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_completion_percentage ON profiles(completion_percentage);

-- Create a function to calculate questionnaire completion percentage
CREATE OR REPLACE FUNCTION calculate_questionnaire_completion(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_questions INTEGER := 8; -- Update this based on your total questions
  answered_questions INTEGER;
BEGIN
  SELECT COUNT(DISTINCT question_id)
  INTO answered_questions
  FROM profile_answers
  WHERE user_id = p_user_id AND answer IS NOT NULL;

  RETURN LEAST(100, ROUND((answered_questions::NUMERIC / total_questions::NUMERIC) * 100));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to submit profile for review
CREATE OR REPLACE FUNCTION submit_profile_for_review(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile_id UUID;
  v_completion INTEGER;
  v_current_status TEXT;
BEGIN
  -- Get profile info
  SELECT id, completion_percentage, status
  INTO v_profile_id, v_completion, v_current_status
  FROM profiles
  WHERE user_id = p_user_id;

  -- Check if profile exists
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Profile not found'
    );
  END IF;

  -- Calculate latest completion percentage
  v_completion := calculate_questionnaire_completion(p_user_id);

  -- Check if profile is complete enough (at least 80%)
  IF v_completion < 80 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Profile must be at least 80% complete to submit for review',
      'completion_percentage', v_completion
    );
  END IF;

  -- Update profile status to pending_approval
  UPDATE profiles
  SET
    status = 'pending_approval',
    completion_percentage = v_completion,
    submitted_for_review_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Profile submitted for review successfully',
    'completion_percentage', v_completion
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function for admin to approve profile
CREATE OR REPLACE FUNCTION approve_profile(p_profile_id UUID, p_admin_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify admin has admin role
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Unauthorized: Admin role required'
    );
  END IF;

  -- Get user_id from profile
  SELECT user_id INTO v_user_id FROM profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Profile not found'
    );
  END IF;

  -- Update profile to approved
  UPDATE profiles
  SET
    status = 'approved',
    approved_at = NOW(),
    reviewed_by = p_admin_id,
    rejection_reason = NULL,
    rejected_at = NULL,
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Profile approved successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function for admin to reject profile
CREATE OR REPLACE FUNCTION reject_profile(p_profile_id UUID, p_admin_id UUID, p_rejection_reason TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify admin has admin role
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_admin_id AND role = 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Unauthorized: Admin role required'
    );
  END IF;

  -- Get user_id from profile
  SELECT user_id INTO v_user_id FROM profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Profile not found'
    );
  END IF;

  -- Update profile to rejected and back to incomplete status
  UPDATE profiles
  SET
    status = 'rejected',
    rejected_at = NOW(),
    reviewed_by = p_admin_id,
    rejection_reason = p_rejection_reason,
    approved_at = NULL,
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Profile rejected successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for admin functions (drop if exists first)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
    OR user_id = auth.uid()
  );

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION submit_profile_for_review(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_profile(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_questionnaire_completion(UUID) TO authenticated;