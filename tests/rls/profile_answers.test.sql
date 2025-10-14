-- =====================================================
-- RLS Test Suite: profile_answers table
-- =====================================================
-- This test suite verifies that the RLS policy on profile_answers
-- correctly allows users to read matched profiles' answers while
-- preventing access to unmatched profiles' answers.
--
-- Related documentation: docs/RLS_PROFILE_ANSWERS_ARCHITECTURE.md
-- =====================================================

BEGIN;

-- Create test schema
CREATE SCHEMA IF NOT EXISTS test_rls;

-- Test Setup: Create test users, profiles, and matches
-- =====================================================

-- Test User IDs
DO $$
DECLARE
    test_user_1_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    test_user_2_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    test_user_3_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    test_profile_1_id uuid := '11111111-1111-1111-1111-111111111111';
    test_profile_2_id uuid := '22222222-2222-2222-2222-222222222222';
    test_profile_3_id uuid := '33333333-3333-3333-3333-333333333333';
    test_match_id uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
BEGIN
    -- Clean up any existing test data
    DELETE FROM profile_answers WHERE user_id IN (test_user_1_id, test_user_2_id, test_user_3_id);
    DELETE FROM matches WHERE id = test_match_id;
    DELETE FROM profiles WHERE id IN (test_profile_1_id, test_profile_2_id, test_profile_3_id);

    -- Create test profiles
    INSERT INTO profiles (id, user_id, first_name, last_name, date_of_birth, city, height_cm, deleted_at)
    VALUES
        (test_profile_1_id, test_user_1_id, 'TestUser1', 'Last1', '1990-01-01', 'Paris', 175, NULL),
        (test_profile_2_id, test_user_2_id, 'TestUser2', 'Last2', '1991-02-02', 'London', 180, NULL),
        (test_profile_3_id, test_user_3_id, 'TestUser3', 'Last3', '1992-03-03', 'Berlin', 185, NULL);

    -- Create a match between User1 and User2
    INSERT INTO matches (id, profile_1_id, profile_2_id, match_status, created_at, updated_at)
    VALUES (test_match_id, test_profile_1_id, test_profile_2_id, 'pending', NOW(), NOW());

    -- Create profile answers for all users
    INSERT INTO profile_answers (user_id, question_id, answer, created_at)
    VALUES
        -- User1's answers
        (test_user_1_id, 'interests', '["Reading", "Hiking"]', NOW()),
        (test_user_1_id, 'profession', '"Engineer"', NOW()),
        (test_user_1_id, 'education_level', '"Masters"', NOW()),
        -- User2's answers
        (test_user_2_id, 'interests', '["Music", "Travel"]', NOW()),
        (test_user_2_id, 'profession', '"Doctor"', NOW()),
        (test_user_2_id, 'education_level', '"PhD"', NOW()),
        -- User3's answers (not matched with anyone)
        (test_user_3_id, 'interests', '["Sports", "Cooking"]', NOW()),
        (test_user_3_id, 'profession', '"Teacher"', NOW()),
        (test_user_3_id, 'education_level', '"Bachelors"', NOW());
END $$;

-- =====================================================
-- Test 1: are_users_matched() function tests
-- =====================================================

-- Test 1.1: Function returns TRUE for matched users
SELECT
    'Test 1.1: are_users_matched returns TRUE for matched users' as test_name,
    CASE
        WHEN public.are_users_matched(
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
        ) = TRUE
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- Test 1.2: Function returns TRUE for bidirectional match (reversed order)
SELECT
    'Test 1.2: are_users_matched returns TRUE for reversed user order' as test_name,
    CASE
        WHEN public.are_users_matched(
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
        ) = TRUE
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- Test 1.3: Function returns FALSE for unmatched users
SELECT
    'Test 1.3: are_users_matched returns FALSE for unmatched users' as test_name,
    CASE
        WHEN public.are_users_matched(
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
            'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
        ) = FALSE
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- Test 1.4: Function returns FALSE for non-existent users
SELECT
    'Test 1.4: are_users_matched returns FALSE for non-existent users' as test_name,
    CASE
        WHEN public.are_users_matched(
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
            '99999999-9999-9999-9999-999999999999'::uuid
        ) = FALSE
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as result;

-- =====================================================
-- Test 2: RLS Policy Tests (as User1)
-- =====================================================

-- Simulate authenticated user (User1)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

-- Test 2.1: User1 can read their own answers
SELECT
    'Test 2.1: User can read their own profile_answers' as test_name,
    CASE
        WHEN COUNT(*) = 3
        THEN '✅ PASS (found ' || COUNT(*) || ' answers)'
        ELSE '❌ FAIL (found ' || COUNT(*) || ' answers, expected 3)'
    END as result
FROM profile_answers
WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

-- Test 2.2: User1 can read matched User2's answers
SELECT
    'Test 2.2: User can read matched user profile_answers' as test_name,
    CASE
        WHEN COUNT(*) = 3
        THEN '✅ PASS (found ' || COUNT(*) || ' answers)'
        ELSE '❌ FAIL (found ' || COUNT(*) || ' answers, expected 3)'
    END as result
FROM profile_answers
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

-- Test 2.3: User1 CANNOT read unmatched User3's answers
SELECT
    'Test 2.3: User CANNOT read unmatched user profile_answers' as test_name,
    CASE
        WHEN COUNT(*) = 0
        THEN '✅ PASS (correctly blocked access)'
        ELSE '❌ FAIL (found ' || COUNT(*) || ' answers, expected 0 - RLS policy failed!)'
    END as result
FROM profile_answers
WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid;

-- Test 2.4: User1 can fetch specific question answers for matched user
SELECT
    'Test 2.4: User can query specific questions for matched user' as test_name,
    CASE
        WHEN COUNT(*) = 1 AND answer = '"Doctor"'
        THEN '✅ PASS (correctly retrieved profession)'
        ELSE '❌ FAIL (expected profession = "Doctor")'
    END as result
FROM profile_answers
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
  AND question_id = 'profession';

RESET role;

-- =====================================================
-- Test 3: RLS Policy Tests (as User2)
-- =====================================================

-- Simulate authenticated user (User2)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}';

-- Test 3.1: User2 can read User1's answers (bidirectional match)
SELECT
    'Test 3.1: Matched user can read answers (bidirectional)' as test_name,
    CASE
        WHEN COUNT(*) = 3
        THEN '✅ PASS (found ' || COUNT(*) || ' answers)'
        ELSE '❌ FAIL (found ' || COUNT(*) || ' answers, expected 3)'
    END as result
FROM profile_answers
WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

-- Test 3.2: User2 CANNOT read User3's answers
SELECT
    'Test 3.2: User2 cannot read unmatched User3 answers' as test_name,
    CASE
        WHEN COUNT(*) = 0
        THEN '✅ PASS (correctly blocked access)'
        ELSE '❌ FAIL (found ' || COUNT(*) || ' answers, expected 0)'
    END as result
FROM profile_answers
WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid;

RESET role;

-- =====================================================
-- Test 4: Deleted Profile Tests
-- =====================================================

-- Mark User2's profile as deleted
UPDATE profiles SET deleted_at = NOW() WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

-- Test 4.1: are_users_matched returns FALSE for deleted profile
SELECT
    'Test 4.1: are_users_matched returns FALSE for deleted profile' as test_name,
    CASE
        WHEN public.are_users_matched(
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
        ) = FALSE
        THEN '✅ PASS'
        ELSE '❌ FAIL (should return FALSE for deleted profile)'
    END as result;

-- Test 4.2: User1 CANNOT read deleted User2's answers
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT
    'Test 4.2: User cannot read deleted matched user answers' as test_name,
    CASE
        WHEN COUNT(*) = 0
        THEN '✅ PASS (correctly blocked access to deleted profile)'
        ELSE '❌ FAIL (found ' || COUNT(*) || ' answers, expected 0)'
    END as result
FROM profile_answers
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

RESET role;

-- Restore User2's profile
UPDATE profiles SET deleted_at = NULL WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

-- =====================================================
-- Test 5: Different Match Status Tests
-- =====================================================

-- Test 5.1: pending status allows access (already tested above)

-- Test 5.2: profile_1_accepted status allows access
UPDATE matches SET match_status = 'profile_1_accepted' WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid;

SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT
    'Test 5.2: Access works with profile_1_accepted status' as test_name,
    CASE
        WHEN COUNT(*) = 3
        THEN '✅ PASS'
        ELSE '❌ FAIL (found ' || COUNT(*) || ' answers, expected 3)'
    END as result
FROM profile_answers
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

RESET role;

-- Test 5.3: both_accepted status allows access
UPDATE matches SET match_status = 'both_accepted' WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid;

SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT
    'Test 5.3: Access works with both_accepted status' as test_name,
    CASE
        WHEN COUNT(*) = 3
        THEN '✅ PASS'
        ELSE '❌ FAIL (found ' || COUNT(*) || ' answers, expected 3)'
    END as result
FROM profile_answers
WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

RESET role;

-- =====================================================
-- Test Cleanup
-- =====================================================

-- Clean up test data
DELETE FROM profile_answers WHERE user_id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid
);
DELETE FROM matches WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid;
DELETE FROM profiles WHERE id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid
);

-- =====================================================
-- Test Summary
-- =====================================================

SELECT '========================================' as summary;
SELECT 'RLS Test Suite Complete!' as summary;
SELECT '========================================' as summary;
SELECT 'All tests should show ✅ PASS' as summary;
SELECT 'If any tests show ❌ FAIL, the RLS policy needs attention' as summary;
SELECT '========================================' as summary;

COMMIT;
