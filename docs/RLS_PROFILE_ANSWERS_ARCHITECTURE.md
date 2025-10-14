# Profile Answers RLS Architecture

## Overview

This document explains how Row Level Security (RLS) is implemented for the `profile_answers` table to allow users to view questionnaire answers of their matched profiles while maintaining data privacy.

## Problem Statement

Users need to view profile questionnaire answers (interests, education, profession, relationship values, etc.) for profiles they are matched with, but NOT for arbitrary profiles in the system. This requires careful RLS policy design to:

1. Allow users to read their own answers
2. Allow users to read answers of profiles they have active matches with
3. Prevent users from reading answers of profiles they're not matched with

## Architecture

### Database Schema

**Relevant Tables:**
- `profile_answers`: Stores questionnaire responses (user_id, question_id, answer)
- `profiles`: User profile information (id, user_id, deleted_at)
- `matches`: Match relationships between profiles (profile_1_id, profile_2_id, match_status)

**Match Status Values:**
- `pending`: Initial match, awaiting first response
- `profile_1_accepted`: Profile 1 accepted
- `profile_2_accepted`: Profile 2 accepted
- `both_accepted`: Mutual match (both accepted)

### Solution: SECURITY DEFINER Function

**Why not a direct RLS policy?**

Initial attempts used complex RLS policies with multiple JOINs:

```sql
-- ❌ This approach FAILED
CREATE POLICY "Users can read matched profile answers"
    ON profile_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM matches m
            JOIN profiles p_requester ON (p_requester.user_id = auth.uid())
            JOIN profiles p_target ON (p_target.user_id = profile_answers.user_id)
            WHERE ...
        )
    );
```

**Problems with direct JOIN approach:**
- Complex JOINs in RLS policies don't evaluate correctly in authenticated user context
- Works in SQL editor (service role) but fails in client requests (authenticated role)
- CROSS JOINs create cartesian products causing performance issues
- RLS silently returns empty arrays instead of errors, making debugging difficult

**The Working Solution:**

Use a `SECURITY DEFINER` function to encapsulate the match relationship check:

```sql
-- ✅ This approach WORKS
CREATE FUNCTION public.are_users_matched(user_id_1 uuid, user_id_2 uuid)
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

CREATE POLICY "Users can read matched profile answers"
    ON profile_answers FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        public.are_users_matched(auth.uid(), profile_answers.user_id)
    );
```

**Why this works:**
- `SECURITY DEFINER` executes with the function owner's privileges (elevated)
- Simplifies the RLS policy to a simple function call
- Function logic is easier to test and debug independently
- Bypasses the complexity issues with inline JOINs in RLS context

### Key Implementation Details

1. **Deleted Profiles Check**: The function checks `deleted_at IS NULL` for both profiles to ensure matches with deleted profiles don't grant access

2. **Bidirectional Match Check**: Handles both cases where the user is profile_1 or profile_2:
   ```sql
   (m.profile_1_id = p1.id AND m.profile_2_id = p2.id)
   OR
   (m.profile_2_id = p1.id AND m.profile_1_id = p2.id)
   ```

3. **Match Status Filter**: Only active match statuses grant access (pending, profile_1_accepted, profile_2_accepted, both_accepted)

4. **Self-Access**: Users can always read their own answers: `auth.uid() = user_id`

## Usage in Client Code

**File**: `src/components/MatchDetailModal.tsx`

```typescript
// Fetch profile answers for a matched profile
const { data: answersData, error: answersError } = await supabase
  .from("profile_answers")
  .select("*")
  .eq("user_id", otherProfile.user_id);
```

**How it works:**
1. Supabase client is authenticated with user's JWT token
2. JWT contains `auth.uid()` which RLS uses to identify the user
3. RLS policy evaluates: Does `auth.uid()` match with `otherProfile.user_id`?
4. `are_users_matched()` function checks the database for active match
5. If matched, query returns data; otherwise returns empty array (no error)

## Migration Files

**Location**: `supabase/migrations/`

Key migrations:
- `20251014192000_fix_profile_answers_rls_with_deleted_check.sql` - Added deleted_at checks (didn't work)
- `20251014193000_fix_profile_answers_rls_alternative.sql` - Tried IN subquery approach (didn't work)
- `20251014194000_use_function_for_matched_answers.sql` - **Final working solution**

## Debugging Tips for AI Assistants

When debugging RLS issues:

1. **Check if data exists**: Query the table directly bypassing RLS (as superuser)
2. **Verify relationships**: Check if matches/profiles exist with correct IDs
3. **Test policy logic**: Run the policy conditions as standalone queries
4. **Check auth context**: Log `auth.uid()` in client to verify user identity
5. **RLS is silent**: Empty results don't mean errors - check if policy is evaluating to FALSE

**Common Pitfalls:**
- ❌ Assuming RLS will throw errors (it returns empty results instead)
- ❌ Testing in SQL editor as service role (bypasses RLS)
- ❌ Using complex JOINs directly in RLS USING clause
- ❌ Forgetting to check `deleted_at` fields
- ❌ Not handling bidirectional relationships (profile_1 vs profile_2)

## Testing

See `tests/rls/profile_answers.test.sql` for automated RLS policy tests.

## Related Files

- **Migration**: `supabase/migrations/20251014194000_use_function_for_matched_answers.sql`
- **Function**: `public.are_users_matched(uuid, uuid)`
- **Client Code**: `src/components/MatchDetailModal.tsx:60-82`
- **Test File**: `tests/rls/profile_answers.test.sql`

## Performance Considerations

The `are_users_matched()` function is called for every row in the result set. For large datasets:

1. Ensure indexes exist on:
   - `matches(profile_1_id, profile_2_id, match_status)`
   - `profiles(user_id, deleted_at)`
   - `profile_answers(user_id)`

2. Consider caching match relationships at the application level if performance becomes an issue

3. The function uses EXISTS which short-circuits on first match (efficient)

## Security Notes

- Function is `SECURITY DEFINER` - it runs with elevated privileges
- Function only returns boolean, not sensitive data
- Function checks deleted_at to prevent access to deleted profiles
- RLS policy is permissive (OR logic) - any passing condition grants access
- No restrictive policies exist that could override this policy
