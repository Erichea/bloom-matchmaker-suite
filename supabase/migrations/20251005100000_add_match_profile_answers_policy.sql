-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own answers" ON profile_answers;
DROP POLICY IF EXISTS "Users can read matched profiles' answers" ON profile_answers;

-- Allow users to read profile_answers of their own profile
CREATE POLICY "Users can read their own answers"
    ON profile_answers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to read profile_answers of profiles they are matched with
CREATE POLICY "Users can read matched profiles' answers"
    ON profile_answers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM matches m
            JOIN profiles p1 ON m.profile_1_id = p1.id
            JOIN profiles p2 ON m.profile_2_id = p2.id
            WHERE
                profile_answers.user_id IN (p1.user_id, p2.user_id)
                AND (
                    p1.user_id = auth.uid() OR p2.user_id = auth.uid()
                )
                AND p1.deleted_at IS NULL
                AND p2.deleted_at IS NULL
        )
    );
