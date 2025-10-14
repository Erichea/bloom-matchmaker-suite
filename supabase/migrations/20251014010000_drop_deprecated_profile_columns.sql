-- IMPORTANT: Only run this migration AFTER verifying that the application works correctly
-- with profile data stored in profile_answers table.

-- This migration removes deprecated columns from profiles table that are now stored in profile_answers.
-- We keep only essential fields needed for system operations and display.

-- Fields we're keeping in profiles table:
-- - id, user_id (system identifiers)
-- - first_name, last_name, email (essential display fields)
-- - date_of_birth, city, height_cm (essential fields still mapped from questionnaire)
-- - status, completion_percentage (workflow fields)
-- - admin_notes, rejection_reason (admin fields)
-- - created_at, updated_at, submitted_for_review_at, approved_at, rejected_at (audit fields)
-- - deleted_at, deleted_by, status_before_deletion (soft delete fields)
-- - access_code_id (registration tracking)
-- - phone, country (contact/location fields)
-- - profile_photos (relationship, not a column)

-- Fields we're dropping (now in profile_answers):
-- - gender (stored as 'gender' question)
-- - profession (stored as 'profession' question)
-- - education (stored as 'education_level' question)
-- - income_level (not actively used)
-- - relationship_status (not actively used)
-- - faith (stored as 'religion' question)
-- - ethnicity (stored as 'ethnicity' question)
-- - number_of_children, wants_more_children (not actively used)
-- - about_me (stored as 'about_me' question)
-- - achievements (not actively used)
-- - interests (stored as 'interests' question)
-- - lifestyle (stored as 'lifestyle' question)
-- - weight_kg (not actively used)
-- - nationality (removed from questionnaire)
-- - Preference fields (all stored in profile_answers with _importance suffix)

-- Step 1: Drop deprecated enum types (after dropping columns that use them)
DO $$
BEGIN
  -- Drop columns that use enum types
  ALTER TABLE profiles DROP COLUMN IF EXISTS gender;
  ALTER TABLE profiles DROP COLUMN IF EXISTS education;
  ALTER TABLE profiles DROP COLUMN IF EXISTS income_level;
  ALTER TABLE profiles DROP COLUMN IF EXISTS relationship_status;

  -- Now drop the enum types
  DROP TYPE IF EXISTS gender_type CASCADE;
  DROP TYPE IF EXISTS education_level CASCADE;
  DROP TYPE IF EXISTS income_level CASCADE;
  DROP TYPE IF EXISTS relationship_status CASCADE;

  RAISE NOTICE 'Dropped enum types and related columns';
END $$;

-- Step 2: Drop other deprecated columns
ALTER TABLE profiles DROP COLUMN IF EXISTS profession;
ALTER TABLE profiles DROP COLUMN IF EXISTS faith;
ALTER TABLE profiles DROP COLUMN IF EXISTS ethnicity;
ALTER TABLE profiles DROP COLUMN IF EXISTS number_of_children;
ALTER TABLE profiles DROP COLUMN IF EXISTS wants_more_children;
ALTER TABLE profiles DROP COLUMN IF EXISTS about_me;
ALTER TABLE profiles DROP COLUMN IF EXISTS achievements;
ALTER TABLE profiles DROP COLUMN IF EXISTS interests;
ALTER TABLE profiles DROP COLUMN IF EXISTS lifestyle;
ALTER TABLE profiles DROP COLUMN IF EXISTS weight_kg;
ALTER TABLE profiles DROP COLUMN IF EXISTS nationality;

-- Step 3: Drop preference columns (all now in profile_answers)
ALTER TABLE profiles DROP COLUMN IF EXISTS preferred_gender;
ALTER TABLE profiles DROP COLUMN IF EXISTS preferred_min_age;
ALTER TABLE profiles DROP COLUMN IF EXISTS preferred_max_age;
ALTER TABLE profiles DROP COLUMN IF EXISTS preferred_min_height;
ALTER TABLE profiles DROP COLUMN IF EXISTS preferred_max_height;
ALTER TABLE profiles DROP COLUMN IF EXISTS preferred_location_radius;
ALTER TABLE profiles DROP COLUMN IF EXISTS seeks_similar_values;

-- Step 4: Add comment documenting the new structure
COMMENT ON TABLE profiles IS 'User profiles with essential system fields only. All personal/preference data is stored in profile_answers table. Essential fields kept here: first_name, last_name, email, date_of_birth, city, height_cm for performance and compatibility.';

-- Step 5: Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Dropped all deprecated columns from profiles table';
  RAISE NOTICE 'Profiles table now contains only essential fields';
  RAISE NOTICE 'All personal data is stored in profile_answers table';
END $$;
