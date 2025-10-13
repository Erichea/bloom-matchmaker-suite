-- Push Notification System Tests
-- Run with: psql <connection_string> -f supabase/tests/push_notification_tests.sql
-- Or via Supabase SQL Editor

BEGIN;

-- Create a test schema
CREATE SCHEMA IF NOT EXISTS tests;

-- Test 1: Verify pg_net extension is installed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION 'FAIL: pg_net extension not installed';
  END IF;
  RAISE NOTICE 'PASS: pg_net extension is installed';
END $$;

-- Test 2: Verify pg_net has correct signature with separate headers parameter
DO $$
DECLARE
  v_signature text;
BEGIN
  SELECT pg_get_function_arguments(oid) INTO v_signature
  FROM pg_proc
  WHERE proname = 'http_post'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'net');

  IF v_signature NOT LIKE '%headers jsonb%' THEN
    RAISE EXCEPTION 'FAIL: pg_net http_post does not have headers parameter. Signature: %', v_signature;
  END IF;

  IF v_signature NOT LIKE '%url text, body jsonb%params jsonb%headers jsonb%' THEN
    RAISE EXCEPTION 'FAIL: pg_net http_post has wrong parameter order. Expected: url, body, params, headers. Got: %', v_signature;
  END IF;

  RAISE NOTICE 'PASS: pg_net http_post has correct signature';
END $$;

-- Test 3: Verify send_push_notification function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'send_push_notification'
  ) THEN
    RAISE EXCEPTION 'FAIL: send_push_notification function does not exist';
  END IF;
  RAISE NOTICE 'PASS: send_push_notification function exists';
END $$;

-- Test 4: Verify send_push_notification uses separate headers parameter (not nested in params)
DO $$
DECLARE
  v_function_body text;
BEGIN
  SELECT prosrc INTO v_function_body
  FROM pg_proc
  WHERE proname = 'send_push_notification';

  -- Check it uses separate headers parameter
  IF v_function_body NOT LIKE '%headers := v_headers%' THEN
    RAISE EXCEPTION 'FAIL: send_push_notification does not use separate headers parameter';
  END IF;

  -- Check it's NOT nesting headers in params (old broken way)
  IF v_function_body LIKE '%params := format(%headers%Authorization%' THEN
    RAISE EXCEPTION 'FAIL: send_push_notification is using OLD nested headers approach (will cause 401 errors)';
  END IF;

  -- Check it has the correct variable declaration
  IF v_function_body NOT LIKE '%v_headers jsonb%' THEN
    RAISE EXCEPTION 'FAIL: send_push_notification missing v_headers variable declaration';
  END IF;

  RAISE NOTICE 'PASS: send_push_notification uses correct headers parameter';
END $$;

-- Test 5: Verify service role key is configured
DO $$
DECLARE
  v_key_length int;
BEGIN
  SELECT LENGTH(value) INTO v_key_length
  FROM private.config
  WHERE key = 'service_role_key';

  IF v_key_length IS NULL THEN
    RAISE EXCEPTION 'FAIL: Service role key not configured in private.config';
  END IF;

  IF v_key_length < 100 THEN
    RAISE EXCEPTION 'FAIL: Service role key too short (% chars). Should be ~200+ chars JWT token', v_key_length;
  END IF;

  RAISE NOTICE 'PASS: Service role key is configured (% chars)', v_key_length;
END $$;

-- Test 6: Verify notify_new_match trigger function exists and calls send_push_notification
DO $$
DECLARE
  v_function_body text;
BEGIN
  SELECT prosrc INTO v_function_body
  FROM pg_proc
  WHERE proname = 'notify_new_match';

  IF v_function_body IS NULL THEN
    RAISE EXCEPTION 'FAIL: notify_new_match function does not exist';
  END IF;

  IF v_function_body NOT LIKE '%PERFORM send_push_notification%' THEN
    RAISE EXCEPTION 'FAIL: notify_new_match does not call send_push_notification';
  END IF;

  IF v_function_body NOT LIKE '%PERFORM send_push_notification%new_match%' THEN
    RAISE EXCEPTION 'FAIL: notify_new_match does not call send_push_notification with new_match template';
  END IF;

  RAISE NOTICE 'PASS: notify_new_match calls send_push_notification';
END $$;

-- Test 7: Verify trigger exists on matches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_notify_new_match'
      AND event_object_table = 'matches'
  ) THEN
    RAISE EXCEPTION 'FAIL: trigger_notify_new_match does not exist on matches table';
  END IF;

  RAISE NOTICE 'PASS: trigger_notify_new_match exists on matches table';
END $$;

-- Test 8: Verify net._http_response table is accessible (for debugging)
DO $$
BEGIN
  PERFORM 1 FROM net._http_response LIMIT 1;
  RAISE NOTICE 'PASS: net._http_response table is accessible';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Cannot access net._http_response table: %', SQLERRM;
END $$;

-- Test 9: Mock test - Verify function can be called without errors (doesn't actually send)
DO $$
DECLARE
  v_test_user_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- This will attempt to call the function but fail gracefully if service key is not set
  -- We're just checking the function doesn't have syntax errors
  BEGIN
    PERFORM send_push_notification(
      v_test_user_id,
      'new_match',
      jsonb_build_object(
        'userId', v_test_user_id::text,
        'matchName', 'Test User',
        'icon', 'https://example.com/icon.png',
        'url', 'https://example.com'
      )
    );
    RAISE NOTICE 'PASS: send_push_notification can be called without syntax errors';
  EXCEPTION
    WHEN OTHERS THEN
      -- If it fails, check if it's just because of missing service key (acceptable)
      IF SQLERRM LIKE '%Service role key not configured%' OR SQLERRM LIKE '%not found%' THEN
        RAISE NOTICE 'PASS: send_push_notification syntax OK (service key not set in test, which is fine)';
      ELSE
        RAISE EXCEPTION 'FAIL: send_push_notification failed with unexpected error: %', SQLERRM;
      END IF;
  END;
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All push notification tests PASSED! ✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify end-to-end:';
  RAISE NOTICE '1. Create a match in admin panel';
  RAISE NOTICE '2. Run: SELECT status_code FROM net._http_response ORDER BY created DESC LIMIT 1;';
  RAISE NOTICE '3. Verify status_code = 200';
END $$;

ROLLBACK; -- Don't commit test schema
