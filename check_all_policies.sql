-- Check all RLS policies on profile_answers table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profile_answers'
ORDER BY policyname;

-- Also check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profile_answers';
