-- Add Instagram contact question after basic info (name, DOB, gender, city)
-- Position 5 makes sense as it's personal contact info that comes after identity basics
INSERT INTO public.questionnaire_questions
  (id, version, question_order, question_type, question_text_en, question_text_fr, subtitle_en, options, validation_rules, is_required, profile_field_mapping, icon_name, help_text_en, help_text_fr)
VALUES
  ('instagram_contact', 1, 5, 'text', 'What''s your Instagram username?', 'Quel est votre nom d''utilisateur Instagram?', 'Only visible to mutual matches', '{}', '{"pattern": "^@?[A-Za-z0-9._]+$"}', false, null, 'instagram', 'Enter your Instagram handle (e.g., @username)', 'Entrez votre identifiant Instagram (par ex. @username)');

-- Shift all questions after position 4 down by one to make room
UPDATE public.questionnaire_questions SET question_order = 6 WHERE id = 'dating_preference';
UPDATE public.questionnaire_questions SET question_order = 7 WHERE id = 'education_level';
UPDATE public.questionnaire_questions SET question_order = 8 WHERE id = 'height';
UPDATE public.questionnaire_questions SET question_order = 9 WHERE id = 'ethnicity';
UPDATE public.questionnaire_questions SET question_order = 10 WHERE id = 'religion';
UPDATE public.questionnaire_questions SET question_order = 11 WHERE id = 'alcohol';
UPDATE public.questionnaire_questions SET question_order = 12 WHERE id = 'smoking';
UPDATE public.questionnaire_questions SET question_order = 13 WHERE id = 'marriage';
UPDATE public.questionnaire_questions SET question_order = 14 WHERE id = 'marriage_timeline';
UPDATE public.questionnaire_questions SET question_order = 15 WHERE id = 'interests';
UPDATE public.questionnaire_questions SET question_order = 16 WHERE id = 'relationship_values';
UPDATE public.questionnaire_questions SET question_order = 17 WHERE id = 'relationship_keys';
UPDATE public.questionnaire_questions SET question_order = 18 WHERE id = 'mbti';

-- Preference questions also shift
UPDATE public.questionnaire_questions SET question_order = 19 WHERE id = 'education_importance';
UPDATE public.questionnaire_questions SET question_order = 20 WHERE id = 'height_preference';
UPDATE public.questionnaire_questions SET question_order = 21 WHERE id = 'ethnicity_importance';
UPDATE public.questionnaire_questions SET question_order = 22 WHERE id = 'appearance_importance';
UPDATE public.questionnaire_questions SET question_order = 23 WHERE id = 'religion_importance';
UPDATE public.questionnaire_questions SET question_order = 24 WHERE id = 'age_importance';
UPDATE public.questionnaire_questions SET question_order = 25 WHERE id = 'income_importance';
