-- Check the most recent pg_net requests to see what's happening
SELECT
  id,
  created,
  status_code,
  content,
  error_msg,
  timed_out
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
