-- Drop the previous policy
DROP POLICY IF EXISTS "Users can read matched profile answers" ON profile_answers;

-- Create a simpler, more direct policy using a different approach
-- This checks if the target user_id exists in a list of matched user_ids
CREATE POLICY "Users can read matched profile answers"
    ON profile_answers
    FOR SELECT
    USING (
        -- User can read their own answers
        auth.uid() = user_id
        OR
        -- User can read answers of users they are matched with
        profile_answers.user_id IN (
            -- Get all user_ids that the current user is matched with
            SELECT CASE
                WHEN m.profile_1_id = my_profile.id THEN other_profile.user_id
                WHEN m.profile_2_id = my_profile.id THEN other_profile.user_id
            END as matched_user_id
            FROM matches m
            CROSS JOIN profiles my_profile
            CROSS JOIN profiles other_profile
            WHERE
                -- My profile
                my_profile.user_id = auth.uid()
                AND my_profile.deleted_at IS NULL
                -- Other profile
                AND other_profile.deleted_at IS NULL
                -- Match relationship
                AND (
                    (m.profile_1_id = my_profile.id AND m.profile_2_id = other_profile.id)
                    OR
                    (m.profile_2_id = my_profile.id AND m.profile_1_id = other_profile.id)
                )
                -- Match status
                AND m.match_status IN ('pending', 'profile_1_accepted', 'profile_2_accepted', 'both_accepted')
        )
    );
