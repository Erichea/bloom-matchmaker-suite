-- Fix education level options to remove other and prefer_not_to_say
UPDATE public.questionnaire_questions
SET options = '["High School", "Bachelor''s Degree", "Master''s Degree", "PhD"]'::jsonb
WHERE id = 'education_level';
