-- Check the most recent request after creating a match
SELECT
  id,
  created,
  status_code,
  content,
  error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 1;
