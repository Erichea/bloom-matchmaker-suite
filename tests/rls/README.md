# RLS Test Suite

This directory contains automated tests for Row Level Security (RLS) policies in the database.

## Overview

RLS policies control which rows users can access in database tables. These tests ensure that:
- Users can only access data they're authorized to see
- Security boundaries are properly enforced
- Policy changes don't accidentally break access control

## Running Tests

### Method 1: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire test file
4. Click "Run"
5. Review the results - all tests should show ✅ PASS

### Method 2: Command Line (if psql is configured)

```bash
# From the project root
psql "$DATABASE_URL" -f tests/rls/profile_answers.test.sql
```

### Method 3: Via Supabase CLI

```bash
# From the project root
supabase db execute < tests/rls/profile_answers.test.sql
```

## Test Files

### `profile_answers.test.sql`

Tests RLS policies for the `profile_answers` table.

**What it tests:**
- ✅ Users can read their own profile answers
- ✅ Users can read matched profiles' answers
- ❌ Users CANNOT read unmatched profiles' answers
- ✅ Bidirectional match access works (both users can read each other)
- ❌ Users CANNOT read deleted profiles' answers
- ✅ All match statuses (pending, profile_1_accepted, profile_2_accepted, both_accepted) allow access
- ✅ The `are_users_matched()` helper function works correctly

**Related Documentation:**
- `docs/RLS_PROFILE_ANSWERS_ARCHITECTURE.md` - Architecture explanation
- `supabase/migrations/20251014194000_use_function_for_matched_answers.sql` - Migration file

## Understanding Test Results

### Passing Tests
```
✅ PASS (found 3 answers)
```
All tests should show this format. The test validated correctly.

### Failing Tests
```
❌ FAIL (found 3 answers, expected 0 - RLS policy failed!)
```
This indicates a security issue - the RLS policy is allowing access when it shouldn't.

## Test Data

Tests create temporary data:
- 3 test users (User1, User2, User3)
- 3 test profiles
- 1 match between User1 and User2
- Profile answers for all users

**Cleanup:** All test data is automatically deleted at the end of the test suite.

## Adding New Tests

When adding new RLS policies or modifying existing ones:

1. **Create a new test file** following the naming pattern: `<table_name>.test.sql`

2. **Structure your test file:**
```sql
BEGIN;

-- Test Setup
-- Create test data

-- Test Cases
-- Each test should output: test_name, result (✅ PASS or ❌ FAIL)

-- Cleanup
-- Delete test data

COMMIT;
```

3. **Test both positive and negative cases:**
   - ✅ Users CAN access data they should have access to
   - ❌ Users CANNOT access data they shouldn't have access to

4. **Document the tests:**
   - Add comments explaining what each test validates
   - Link to relevant architecture documentation
   - Include cleanup steps

## Continuous Integration

To run these tests automatically in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run RLS Tests
  run: |
    supabase db execute < tests/rls/profile_answers.test.sql
```

## Troubleshooting

### Test shows ❌ FAIL

1. **Check the RLS policy:** Is it correctly defined in the migration?
2. **Verify the policy is applied:** Run `\d+ <table_name>` in psql to see active policies
3. **Check for conflicting policies:** Multiple policies can interact unexpectedly
4. **Test the helper function:** If using SECURITY DEFINER functions, test them independently

### Tests timeout or hang

- RLS policies with complex JOINs can be slow
- Check for missing indexes on foreign keys
- Consider using SECURITY DEFINER functions for complex logic

### "permission denied" errors

- Ensure the test is running with appropriate role
- Check that `SET LOCAL role TO authenticated` is used correctly
- Verify JWT claims are set: `SET LOCAL request.jwt.claims TO '{"sub": "user-id"}'`

## Best Practices

1. **Always test both directions:** If testing User A can access User B's data, also test that User B can access User A's data

2. **Test edge cases:**
   - Deleted/soft-deleted records
   - NULL values
   - Empty results
   - Non-existent IDs

3. **Test all match statuses:** Ensure access works for all relevant status values

4. **Clean up thoroughly:** Tests should leave no trace in the database

5. **Use descriptive test names:** Make it clear what each test validates

## Related Documentation

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Project-specific: `docs/RLS_PROFILE_ANSWERS_ARCHITECTURE.md`
