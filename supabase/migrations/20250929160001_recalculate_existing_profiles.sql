-- Recalculate completion percentage for all existing profiles
-- This will fix profiles that were created before the new calculation logic

DO $$
DECLARE
  profile_record RECORD;
  new_completion INTEGER;
BEGIN
  -- Loop through all profiles that have a user_id
  FOR profile_record IN
    SELECT id, user_id
    FROM profiles
    WHERE user_id IS NOT NULL
  LOOP
    -- Calculate the completion percentage using the new function
    new_completion := calculate_questionnaire_completion(profile_record.user_id);

    -- Update the profile with the new completion percentage
    UPDATE profiles
    SET completion_percentage = new_completion,
        updated_at = NOW()
    WHERE id = profile_record.id;

    RAISE NOTICE 'Updated profile % with completion: %', profile_record.id, new_completion;
  END LOOP;
END $$;