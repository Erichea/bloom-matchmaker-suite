-- Drop and recreate the policy with correct logic
DROP POLICY IF EXISTS "Users can read matched profiles' answers" ON profile_answers;

-- Allow users to read profile_answers of profiles they are matched with
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
