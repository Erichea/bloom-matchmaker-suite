-- Test notification flow step by step
-- Run this in Supabase SQL Editor to test

-- 1. First check if the function was updated (should contain 'PERFORM send_push_notification')
DO $$
DECLARE
  func_body text;
BEGIN
  SELECT prosrc INTO func_body
  FROM pg_proc
  WHERE proname = 'notify_new_match';

  IF func_body LIKE '%PERFORM send_push_notification%' THEN
    RAISE NOTICE 'GOOD: notify_new_match function contains send_push_notification call';
  ELSE
    RAISE WARNING 'BAD: notify_new_match function does NOT contain send_push_notification call';
    RAISE WARNING 'You need to run fix_push_notifications.sql';
  END IF;
END $$;

-- 2. Check service role key
DO $$
DECLARE
  key_value text;
BEGIN
  SELECT value INTO key_value FROM private.config WHERE key = 'service_role_key';

  IF key_value IS NULL OR key_value = '' THEN
    RAISE WARNING 'BAD: Service role key is NOT configured';
    RAISE WARNING 'Run: SELECT private.set_service_key(''your-service-role-key-here'');';
  ELSE
    RAISE NOTICE 'GOOD: Service role key is configured (length: %)', LENGTH(key_value);
  END IF;
END $$;

-- 3. Check pg_net extension
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE 'GOOD: pg_net extension is installed';
  ELSE
    RAISE WARNING 'BAD: pg_net extension is NOT installed';
  END IF;
END $$;

-- 4. Show recent pg_net requests
SELECT
  id,
  created,
  url,
  status_code,
  COALESCE(error_msg, 'no error') as error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
