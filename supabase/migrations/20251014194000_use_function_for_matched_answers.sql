-- Instead of complex RLS policies, create a helper function that checks if users are matched
-- This function can be used in a simpler RLS policy

CREATE OR REPLACE FUNCTION public.are_users_matched(user_id_1 uuid, user_id_2 uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM matches m
        JOIN profiles p1 ON (p1.user_id = user_id_1 AND p1.deleted_at IS NULL)
        JOIN profiles p2 ON (p2.user_id = user_id_2 AND p2.deleted_at IS NULL)
        WHERE
            (
                (m.profile_1_id = p1.id AND m.profile_2_id = p2.id)
                OR
                (m.profile_2_id = p1.id AND m.profile_1_id = p2.id)
            )
            AND m.match_status IN ('pending', 'profile_1_accepted', 'profile_2_accepted', 'both_accepted')
    );
END;
$$;

-- Drop the old policy and create a new simpler one using the function
DROP POLICY IF EXISTS "Users can read matched profile answers" ON profile_answers;

CREATE POLICY "Users can read matched profile answers"
    ON profile_answers
    FOR SELECT
    USING (
        -- User can read their own answers
        auth.uid() = user_id
        OR
        -- User can read answers of users they are matched with
        public.are_users_matched(auth.uid(), profile_answers.user_id)
    );
