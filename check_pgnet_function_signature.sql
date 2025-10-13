-- Check the actual pg_net http_post function signature
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'http_post'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'net');
