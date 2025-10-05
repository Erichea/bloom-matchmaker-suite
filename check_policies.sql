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
  AND schemaname = 'public'
ORDER BY policyname;
