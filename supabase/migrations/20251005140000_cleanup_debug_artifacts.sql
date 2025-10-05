-- Clean up debug function and unused RLS policies

-- Drop diagnostic function
DROP FUNCTION IF EXISTS debug_match_answers(UUID, UUID);

-- Drop the RLS policies that didn't work (now using SECURITY DEFINER function instead)
DROP POLICY IF EXISTS "Users can read matched profiles' answers" ON profile_answers;
DROP POLICY IF EXISTS "Users can read their own answers" ON profile_answers;
