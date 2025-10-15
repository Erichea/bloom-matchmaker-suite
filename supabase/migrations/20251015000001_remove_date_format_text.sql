-- Remove 'Format: DD/MM/YYYY' subtitle from date of birth question since the input already shows the format
UPDATE public.questionnaire_questions
SET
  subtitle_en = NULL,
  subtitle_fr = NULL
WHERE id = 'date_of_birth';