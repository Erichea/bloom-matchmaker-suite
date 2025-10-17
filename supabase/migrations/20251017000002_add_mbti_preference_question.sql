-- Add MBTI Preference question to the questionnaire
-- Position 28 - After income_importance (27)
-- This question allows users to select multiple MBTI types they're compatible with

INSERT INTO public.questionnaire_questions
  (id, version, question_order, question_type, question_text_en, question_text_fr, subtitle_en, subtitle_fr, options, validation_rules, is_required, profile_field_mapping, icon_name, help_text_en, help_text_fr)
VALUES
  ('mbti_preference', 1, 28, 'multiple_choice',
   'Which MBTI types are you open to dating?',
   'Quels types MBTI êtes-vous ouvert à rencontrer?',
   'Select the personality types you connect with',
   'Sélectionnez les types de personnalité avec lesquels vous connectez',
   '[]'::jsonb,
   '{"min_selections": 1}'::jsonb,
   false,
   null,
   'brain',
   'Choose at least one MBTI type. You can adjust the sliders to discover recommendations based on the 4 personality axes.',
   'Choisissez au moins un type MBTI. Vous pouvez ajuster les curseurs pour découvrir des recommandations basées sur les 4 axes de personnalité.');
