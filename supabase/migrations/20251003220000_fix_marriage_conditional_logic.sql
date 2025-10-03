-- Update marriage_timeline conditional logic to use negative logic
-- Show timing question UNLESS answer is "No" or "Prefer not to say"
UPDATE public.questionnaire_questions
SET
  conditional_on = 'marriage',
  conditional_value = 'NOT:No,Prefer not to say',
  is_required = true
WHERE id = 'marriage_timeline';
