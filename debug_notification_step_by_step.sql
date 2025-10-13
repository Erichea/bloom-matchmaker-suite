-- Step by step debugging of notification flow
-- Run this AFTER creating a match to see what's happening

-- Step 1: Check if notifications were created in the database
SELECT
  'Step 1: Database notifications' as step,
  COUNT(*) as count,
  MAX(created_at) as most_recent
FROM notifications
WHERE notification_type = 'new_match'
  AND created_at > NOW() - INTERVAL '5 minutes';

-- Step 2: Check if send_push_notification was called (check pg_net requests)
SELECT
  'Step 2: pg_net HTTP calls' as step,
  COUNT(*) as count,
  MAX(created) as most_recent
FROM net._http_response
WHERE created > NOW() - INTERVAL '5 minutes';

-- Step 3: Show the most recent pg_net request details
SELECT
  'Step 3: Most recent request' as step,
  id,
  created,
  status_code,
  LEFT(content::text, 200) as response_preview,
  error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 1;

-- Step 4: Check the actual function definition includes PERFORM send_push_notification
SELECT
  'Step 4: Function check' as step,
  CASE
    WHEN prosrc LIKE '%PERFORM send_push_notification%' THEN 'YES - calls send_push_notification'
    ELSE 'NO - missing send_push_notification call'
  END as has_push_call
FROM pg_proc
WHERE proname = 'notify_new_match';

-- Step 5: Check service role key is configured
SELECT
  'Step 5: Service key check' as step,
  CASE
    WHEN value IS NOT NULL AND LENGTH(value) > 50 THEN 'CONFIGURED'
    ELSE 'NOT CONFIGURED'
  END as status
FROM private.config
WHERE key = 'service_role_key';
