-- Remove the 'What is your name?' question from questionnaire as name is already collected during account creation

-- First, delete any existing answers to the name question
DELETE FROM public.profile_answers WHERE question_id = 'name';

-- Then, delete the name question from questionnaire_questions
DELETE FROM public.questionnaire_questions WHERE id = 'name' AND version = 1;

-- Update question_order for all remaining questions to remove the gap
UPDATE public.questionnaire_questions
SET question_order = question_order - 1
WHERE version = 1 AND question_order > 1;

-- Note: The profile fields (first_name, last_name) are already populated during account creation
-- from user metadata, so no additional migration is needed for profile data