-- Try passing headers as a direct parameter instead of nested in params
-- Some pg_net versions have http_post(url, body, headers, timeout_milliseconds)

DO $$
DECLARE
  v_request_id bigint;
  v_service_key text;
  v_headers jsonb;
  v_body jsonb;
BEGIN
  -- Get the service key
  SELECT value INTO v_service_key FROM private.config WHERE key = 'service_role_key';

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_key
  );

  v_body := jsonb_build_object(
    'userId', 'test@example.com',
    'matchName', 'Test',
    'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
    'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
  );

  RAISE NOTICE 'Trying with direct headers parameter...';
  RAISE NOTICE 'Headers: %', v_headers;

  -- Try: http_post(url, body, headers)
  BEGIN
    SELECT net.http_post(
      url => 'https://loeaypczgpbgruzwkgjh.supabase.co/functions/v1/notificationapi-new_match',
      body => v_body,
      headers => v_headers
    ) INTO v_request_id;

    RAISE NOTICE 'Request ID: %', v_request_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed with direct headers: %', SQLERRM;
  END;

END $$;

-- Show the most recent result
SELECT
  id,
  created,
  status_code,
  LEFT(content::text, 100) as content_preview,
  error_msg
FROM net._http_response
ORDER BY created DESC
LIMIT 1;
