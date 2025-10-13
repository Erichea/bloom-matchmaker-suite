# Testing Guide

## Quick Commands

```bash
# Run database tests locally
npm run test:db

# Run database tests on remote (requires DATABASE_URL env var)
npm run test:db:remote

# Run frontend tests
npm test
```

## Database Tests

### Push Notification Tests

**Location:** `supabase/tests/push_notification_tests.sql`

**Purpose:** Prevent regression of the 401 "Missing authorization header" bug

**What it tests:**
- pg_net extension installed
- pg_net has correct signature (headers as 4th parameter)
- send_push_notification uses separate headers parameter
- Service role key configured
- Triggers properly set up
- Functions can be called without errors

**When to run:**
- After any database migration
- Before deploying changes to production
- When modifying notification system
- Automatically on push/PR via GitHub Actions

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

## CI/CD

Tests run automatically on GitHub Actions when:
- You push to main
- You open a PR to main
- Database files change (`supabase/migrations/**` or `supabase/tests/**`)

**Workflow file:** `.github/workflows/database-tests.yml`

## Manual Testing

### Via Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/tests/push_notification_tests.sql`
3. Run the query
4. Look for "All tests PASSED!" message

### Via CLI

```bash
# Start local Supabase
npx supabase start

# Run migrations
npx supabase db reset --local

# Run tests
npm run test:db
```

## Adding New Tests

When adding critical features:

1. Create test file: `supabase/tests/your_feature_tests.sql`
2. Follow the pattern from existing tests:
   - Use `BEGIN` and `ROLLBACK` to avoid side effects
   - Use `RAISE NOTICE 'PASS: ...'` for success
   - Use `RAISE EXCEPTION 'FAIL: ...'` for failures
3. Add to CI workflow if needed
4. Document in `supabase/tests/README.md`

## Troubleshooting Tests

### Tests fail locally but pass in CI
- Check your local database is up to date: `npx supabase db reset --local`
- Verify you're using the same Postgres version

### "psql: command not found"
- Install PostgreSQL client tools
- Or use Supabase SQL Editor instead

### "Service role key not configured"
- This is expected in test environment
- Test will pass with a notice

### Test passes but push notifications still don't work
- Run end-to-end verification (see docs/push-notification-fix-guide.md)
- Check `net._http_response` table for actual HTTP status codes
- Verify NotificationAPI credentials in edge functions

## Related Documentation

- [Push Notification Fix Guide](./push-notification-fix-guide.md) - Detailed troubleshooting
- [Test README](../../supabase/tests/README.md) - How to run tests
- [CI Workflow](../../.github/workflows/database-tests.yml) - Automated testing setup
