# Push Notification System - Troubleshooting Guide

## Last Updated: October 13, 2025

## Overview

This document explains how the push notification system works and how to fix common issues. The system uses Supabase database triggers + pg_net to call edge functions that communicate with NotificationAPI.

## Architecture

```
Database Trigger (new match created)
    ↓
notify_new_match() function
    ↓
send_push_notification() function
    ↓
pg_net.http_post() - calls Supabase Edge Function
    ↓
Edge Function (notificationapi-new_match)
    ↓
NotificationAPI
    ↓
User's Browser (Push Notification)
```

## Critical Fix: pg_net Headers Parameter

### The Problem

We were getting 401 "Missing authorization header" errors even though:
- ✅ Service role key was configured
- ✅ Trigger was calling send_push_notification
- ✅ pg_net was making HTTP requests
- ✅ Test notifications worked

### Root Cause

**The pg_net.http_post function signature requires headers as a SEPARATE parameter**, not nested inside params!

Correct signature:
```sql
net.http_post(url, body, params, headers, timeout_milliseconds)
```

### The Solution

**WRONG (produces 401 errors):**
```sql
SELECT net.http_post(
  url := v_url,
  body := v_body,
  params := jsonb_build_object(
    'headers', jsonb_build_object(
      'Authorization', 'Bearer ' || v_service_role_key
    )
  )
) INTO v_request_id;
```

**CORRECT (works!):**
```sql
SELECT net.http_post(
  url := v_url,
  body := v_body,
  params := '{}'::jsonb,  -- Empty params
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_role_key
  )  -- Headers as SEPARATE 4th parameter!
) INTO v_request_id;
```

## Complete Working Function

Located in: `supabase/migrations/20251013000000_fix_push_notifications_in_triggers.sql`

```sql
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id uuid,
  p_template_id text,
  p_merge_tags jsonb
)
RETURNS void AS $$
DECLARE
  v_supabase_url text := 'https://loeaypczgpbgruzwkgjh.supabase.co';
  v_service_role_key text;
  v_request_id bigint;
  v_url text;
  v_body jsonb;
  v_headers jsonb;
BEGIN
  -- Get service role key from private config
  SELECT value INTO v_service_role_key
  FROM private.config
  WHERE key = 'service_role_key';

  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE WARNING 'Service role key not configured';
    RETURN;
  END IF;

  -- Build URL
  v_url := v_supabase_url || CASE
    WHEN p_template_id = 'new_match' THEN '/functions/v1/notificationapi-new_match'
    WHEN p_template_id = 'mutual_match' THEN '/functions/v1/notificationapi-mutual_match'
    WHEN p_template_id = 'profile_approval' THEN '/functions/v1/notificationapi-profile_approval'
    WHEN p_template_id = 'profile_update' THEN '/functions/v1/notificationapi-profile_update'
    ELSE '/functions/v1/notify'
  END;

  -- Build body
  v_body := p_merge_tags;

  -- Build headers SEPARATELY
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_role_key
  );

  -- Call edge function with CORRECT signature
  BEGIN
    SELECT net.http_post(
      url := v_url,
      body := v_body,
      params := '{}'::jsonb,
      headers := v_headers  -- CRITICAL: Separate parameter!
    ) INTO v_request_id;

    RAISE LOG 'Push notification queued (request_id: %)', v_request_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to queue push notification: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## How to Verify It's Working

### Step 1: Check pg_net Signature (Diagnostic)
```sql
-- Verify the correct signature
SELECT pg_get_function_arguments(oid) as signature
FROM pg_proc
WHERE proname = 'http_post'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'net');
```

Expected output:
```
url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer
```

### Step 2: Check Recent Requests
```sql
-- Check if requests are succeeding
SELECT
  id,
  created,
  status_code,
  content,
  error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
```

**Success = status_code: 200**
**Failure = status_code: 401 with "Missing authorization header"**

### Step 3: End-to-End Test
```sql
-- Verify the function includes the correct call
SELECT prosrc
FROM pg_proc
WHERE proname = 'send_push_notification';
```

Look for this line:
```sql
headers := v_headers     -- Headers as separate parameter!
```

### Step 4: Test Flow
1. Create a new match in admin panel
2. Run the query from Step 2
3. Verify status_code = 200
4. User should receive push notification

## Common Issues

### Issue: 401 "Missing authorization header"
**Cause:** Headers nested in params instead of separate parameter
**Fix:** Apply the correct pg_net signature (see above)

### Issue: No requests in net._http_response table
**Cause:** Trigger not calling send_push_notification
**Fix:** Verify notify_new_match includes `PERFORM send_push_notification(...)`

### Issue: Service key not configured
**Cause:** private.config table missing service_role_key
**Fix:**
```sql
SELECT private.set_service_key('YOUR_SERVICE_ROLE_KEY_HERE');
```

### Issue: Test notifications work but real notifications don't
**Cause:** Test uses `/functions/v1/notify` with direct call, real notifications use database triggers
**Fix:** Verify database triggers are properly calling send_push_notification

## Configuration Checklist

- [ ] pg_net extension installed
- [ ] Service role key configured in private.config
- [ ] Edge functions deployed (notificationapi-new_match, etc.)
- [ ] send_push_notification function uses separate headers parameter
- [ ] notify_new_match trigger calls send_push_notification
- [ ] NotificationAPI credentials configured in edge functions
- [ ] Frontend has NotificationAPIProvider set up

## Files to Check

1. **Database Function:** `supabase/migrations/20251013000000_fix_push_notifications_in_triggers.sql`
2. **Edge Function:** `supabase/functions/notificationapi-new_match/index.ts`
3. **Frontend Provider:** `src/components/NotificationProvider.tsx`
4. **Service Worker:** `public/notificationapi-service-worker.js`

## Quick Debug Commands

```sql
-- 1. Check if service key is set
SELECT LENGTH(value) as key_length
FROM private.config
WHERE key = 'service_role_key';

-- 2. Check recent pg_net requests
SELECT status_code, LEFT(content::text, 100)
FROM net._http_response
ORDER BY created DESC LIMIT 1;

-- 3. Verify function has correct signature
SELECT prosrc LIKE '%headers := v_headers%' as has_correct_signature
FROM pg_proc
WHERE proname = 'send_push_notification';
```

## Key Takeaways

1. **pg_net requires headers as 4th parameter**, not nested in params
2. Always check `net._http_response` table for actual HTTP results
3. Status code 200 = success, 401 = auth problem
4. Test notifications bypass database triggers, so they can work even when real notifications fail
5. Use `SELECT pg_get_function_arguments(oid)` to verify function signatures

## Last Fix Applied: October 13, 2025

The final working fix changed the pg_net call from nesting headers in params to passing headers as a separate parameter. This resolved all 401 errors and push notifications now work reliably.
