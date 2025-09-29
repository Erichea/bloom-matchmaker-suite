-- Update the completion calculation to match the frontend category-based logic
-- This matches ProfileQuestionnairePage.tsx which calculates by completed categories

CREATE OR REPLACE FUNCTION calculate_questionnaire_completion(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  -- Define questions by category (must match frontend)
  total_categories INTEGER := 8;
  completed_categories INTEGER := 0;

  -- Category: About You (2 questions: about_me, profession_details)
  about_you_complete BOOLEAN;

  -- Category: Interests (1 question: interests)
  interests_complete BOOLEAN;

  -- Category: Lifestyle (2 questions: favorite_activities, lifestyle_preferences)
  lifestyle_complete BOOLEAN;

  -- Category: Values (1 question: values)
  values_complete BOOLEAN;

  -- Category: Personality (1 question: personality_traits)
  personality_complete BOOLEAN;

  -- Category: Relationship (1 question: relationship_goals)
  relationship_complete BOOLEAN;

  -- Category: Preferences (1 question: deal_breakers)
  preferences_complete BOOLEAN;

  -- Category: Future (1 question: future_goals)
  future_complete BOOLEAN;

BEGIN
  -- Check About You category (requires both about_me AND profession_details)
  SELECT
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'about_me' AND answer IS NOT NULL AND answer::text != '' AND answer::text != '""' AND answer::text != '[]') > 0
    AND
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'profession_details' AND answer IS NOT NULL AND answer::text != '' AND answer::text != '""' AND answer::text != '[]') > 0
  INTO about_you_complete;

  -- Check Interests category (requires interests)
  SELECT
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'interests' AND answer IS NOT NULL AND answer::text != '[]' AND answer::text != '""') > 0
  INTO interests_complete;

  -- Check Lifestyle category (requires favorite_activities AND lifestyle_preferences)
  SELECT
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'favorite_activities' AND answer IS NOT NULL AND answer::text != '' AND answer::text != '""' AND answer::text != '[]') > 0
    AND
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'lifestyle_preferences' AND answer IS NOT NULL AND answer::text != '[]' AND answer::text != '""') > 0
  INTO lifestyle_complete;

  -- Check Values category (requires values)
  SELECT
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'values' AND answer IS NOT NULL AND answer::text != '[]' AND answer::text != '""') > 0
  INTO values_complete;

  -- Check Personality category (requires personality_traits)
  SELECT
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'personality_traits' AND answer IS NOT NULL AND answer::text != '[]' AND answer::text != '""') > 0
  INTO personality_complete;

  -- Check Relationship category (requires relationship_goals)
  SELECT
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'relationship_goals' AND answer IS NOT NULL AND answer::text != '' AND answer::text != '""' AND answer::text != '[]') > 0
  INTO relationship_complete;

  -- Check Preferences category (requires deal_breakers - not required, so always count as complete if any data exists or skip it)
  SELECT
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'deal_breakers') > 0
  INTO preferences_complete;

  -- Check Future category (requires future_goals)
  SELECT
    (SELECT COUNT(*) FROM profile_answers WHERE user_id = p_user_id AND question_id = 'future_goals' AND answer IS NOT NULL AND answer::text != '' AND answer::text != '""' AND answer::text != '[]') > 0
  INTO future_complete;

  -- Count completed categories
  completed_categories :=
    (CASE WHEN about_you_complete THEN 1 ELSE 0 END) +
    (CASE WHEN interests_complete THEN 1 ELSE 0 END) +
    (CASE WHEN lifestyle_complete THEN 1 ELSE 0 END) +
    (CASE WHEN values_complete THEN 1 ELSE 0 END) +
    (CASE WHEN personality_complete THEN 1 ELSE 0 END) +
    (CASE WHEN relationship_complete THEN 1 ELSE 0 END) +
    (CASE WHEN preferences_complete THEN 1 ELSE 0 END) +
    (CASE WHEN future_complete THEN 1 ELSE 0 END);

  RETURN ROUND((completed_categories::NUMERIC / total_categories::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;