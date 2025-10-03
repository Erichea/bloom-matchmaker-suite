-- Remove nationality question
DELETE FROM public.questionnaire_questions
WHERE id = 'nationality';

-- Update city question order back to 4
UPDATE public.questionnaire_questions
SET question_order = question_order - 1
WHERE question_order > 4;
