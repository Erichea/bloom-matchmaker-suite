-- Allow users to read profile_answers of people they are matched with
-- This is necessary for the client dashboard to display match profile details

CREATE POLICY "Users can read answers of matched profiles"
    ON profile_answers
    FOR SELECT
    USING (
        -- Allow if the requesting user is matched with the profile owner
        EXISTS (
            SELECT 1
            FROM matches m
            INNER JOIN profiles p1 ON (m.profile_1_id = p1.id OR m.profile_2_id = p1.id)
            INNER JOIN profiles p2 ON (m.profile_1_id = p2.id OR m.profile_2_id = p2.id)
            WHERE
                p1.user_id = auth.uid()  -- Requesting user's profile
                AND p2.user_id = profile_answers.user_id  -- Target profile
                AND p1.id != p2.id  -- Different profiles
                AND m.match_status IN ('pending', 'profile_1_accepted', 'profile_2_accepted', 'both_accepted')  -- Active matches
        )
    );
