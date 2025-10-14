-- Drop the previous policy if it exists
DROP POLICY IF EXISTS "Users can read matched profile answers" ON profile_answers;

-- Create a more robust policy that includes deleted_at checks
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
                -- Check for deleted profiles
                p_requester.deleted_at IS NULL
                AND p_target.deleted_at IS NULL
                -- Check match relationship
                AND (
                    (m.profile_1_id = p_requester.id AND m.profile_2_id = p_target.id)
                    OR
                    (m.profile_2_id = p_requester.id AND m.profile_1_id = p_target.id)
                )
                -- Check match status
                AND m.match_status IN ('pending', 'profile_1_accepted', 'profile_2_accepted', 'both_accepted')
        )
    );
