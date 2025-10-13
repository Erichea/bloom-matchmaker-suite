-- Check if the service key is actually correct
-- This will show the first 20 and last 20 characters
SELECT
  key,
  LEFT(value, 20) as key_start,
  RIGHT(value, 20) as key_end,
  LENGTH(value) as key_length,
  value LIKE 'eyJ%' as looks_like_jwt
FROM private.config
WHERE key = 'service_role_key';
