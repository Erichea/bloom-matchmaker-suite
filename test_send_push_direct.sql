-- Test calling send_push_notification directly
-- Replace the UUID with your actual user ID

DO $$
BEGIN
  RAISE NOTICE 'Testing send_push_notification directly...';

  -- Call the function (replace with your actual user_id)
  PERFORM send_push_notification(
    '1a2ffe4e-6adb-4a3d-9ef7-c81621cc4fc5'::uuid,  -- REPLACE WITH YOUR USER ID
    'new_match',
    jsonb_build_object(
      'userId', '1a2ffe4e-6adb-4a3d-9ef7-c81621cc4fc5',
      'matchName', 'Test User',
      'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
      'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
    )
  );

  RAISE NOTICE 'send_push_notification call completed';
END $$;

-- Now check if a request was made
SELECT *
FROM net._http_response
ORDER BY created DESC
LIMIT 1;
