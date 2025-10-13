-- Check if the send_push_notification function exists and has the correct definition
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'send_push_notification';

-- Check if notify_new_match calls send_push_notification
SELECT prosrc
FROM pg_proc
WHERE proname = 'notify_new_match';

-- Check recent pg_net requests (if pg_net extension is installed)
SELECT
  id,
  created,
  url,
  status_code,
  error_msg,
  response
FROM net._http_response
ORDER BY created DESC
LIMIT 10;

-- Check recent notifications created
SELECT
  id,
  created_at,
  user_id,
  notification_type,
  title,
  is_read
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Check if service role key is configured
SELECT key,
  CASE
    WHEN value IS NULL THEN 'NOT SET'
    WHEN value = '' THEN 'EMPTY'
    WHEN LENGTH(value) < 50 THEN 'TOO SHORT (probably wrong)'
    ELSE 'SET (length: ' || LENGTH(value) || ')'
  END as status
FROM private.config
WHERE key = 'service_role_key';
