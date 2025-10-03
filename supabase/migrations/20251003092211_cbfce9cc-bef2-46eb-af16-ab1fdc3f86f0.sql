-- Create questionnaire_questions table for flexible, versioned questions
CREATE TABLE IF NOT EXISTS public.questionnaire_questions (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'textarea', 'single_choice', 'multiple_choice', 'scale', 'date', 'number')),
  question_text_en TEXT NOT NULL,
  question_text_fr TEXT,
  subtitle_en TEXT,
  subtitle_fr TEXT,
  help_text_en TEXT,
  help_text_fr TEXT,
  options JSONB,
  validation_rules JSONB,
  is_required BOOLEAN DEFAULT true,
  conditional_on TEXT,
  conditional_value TEXT,
  profile_field_mapping TEXT,
  icon_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id, version)
);

-- Enable RLS
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read questions (needed for signup flow)
CREATE POLICY "Anyone can read questions"
  ON public.questionnaire_questions
  FOR SELECT
  USING (true);

-- Only admins can modify questions
CREATE POLICY "Admins can manage questions"
  ON public.questionnaire_questions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create index for efficient querying
CREATE INDEX idx_questionnaire_questions_order ON public.questionnaire_questions(version, question_order);

-- Add trigger for updated_at
CREATE TRIGGER update_questionnaire_questions_updated_at
  BEFORE UPDATE ON public.questionnaire_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert the 24 questions for version 1
INSERT INTO public.questionnaire_questions (id, version, question_order, question_type, question_text_en, question_text_fr, subtitle_en, options, validation_rules, is_required, profile_field_mapping, icon_name) VALUES
-- Q1: Name (handled in separate component)
('name', 1, 1, 'text', 'What''s your name?', 'Quel est votre nom?', 'Last name is optional and only shared with matches', '{"fields": ["first_name", "last_name"]}', '{"first_name_required": true}', true, 'first_name,last_name', 'user'),

-- Q2: Date of Birth
('date_of_birth', 1, 2, 'date', 'What''s your date of birth?', 'Quelle est votre date de naissance?', 'We use this to calculate your age on your profile', '{}', '{"min_age": 18}', true, 'date_of_birth', 'cake'),

-- Q3: Gender
('gender', 1, 3, 'single_choice', 'Which gender best describes you?', 'Quel genre vous décrit le mieux?', null, '["Man", "Woman", "Nonbinary"]', '{}', true, 'gender', 'user'),

-- Q4: City
('city', 1, 4, 'text', 'Where do you live?', 'Où habitez-vous?', null, '{}', '{}', true, 'city', 'map-pin'),

-- Q5: Dating Preference
('dating_preference', 1, 5, 'multiple_choice', 'Who do you want to date?', 'Qui voulez-vous rencontrer?', 'Select all who you''re open to meeting', '["Men", "Women", "Nonbinary people", "Everyone"]', '{}', true, null, 'heart'),

-- Q6: Education Level
('education_level', 1, 6, 'single_choice', 'What''s your education level?', 'Quel est votre niveau d''éducation?', null, '["No diploma", "High school (Bac)", "Bachelor''s (Licence)", "Master''s", "Doctorate (Doctorat)", "Prefer not to say"]', '{}', true, 'education', 'graduation-cap'),

-- Q7: Education Importance
('education_importance', 1, 7, 'scale', 'How important is your partner''s education level?', 'Quelle importance accordez-vous au niveau d''éducation de votre partenaire?', null, '{"min": 1, "max": 5, "min_label": "Not important", "max_label": "Essential"}', '{}', true, null, 'graduation-cap'),

-- Q8: Height
('height', 1, 8, 'number', 'How tall are you?', 'Quelle est votre taille?', 'Always visible on profile', '{"unit": "cm", "min": 140, "max": 220, "default": 170}', '{}', true, 'height_cm', 'ruler'),

-- Q9: Height Preference
('height_preference', 1, 9, 'scale', 'How important is it that your partner is at least as tall as you?', 'Quelle importance accordez-vous à ce que votre partenaire soit au moins aussi grand que vous?', null, '{"min": 1, "max": 5, "min_label": "Not important", "max_label": "Essential"}', '{}', true, null, 'ruler'),

-- Q10: Ethnicity
('ethnicity', 1, 10, 'single_choice', 'What''s your ethnicity?', 'Quelle est votre origine?', null, '["Chinese (Wenzhou)", "Chinese (Cantonese)", "Chinese (Teochew)", "Laotian", "Vietnamese", "Cambodian", "Thai", "Korean", "Japanese", "Other Asian", "Prefer not to say"]', '{}', true, null, 'globe'),

-- Q11: Ethnicity Importance
('ethnicity_importance', 1, 11, 'scale', 'Is it important that your partner shares your community background?', 'Est-il important que votre partenaire partage vos origines?', null, '{"min": 1, "max": 5, "min_label": "Not important", "max_label": "Essential"}', '{}', true, null, 'globe'),

-- Q12: Physical Appearance Importance
('appearance_importance', 1, 12, 'scale', 'How important is physical appearance to you?', 'Quelle importance accordez-vous à l''apparence physique?', null, '{"min": 1, "max": 5, "min_label": "Not important", "max_label": "Essential"}', '{}', true, null, 'eye'),

-- Q13: Religion
('religion', 1, 13, 'single_choice', 'What''s your religion?', 'Quelle est votre religion?', null, '["Buddhist", "Catholic", "Protestant", "Muslim", "Jewish", "Hindu", "Atheist", "Agnostic", "Spiritual but not religious", "Other", "Prefer not to say"]', '{}', true, 'faith', 'church'),

-- Q14: Religion Importance
('religion_importance', 1, 14, 'scale', 'Do you want your partner to share your religion?', 'Voulez-vous que votre partenaire partage votre religion?', null, '{"min": 1, "max": 5, "min_label": "Not important", "max_label": "Essential"}', '{}', true, null, 'church'),

-- Q15: Alcohol
('alcohol', 1, 15, 'single_choice', 'Do you drink?', 'Buvez-vous de l''alcool?', null, '["Yes", "Sometimes", "No", "Prefer not to say"]', '{}', true, null, 'wine'),

-- Q16: Smoking
('smoking', 1, 16, 'single_choice', 'Do you smoke?', 'Fumez-vous?', null, '["Yes", "Sometimes", "No", "Prefer not to say"]', '{}', true, null, 'cigarette'),

-- Q17: Marriage
('marriage', 1, 17, 'single_choice', 'Do you want to get married?', 'Voulez-vous vous marier?', null, '["Yes", "Maybe", "No", "Prefer not to say"]', '{}', true, null, 'heart'),

-- Q18: Marriage Timeline (Conditional on Q17)
('marriage_timeline', 1, 18, 'single_choice', 'When would you like to get married?', 'Quand aimeriez-vous vous marier?', null, '["Within 1 year", "1-2 years", "2-5 years", "5+ years", "Not sure yet"]', '{}', false, null, 'calendar'),

-- Q19: Age Importance
('age_importance', 1, 19, 'scale', 'How important is age compatibility?', 'Quelle importance accordez-vous à la compatibilité d''âge?', null, '{"min": 1, "max": 5, "min_label": "Not important", "max_label": "Essential"}', '{}', true, null, 'calendar'),

-- Q20: Income Importance
('income_importance', 1, 20, 'scale', 'How important is your partner''s income level?', 'Quelle importance accordez-vous au niveau de revenu de votre partenaire?', null, '{"min": 1, "max": 5, "min_label": "Not important", "max_label": "Essential"}', '{}', true, null, 'dollar-sign'),

-- Q21: Interests
('interests', 1, 21, 'multiple_choice', 'What are your interests?', 'Quels sont vos centres d''intérêt?', 'Select up to 10', '["Travel", "Cooking", "Fitness/Sports", "Reading", "Music", "Art/Museums", "Gaming", "Technology", "Fashion", "Photography", "Outdoor activities", "Food/Restaurants", "Movies/TV", "Dancing", "Yoga/Meditation", "Volunteering", "Entrepreneurship", "Learning Languages"]', '{"max_selections": 10}', true, null, 'star'),

-- Q22: Relationship Values
('relationship_values', 1, 22, 'multiple_choice', 'What''s important to you in a relationship?', 'Qu''est-ce qui est important pour vous dans une relation?', 'Select your top 5 priorities', '["Shared values", "Energy/chemistry", "Similarities", "Physical attraction", "Personality", "Communication", "Open-mindedness", "Compromise", "Similar family goals", "Intellectual conversations", "Trust", "Humor", "Emotional support"]', '{"max_selections": 5}', true, null, 'heart'),

-- Q23: Relationship Keys
('relationship_keys', 1, 23, 'textarea', 'Three key elements for a good relationship:', 'Trois éléments clés pour une bonne relation:', 'Share what matters most to you', '{"fields": 3, "max_length": 50}', '{}', true, null, 'key'),

-- Q24: MBTI
('mbti', 1, 24, 'single_choice', 'What''s your MBTI personality type?', 'Quel est votre type de personnalité MBTI?', 'Don''t know your type? Take the test', '["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP", "Don''t know / Prefer not to say"]', '{}', false, null, 'brain');

-- Update profile_answers to track questionnaire version
ALTER TABLE public.profile_answers ADD COLUMN IF NOT EXISTS questionnaire_version INTEGER DEFAULT 1;