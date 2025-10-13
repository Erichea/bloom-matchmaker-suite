-- Check pg_net requests to see if they're being made and what their status is
-- This will show us if send_push_notification is actually calling the edge functions

-- First check what columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'net'
  AND table_name = '_http_response'
ORDER BY ordinal_position;

-- Then get the recent requests
SELECT *
FROM net._http_response
ORDER BY created DESC
LIMIT 20;
