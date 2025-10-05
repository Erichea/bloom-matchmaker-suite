-- Comprehensive fix for profile_answers RLS policies
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read their own answers" ON profile_answers;
DROP POLICY IF EXISTS "Users can insert their own answers" ON profile_answers;
DROP POLICY IF EXISTS "Users can update their own answers" ON profile_answers;
DROP POLICY IF EXISTS "Users can read matched profiles' answers" ON profile_answers;
DROP POLICY IF EXISTS "Admins can read all answers" ON profile_answers;

-- Ensure RLS is enabled
ALTER TABLE profile_answers ENABLE ROW LEVEL SECURITY;

-- Recreate all policies with correct permissions

-- SELECT policies
CREATE POLICY "Users can read their own answers"
    ON profile_answers
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can read matched profiles' answers"
    ON profile_answers
    FOR SELECT
    USING (
        profile_answers.user_id IN (
            -- Get user_ids of people the current user is matched with
            SELECT p.user_id
            FROM matches m
            JOIN profiles my_profile ON (my_profile.user_id = auth.uid() AND my_profile.deleted_at IS NULL)
            JOIN profiles p ON (
                (m.profile_1_id = my_profile.id AND m.profile_2_id = p.id)
                OR (m.profile_2_id = my_profile.id AND m.profile_1_id = p.id)
            )
            WHERE p.deleted_at IS NULL
        )
    );

CREATE POLICY "Admins can read all answers"
    ON profile_answers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- INSERT policy
CREATE POLICY "Users can insert their own answers"
    ON profile_answers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update their own answers"
    ON profile_answers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE policy (optional, but good to have)
CREATE POLICY "Users can delete their own answers"
    ON profile_answers
    FOR DELETE
    USING (auth.uid() = user_id);
