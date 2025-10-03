-- Update date of birth question help text to reflect DD/MM/YYYY format
UPDATE public.questionnaire_questions
SET
  subtitle_en = 'Format: DD/MM/YYYY',
  subtitle_fr = 'Format: JJ/MM/AAAA'
WHERE id = 'date_of_birth';
