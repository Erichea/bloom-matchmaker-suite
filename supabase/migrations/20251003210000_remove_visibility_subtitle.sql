-- Remove "Always visible on profile" subtitle from height question
UPDATE public.questionnaire_questions
SET subtitle_en = NULL,
    subtitle_fr = NULL
WHERE id = 'height';
