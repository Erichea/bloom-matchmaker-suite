-- Fix: Support both old and new question IDs for backward compatibility
-- This ensures existing data works with the new questionnaire format

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
  -- About You: needs (about_me OR about) AND profession_details (2 questions)
  -- Support both old 'about' and new 'about_me'
  SELECT COUNT(DISTINCT
    CASE
      WHEN question_id IN ('about_me', 'about') THEN 'about'
      WHEN question_id = 'profession_details' THEN 'profession'
    END
  )
  INTO about_you_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id IN ('about_me', 'about', 'profession_details')
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
  -- Get the most recent interests answer if multiple exist
  SELECT COUNT(*)
  INTO interests_count
  FROM (
    SELECT DISTINCT ON (user_id) *
    FROM profile_answers
    WHERE user_id = p_user_id
      AND question_id = 'interests'
      AND answer IS NOT NULL
      AND jsonb_typeof(answer) = 'array'
      AND jsonb_array_length(answer) > 0
    ORDER BY user_id, updated_at DESC
  ) latest;

  IF interests_count >= 1 THEN
    completed_categories := completed_categories + 1;
  END IF;

  -- Lifestyle: needs favorite_activities AND (lifestyle_preferences OR lifestyle) (2 questions)
  SELECT COUNT(DISTINCT
    CASE
      WHEN question_id = 'favorite_activities' THEN 'activities'
      WHEN question_id IN ('lifestyle_preferences', 'lifestyle') THEN 'lifestyle'
    END
  )
  INTO lifestyle_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id IN ('favorite_activities', 'lifestyle_preferences', 'lifestyle')
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

  -- Preferences: needs (deal_breakers OR dealbreakers) (1 question, multiselect, NOT required)
  -- Support both old 'dealbreakers' and new 'deal_breakers'
  -- Always count preferences as complete (since it's optional)
  completed_categories := completed_categories + 1;

  -- Future: needs (future_goals OR future_plans) (1 question, textarea)
  -- Support both old 'future_plans' and new 'future_goals'
  SELECT COUNT(*)
  INTO future_count
  FROM profile_answers
  WHERE user_id = p_user_id
    AND question_id IN ('future_goals', 'future_plans')
    AND answer IS NOT NULL
    AND jsonb_typeof(answer) = 'string'
    AND length(answer::text) > 2;

  IF future_count >= 1 THEN
    completed_categories := completed_categories + 1;
  END IF;

  RETURN ROUND((completed_categories::NUMERIC / total_categories::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now run this to recalculate all existing profiles
DO $$
DECLARE
  profile_record RECORD;
  new_completion INTEGER;
BEGIN
  FOR profile_record IN
    SELECT id, user_id
    FROM profiles
    WHERE user_id IS NOT NULL
  LOOP
    new_completion := calculate_questionnaire_completion(profile_record.user_id);

    UPDATE profiles
    SET completion_percentage = new_completion,
        updated_at = NOW()
    WHERE id = profile_record.id;

    RAISE NOTICE 'Updated profile % with completion: %', profile_record.id, new_completion;
  END LOOP;
END $$;