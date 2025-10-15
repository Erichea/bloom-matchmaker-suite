-- Update ethnicity question from single_choice to multiple_choice to allow users to select multiple cultural origins
UPDATE public.questionnaire_questions
SET
  question_type = 'multiple_choice',
  validation_rules = '{"max_selections": 3}'
WHERE id = 'ethnicity' AND version = 1;

-- Migrate existing single answers to arrays for compatibility with multiple choice
UPDATE public.profile_answers
SET answer = jsonb_build_array(answer)
WHERE question_id = 'ethnicity'
  AND jsonb_typeof(answer) != 'array';