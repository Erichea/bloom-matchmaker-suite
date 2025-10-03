-- Enhance MBTI question with better help text
UPDATE public.questionnaire_questions
SET
  subtitle_en = 'Don''t know your type? Take the test - it only takes 15 minutes and really helps understand your personality!',
  subtitle_fr = 'Vous ne connaissez pas votre type? Faites le test - cela ne prend que 15 minutes et aide vraiment à comprendre votre personnalité!',
  help_text_en = 'Click "Take the test" to visit 16personalities.com',
  help_text_fr = 'Cliquez sur "Faire le test" pour visiter 16personalities.com'
WHERE id = 'mbti';
