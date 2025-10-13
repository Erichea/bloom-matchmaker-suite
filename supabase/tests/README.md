# Supabase Database Tests

## Overview

This directory contains automated tests for critical database functionality to prevent regressions.

## Running Tests

### Via Supabase SQL Editor

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of the test file
3. Run the query
4. Check for "All tests PASSED!" message

### Via Command Line (Local)

```bash
npx supabase test db --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### Via psql

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/push_notification_tests.sql
```

## Test Files

### push_notification_tests.sql

Tests the push notification system to prevent the 401 authorization header regression.

**What it tests:**
- ✅ pg_net extension is installed
- ✅ pg_net has correct signature (headers as 4th parameter)
- ✅ send_push_notification function exists
- ✅ send_push_notification uses separate headers parameter (not nested)
- ✅ Service role key is configured
- ✅ notify_new_match calls send_push_notification
- ✅ Trigger exists on matches table
- ✅ net._http_response table is accessible
- ✅ Function can be called without syntax errors

**Expected output:**
```
NOTICE:  PASS: pg_net extension is installed
NOTICE:  PASS: pg_net http_post has correct signature
NOTICE:  PASS: send_push_notification function exists
NOTICE:  PASS: send_push_notification uses correct headers parameter
NOTICE:  PASS: Service role key is configured (219 chars)
NOTICE:  PASS: notify_new_match calls send_push_notification
NOTICE:  PASS: trigger_notify_new_match exists on matches table
NOTICE:  PASS: net._http_response table is accessible
NOTICE:  PASS: send_push_notification can be called without syntax errors
NOTICE:
NOTICE:  ========================================
NOTICE:  All push notification tests PASSED! ✓
NOTICE:  ========================================
```

## CI/CD Integration

To run these tests automatically in CI/CD, add to your workflow:

```yaml
# .github/workflows/test.yml
name: Database Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-database:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        run: |
          npm install -g supabase

      - name: Start Supabase
        run: npx supabase start

      - name: Run Database Tests
        run: |
          psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
            -f supabase/tests/push_notification_tests.sql
```

## Adding New Tests

When adding new critical features:

1. Create a new test file: `supabase/tests/feature_name_tests.sql`
2. Follow the pattern from existing tests
3. Use `BEGIN` and `ROLLBACK` to avoid affecting the database
4. Use `RAISE NOTICE 'PASS: ...'` for successful tests
5. Use `RAISE EXCEPTION 'FAIL: ...'` for failures
6. Update this README with the new test file

## Troubleshooting

### Test fails: "pg_net extension not installed"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Test fails: "Service role key not configured"

**Solution:**
```sql
SELECT private.set_service_key('YOUR_SERVICE_ROLE_KEY_HERE');
```

### Test fails: "send_push_notification uses OLD nested headers approach"

**Solution:**
Apply the fix from `.claude/docs/push-notification-fix-guide.md` or run:
```sql
-- Apply the migration
\i supabase/migrations/20251013000000_fix_push_notifications_in_triggers.sql
```

## Manual Verification

After tests pass, verify end-to-end:

```sql
-- Create a test match (or use admin panel)
-- Then check the HTTP response:
SELECT
  id,
  created,
  status_code,
  content
FROM net._http_response
ORDER BY created DESC
LIMIT 1;
```

Expected: `status_code = 200` and `content = {"success":true}`
