-- Update name question to remove "optional" subtitle
UPDATE public.questionnaire_questions
SET subtitle_en = NULL,
    subtitle_fr = NULL
WHERE id = 'name';
