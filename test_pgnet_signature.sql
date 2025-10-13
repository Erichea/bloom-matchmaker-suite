-- Test different pg_net signatures to see which one works
-- Let's test calling a simple endpoint to verify pg_net works at all

DO $$
DECLARE
  v_request_id bigint;
  v_service_key text;
BEGIN
  -- Get the service key
  SELECT value INTO v_service_key FROM private.config WHERE key = 'service_role_key';

  RAISE NOTICE 'Service key length: %', LENGTH(v_service_key);
  RAISE NOTICE 'Service key starts with: %', LEFT(v_service_key, 10);

  -- Test 1: Try with params (nested headers)
  RAISE NOTICE 'Test 1: Using params with nested headers...';
  SELECT net.http_post(
    url := 'https://loeaypczgpbgruzwkgjh.supabase.co/functions/v1/notificationapi-new_match',
    body := '{"userId": "test@example.com", "matchName": "Test", "icon": "https://bloom-matchmaker-suite.lovable.app/icon-192.png", "url": "https://bloom-matchmaker-suite.lovable.app/client/dashboard"}'::jsonb,
    params := jsonb_build_object(
      'headers', jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      )
    )
  ) INTO v_request_id;

  RAISE NOTICE 'Request ID: %', v_request_id;

  -- Wait a moment for the request to complete
  PERFORM pg_sleep(2);

  -- Check the result
  RAISE NOTICE 'Checking response...';
  PERFORM status_code, content
  FROM net._http_response
  WHERE id = v_request_id;

END $$;

-- Show the result
SELECT
  id,
  status_code,
  content,
  error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 1;
