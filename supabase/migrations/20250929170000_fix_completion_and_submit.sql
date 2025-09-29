-- Complete fix for completion calculation and submit workflow
-- This ensures the completion percentage and status workflow work correctly

-- First, let's fix the completion calculation to be more robust
CREATE OR REPLACE FUNCTION calculate_questionnaire_completion(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_categories INTEGER := 8;
  completed_categories INTEGER := 0;

  -- Track each category completion
  about_you_count INTEGER;
  interests_count INTEGER;
  lifestyle_count INTEGER;
  values_count INTEGER;
  personality_count INTEGER;
  relationship_count INTEGER;
  preferences_count INTEGER;
  future_count INTEGER;
BEGIN
  -- About You: needs about_me AND profession_details (2 questions)
  SELECT COUNT(*)
  INTO about_you_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id IN ('about_me', 'profession_details')
    AND answer IS NOT NULL
    AND jsonb_typeof(answer) != 'null'
    AND (
      (jsonb_typeof(answer) = 'string' AND length(answer::text) > 2) OR
      (jsonb_typeof(answer) = 'array' AND jsonb_array_length(answer) > 0)
    );

  IF about_you_count >= 2 THEN
    completed_categories := completed_categories + 1;
  END IF;

  -- Interests: needs interests (1 question, multiselect)
  SELECT COUNT(*)
  INTO interests_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id = 'interests'
    AND answer IS NOT NULL
    AND jsonb_typeof(answer) = 'array'
    AND jsonb_array_length(answer) > 0;

  IF interests_count >= 1 THEN
    completed_categories := completed_categories + 1;
  END IF;

  -- Lifestyle: needs favorite_activities AND lifestyle_preferences (2 questions)
  SELECT COUNT(*)
  INTO lifestyle_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id IN ('favorite_activities', 'lifestyle_preferences')
    AND answer IS NOT NULL
    AND jsonb_typeof(answer) != 'null'
    AND (
      (jsonb_typeof(answer) = 'string' AND length(answer::text) > 2) OR
      (jsonb_typeof(answer) = 'array' AND jsonb_array_length(answer) > 0)
    );

  IF lifestyle_count >= 2 THEN
    completed_categories := completed_categories + 1;
  END IF;

  -- Values: needs values (1 question, multiselect)
  SELECT COUNT(*)
  INTO values_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id = 'values'
    AND answer IS NOT NULL
    AND jsonb_typeof(answer) = 'array'
    AND jsonb_array_length(answer) > 0;

  IF values_count >= 1 THEN
    completed_categories := completed_categories + 1;
  END IF;

  -- Personality: needs personality_traits (1 question, multiselect)
  SELECT COUNT(*)
  INTO personality_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id = 'personality_traits'
    AND answer IS NOT NULL
    AND jsonb_typeof(answer) = 'array'
    AND jsonb_array_length(answer) > 0;

  IF personality_count >= 1 THEN
    completed_categories := completed_categories + 1;
  END IF;

  -- Relationship: needs relationship_goals (1 question, select)
  SELECT COUNT(*)
  INTO relationship_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id = 'relationship_goals'
    AND answer IS NOT NULL
    AND jsonb_typeof(answer) = 'string'
    AND length(answer::text) > 2;

  IF relationship_count >= 1 THEN
    completed_categories := completed_categories + 1;
  END IF;

  -- Preferences: needs deal_breakers (1 question, multiselect, NOT required)
  -- Count as complete if exists OR skip it for completion
  SELECT COUNT(*)
  INTO preferences_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id = 'deal_breakers';

  -- Always count preferences as complete (since it's optional)
  completed_categories := completed_categories + 1;

  -- Future: needs future_goals (1 question, textarea)
  SELECT COUNT(*)
  INTO future_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id = 'future_goals'
    AND answer IS NOT NULL
    AND jsonb_typeof(answer) = 'string'
    AND length(answer::text) > 2;

  IF future_count >= 1 THEN
    completed_categories := completed_categories + 1;
  END IF;

  RETURN ROUND((completed_categories::NUMERIC / total_categories::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now update the submit_profile_for_review function to use correct status enum
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

  -- Check if profile is complete enough (at least 75% for 6/8 categories)
  IF v_completion < 75 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', format('Profile must be at least 75%% complete to submit for review. Current: %s%%', v_completion),
      'completion_percentage', v_completion
    );
  END IF;

  -- Update profile status to pending_approval (correct enum value)
  UPDATE profiles
  SET
    status = 'pending_approval',  -- Fixed: was 'pending', should be 'pending_approval'
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