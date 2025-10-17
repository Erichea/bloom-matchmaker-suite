-- Add Profession and School questions to the questionnaire
-- Position 8 (School) and 9 (Profession) - logically grouped with Education Level (7)
-- These questions belong in the "Personal Background" category

-- Insert School question at position 8
INSERT INTO public.questionnaire_questions
  (id, version, question_order, question_type, question_text_en, question_text_fr, subtitle_en, options, validation_rules, is_required, profile_field_mapping, icon_name, help_text_en, help_text_fr)
VALUES
  ('school', 1, 8, 'text', 'What school did you attend?', 'Quelle école avez-vous fréquentée?', 'University, college, or institution name', '{}', '{"maxLength": 100}', false, null, 'graduation-cap', 'Enter your school, university, or institution', 'Entrez votre école, université ou établissement');

-- Insert Profession question at position 9
INSERT INTO public.questionnaire_questions
  (id, version, question_order, question_type, question_text_en, question_text_fr, subtitle_en, options, validation_rules, is_required, profile_field_mapping, icon_name, help_text_en, help_text_fr)
VALUES
  ('profession', 1, 9, 'text', 'What is your profession?', 'Quelle est votre profession?', 'Your current occupation or field of work', '{}', '{"maxLength": 100}', false, null, 'briefcase', 'Enter your job title or profession', 'Entrez votre titre de poste ou profession');

-- Shift all questions after position 7 down by 2 to make room for the new questions
-- Profile questions (old positions 8-18 become 10-20)
UPDATE public.questionnaire_questions SET question_order = 10 WHERE id = 'height';
UPDATE public.questionnaire_questions SET question_order = 11 WHERE id = 'ethnicity';
UPDATE public.questionnaire_questions SET question_order = 12 WHERE id = 'religion';
UPDATE public.questionnaire_questions SET question_order = 13 WHERE id = 'alcohol';
UPDATE public.questionnaire_questions SET question_order = 14 WHERE id = 'smoking';
UPDATE public.questionnaire_questions SET question_order = 15 WHERE id = 'marriage';
UPDATE public.questionnaire_questions SET question_order = 16 WHERE id = 'marriage_timeline';
UPDATE public.questionnaire_questions SET question_order = 17 WHERE id = 'interests';
UPDATE public.questionnaire_questions SET question_order = 18 WHERE id = 'relationship_values';
UPDATE public.questionnaire_questions SET question_order = 19 WHERE id = 'relationship_keys';
UPDATE public.questionnaire_questions SET question_order = 20 WHERE id = 'mbti';

-- Preference questions also shift (old positions 19-25 become 21-27)
UPDATE public.questionnaire_questions SET question_order = 21 WHERE id = 'education_importance';
UPDATE public.questionnaire_questions SET question_order = 22 WHERE id = 'height_preference';
UPDATE public.questionnaire_questions SET question_order = 23 WHERE id = 'ethnicity_importance';
UPDATE public.questionnaire_questions SET question_order = 24 WHERE id = 'appearance_importance';
UPDATE public.questionnaire_questions SET question_order = 25 WHERE id = 'religion_importance';
UPDATE public.questionnaire_questions SET question_order = 26 WHERE id = 'age_importance';
UPDATE public.questionnaire_questions SET question_order = 27 WHERE id = 'income_importance';
