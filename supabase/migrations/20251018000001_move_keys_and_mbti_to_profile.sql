-- Move "relationship_keys" and "mbti" from preferences to profile section
-- These are profile questions, not preference questions
-- New profile order (1-18): name through mbti
-- New preferences order (19-26): education_importance through mbti_preference

-- Profile section questions (1-18)
UPDATE public.questionnaire_questions SET question_order = 1 WHERE id = 'name';
UPDATE public.questionnaire_questions SET question_order = 2 WHERE id = 'date_of_birth';
UPDATE public.questionnaire_questions SET question_order = 3 WHERE id = 'gender';
UPDATE public.questionnaire_questions SET question_order = 4 WHERE id = 'city';
UPDATE public.questionnaire_questions SET question_order = 5 WHERE id = 'dating_preference';
UPDATE public.questionnaire_questions SET question_order = 6 WHERE id = 'education_level';
UPDATE public.questionnaire_questions SET question_order = 7 WHERE id = 'height';
UPDATE public.questionnaire_questions SET question_order = 8 WHERE id = 'ethnicity';
UPDATE public.questionnaire_questions SET question_order = 9 WHERE id = 'religion';
UPDATE public.questionnaire_questions SET question_order = 10 WHERE id = 'alcohol';
UPDATE public.questionnaire_questions SET question_order = 11 WHERE id = 'smoking';
UPDATE public.questionnaire_questions SET question_order = 12 WHERE id = 'marriage';
UPDATE public.questionnaire_questions SET question_order = 13 WHERE id = 'marriage_timeline';
UPDATE public.questionnaire_questions SET question_order = 14 WHERE id = 'interests';
UPDATE public.questionnaire_questions SET question_order = 15 WHERE id = 'relationship_values';
UPDATE public.questionnaire_questions SET question_order = 16 WHERE id = 'relationship_keys';
UPDATE public.questionnaire_questions SET question_order = 17 WHERE id = 'mbti';

-- Preference section questions (18-25)
UPDATE public.questionnaire_questions SET question_order = 18 WHERE id = 'education_importance';
UPDATE public.questionnaire_questions SET question_order = 19 WHERE id = 'height_preference';
UPDATE public.questionnaire_questions SET question_order = 20 WHERE id = 'ethnicity_importance';
UPDATE public.questionnaire_questions SET question_order = 21 WHERE id = 'appearance_importance';
UPDATE public.questionnaire_questions SET question_order = 22 WHERE id = 'religion_importance';
UPDATE public.questionnaire_questions SET question_order = 23 WHERE id = 'age_importance';
UPDATE public.questionnaire_questions SET question_order = 24 WHERE id = 'income_importance';
UPDATE public.questionnaire_questions SET question_order = 25 WHERE id = 'mbti_preference';
