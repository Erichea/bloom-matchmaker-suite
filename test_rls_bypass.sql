-- Temporarily disable RLS to see if data is accessible
-- WARNING: This is just for testing! Re-enable RLS after!

-- First, check current RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profile_answers';

-- Temporarily disable RLS (for testing only)
ALTER TABLE profile_answers DISABLE ROW LEVEL SECURITY;

-- Now try the query that should return Test27's answers
SELECT COUNT(*) as count_without_rls
FROM profile_answers
WHERE user_id = 'e719529b-18a3-4e8a-83f8-9d8b186f3ed2';

-- Re-enable RLS immediately
ALTER TABLE profile_answers ENABLE ROW LEVEL SECURITY;

-- Verify RLS is back on
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profile_answers';
