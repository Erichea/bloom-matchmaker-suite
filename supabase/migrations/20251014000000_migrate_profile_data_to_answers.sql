-- Migration: Move all profile data from profiles table to profile_answers table
-- This migration consolidates the split data structure into a single source of truth

-- Step 1: Migrate existing profile data to profile_answers
-- Only migrate if the answer doesn't already exist in profile_answers

DO $$
DECLARE
  profile_record RECORD;
  answer_value JSONB;
BEGIN
  FOR profile_record IN SELECT * FROM profiles WHERE user_id IS NOT NULL LOOP

    -- Migrate gender (if not null and not already in profile_answers)
    IF profile_record.gender IS NOT NULL THEN
      -- Map database enum back to display value
      answer_value := CASE profile_record.gender::text
        WHEN 'male' THEN '"Man"'::jsonb
        WHEN 'female' THEN '"Woman"'::jsonb
        WHEN 'non_binary' THEN '"Nonbinary"'::jsonb
        ELSE '"Prefer not to say"'::jsonb
      END;

      INSERT INTO profile_answers (user_id, question_id, answer, questionnaire_version)
      VALUES (profile_record.user_id, 'gender', answer_value, 1)
      ON CONFLICT (user_id, question_id) DO NOTHING;
    END IF;

    -- Migrate education (if not null)
    IF profile_record.education IS NOT NULL THEN
      -- Map database enum back to display value
      answer_value := CASE profile_record.education::text
        WHEN 'high_school' THEN '"High school (Bac)"'::jsonb
        WHEN 'bachelor' THEN '"Bachelor''s (Licence)"'::jsonb
        WHEN 'master' THEN '"Master''s"'::jsonb
        WHEN 'phd' THEN '"Doctorate (Doctorat)"'::jsonb
        ELSE '"Other"'::jsonb
      END;

      INSERT INTO profile_answers (user_id, question_id, answer, questionnaire_version)
      VALUES (profile_record.user_id, 'education_level', answer_value, 1)
      ON CONFLICT (user_id, question_id) DO NOTHING;
    END IF;

    -- Migrate profession (if not null)
    IF profile_record.profession IS NOT NULL THEN
      INSERT INTO profile_answers (user_id, question_id, answer, questionnaire_version)
      VALUES (profile_record.user_id, 'profession', to_jsonb(profile_record.profession), 1)
      ON CONFLICT (user_id, question_id) DO NOTHING;
    END IF;

    -- Migrate about_me (if not null)
    IF profile_record.about_me IS NOT NULL THEN
      INSERT INTO profile_answers (user_id, question_id, answer, questionnaire_version)
      VALUES (profile_record.user_id, 'about_me', to_jsonb(profile_record.about_me), 1)
      ON CONFLICT (user_id, question_id) DO NOTHING;
    END IF;

    -- Migrate interests (if not null and not empty array)
    IF profile_record.interests IS NOT NULL AND array_length(profile_record.interests, 1) > 0 THEN
      INSERT INTO profile_answers (user_id, question_id, answer, questionnaire_version)
      VALUES (profile_record.user_id, 'interests', to_jsonb(profile_record.interests), 1)
      ON CONFLICT (user_id, question_id) DO NOTHING;
    END IF;

    -- Migrate lifestyle (if not null and not empty array)
    IF profile_record.lifestyle IS NOT NULL AND array_length(profile_record.lifestyle, 1) > 0 THEN
      INSERT INTO profile_answers (user_id, question_id, answer, questionnaire_version)
      VALUES (profile_record.user_id, 'lifestyle', to_jsonb(profile_record.lifestyle), 1)
      ON CONFLICT (user_id, question_id) DO NOTHING;
    END IF;

    -- Note: We keep these in profiles table as they're essential for system operations:
    -- - first_name, last_name (used for display everywhere)
    -- - email (synced from auth, used for identification)
    -- - date_of_birth (already stored in profile_answers via questionnaire)
    -- - city (already stored in profile_answers via questionnaire)
    -- - height_cm (already stored in profile_answers via questionnaire)
    -- - ethnicity (stored in profile_answers as 'ethnicity' question)
    -- - faith (stored in profile_answers as 'religion' question)

  END LOOP;

  RAISE NOTICE 'Successfully migrated profile data to profile_answers table';
END $$;

-- Step 2: Add a helpful comment to the profiles table
COMMENT ON TABLE profiles IS 'User profiles. Personal data should be stored in profile_answers table. This table contains only: system fields (id, user_id, status, completion_percentage, etc.) and essential display fields (first_name, last_name, email).';

-- Step 3: Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: All profile data has been migrated to profile_answers table';
  RAISE NOTICE 'Next step: Update application code to read from profile_answers instead of profiles table';
  RAISE NOTICE 'Final step: Run cleanup migration to drop deprecated columns';
END $$;
