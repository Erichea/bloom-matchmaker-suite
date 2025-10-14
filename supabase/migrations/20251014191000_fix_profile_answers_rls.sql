-- Drop the previous policy if it exists
DROP POLICY IF EXISTS "Users can read answers of matched profiles" ON profile_answers;

-- Create a simpler, more direct policy for reading matched profile answers
-- This allows users to read profile_answers of people they have matches with
CREATE POLICY "Users can read matched profile answers"
    ON profile_answers
    FOR SELECT
    USING (
        -- User can read their own answers
        auth.uid() = user_id
        OR
        -- User can read answers of profiles they are matched with
        EXISTS (
            SELECT 1
            FROM matches m
            JOIN profiles p_requester ON (p_requester.user_id = auth.uid())
            JOIN profiles p_target ON (p_target.user_id = profile_answers.user_id)
            WHERE
                (
                    (m.profile_1_id = p_requester.id AND m.profile_2_id = p_target.id)
                    OR
                    (m.profile_2_id = p_requester.id AND m.profile_1_id = p_target.id)
                )
                AND m.match_status IN ('pending', 'profile_1_accepted', 'profile_2_accepted', 'both_accepted')
        )
    );
