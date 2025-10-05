-- Restore missing INSERT and UPDATE policies for profile_answers table
-- These policies were accidentally not recreated in earlier migrations

-- Drop existing INSERT/UPDATE policies if they exist
DROP POLICY IF EXISTS "Users can insert their own answers" ON profile_answers;
DROP POLICY IF EXISTS "Users can update their own answers" ON profile_answers;

-- Allow users to insert their own answers
CREATE POLICY "Users can insert their own answers"
    ON profile_answers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own answers
CREATE POLICY "Users can update their own answers"
    ON profile_answers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
