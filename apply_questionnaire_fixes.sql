-- Run this in Supabase SQL Editor to apply questionnaire fixes

-- Add autocomplete to allowed question types
ALTER TABLE public.questionnaire_questions
DROP CONSTRAINT IF EXISTS questionnaire_questions_question_type_check;

ALTER TABLE public.questionnaire_questions
ADD CONSTRAINT questionnaire_questions_question_type_check
CHECK (question_type IN ('text', 'textarea', 'single_choice', 'multiple_choice', 'scale', 'date', 'number', 'autocomplete'));

-- Fix Q18 to add conditional logic (only show if Q17 = "Yes")
UPDATE public.questionnaire_questions
SET
  conditional_on = 'marriage',
  conditional_value = 'Yes',
  is_required = true
WHERE id = 'marriage_timeline';

-- Update Q4 city to be autocomplete type with French cities
UPDATE public.questionnaire_questions
SET
  question_type = 'autocomplete',
  options = '["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"]'::jsonb
WHERE id = 'city';

-- Add ethnicity column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ethnicity TEXT;

-- Create index on ethnicity for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_ethnicity ON public.profiles(ethnicity);

-- Update profile_field_mapping for ethnicity question
UPDATE public.questionnaire_questions
SET profile_field_mapping = 'ethnicity'
WHERE id = 'ethnicity';

-- Fix education level options to remove other and prefer_not_to_say
UPDATE public.questionnaire_questions
SET options = '["High School", "Bachelor''s Degree", "Master''s Degree", "PhD"]'::jsonb
WHERE id = 'education_level';

-- Update dating_preference to store as JSONB array
UPDATE public.questionnaire_questions
SET
  help_text_en = 'This helps us find compatible matches for you',
  profile_field_mapping = NULL  -- Will be handled separately in code
WHERE id = 'dating_preference';

-- Update name question to remove "optional" subtitle
UPDATE public.questionnaire_questions
SET subtitle_en = NULL,
    subtitle_fr = NULL
WHERE id = 'name';

-- Remove "Always visible on profile" subtitle from height question
UPDATE public.questionnaire_questions
SET subtitle_en = NULL,
    subtitle_fr = NULL
WHERE id = 'height';

-- Remove nationality question (not needed)
DELETE FROM public.questionnaire_questions
WHERE id = 'nationality';

-- Update city question order back to 4 if needed
UPDATE public.questionnaire_questions
SET question_order = 4
WHERE id = 'city' AND question_order != 4;
