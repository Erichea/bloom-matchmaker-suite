-- Add admin read policy for profile_answers table
-- This allows admins to view all profile answers for review purposes

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
