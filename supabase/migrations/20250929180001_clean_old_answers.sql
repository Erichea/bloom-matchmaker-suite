-- Clean up old questionnaire data to remove technical debt
-- This deletes all answers from the old ProfileQuestionnaire.tsx component
-- Users will need to re-fill the questionnaire with the new format

-- Delete old question IDs that don't match the new questionnaire
DELETE FROM profile_answers
WHERE question_id IN (
  'about',              -- old, replaced by 'about_me'
  'ideal_partner',      -- old, not in new questionnaire
  'dealbreakers',       -- old, replaced by 'deal_breakers'
  'future_plans',       -- old, replaced by 'future_goals'
  'lifestyle'           -- old, replaced by 'lifestyle_preferences'
);

-- Reset all profiles to incomplete status and 0% completion
-- This ensures users start fresh with the correct questionnaire
UPDATE profiles
SET
  status = 'incomplete',
  completion_percentage = 0,
  submitted_for_review_at = NULL,
  approved_at = NULL,
  rejected_at = NULL,
  rejection_reason = NULL,
  reviewed_by = NULL,
  updated_at = NOW()
WHERE status != 'approved';  -- Don't reset approved users

-- Optional: If you want to reset ALL users (including approved), uncomment below:
-- UPDATE profiles
-- SET
--   status = 'incomplete',
--   completion_percentage = 0,
--   submitted_for_review_at = NULL,
--   approved_at = NULL,
--   rejected_at = NULL,
--   rejection_reason = NULL,
--   reviewed_by = NULL,
--   updated_at = NOW();

-- Log what was cleaned
DO $$
DECLARE
  deleted_count INTEGER;
  reset_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  SELECT COUNT(*) INTO reset_count
  FROM profiles
  WHERE status = 'incomplete';

  RAISE NOTICE 'Cleaned up old questionnaire data';
  RAISE NOTICE 'Reset % profiles to incomplete status', reset_count;
  RAISE NOTICE 'Users will need to complete the new questionnaire';
END $$;