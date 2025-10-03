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

-- Fix education level options to match enum exactly
UPDATE public.questionnaire_questions
SET options = '["high_school", "bachelor", "master", "phd", "other", "prefer_not_to_say"]'::jsonb
WHERE id = 'education_level';

-- Update nationality question to be before city (order 4) and push city to order 5
UPDATE public.questionnaire_questions
SET question_order = question_order + 1
WHERE question_order >= 4 AND id != 'nationality';

-- Insert country/nationality question if it doesn't exist
INSERT INTO public.questionnaire_questions
(id, version, question_order, question_type, question_text_en, question_text_fr, subtitle_en, options, validation_rules, is_required, profile_field_mapping, icon_name)
VALUES
('nationality', 1, 4, 'text', 'What''s your nationality?', 'Quelle est votre nationalité?', NULL, '{}', '{}', true, 'nationality', 'flag')
ON CONFLICT (id, version) DO UPDATE
SET question_order = 4,
    profile_field_mapping = 'nationality';

-- Update dating_preference to store as JSONB array
UPDATE public.questionnaire_questions
SET
  help_text_en = 'This helps us find compatible matches for you',
  profile_field_mapping = NULL  -- Will be handled separately in code
WHERE id = 'dating_preference';
