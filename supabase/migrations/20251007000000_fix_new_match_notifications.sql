-- Fix new_match notifications by ensuring service role key is configured
-- and send_push_notification function calls the correct edge function

-- IMPORTANT: Before running this migration, you MUST set your service role key
-- Find it in: Supabase Dashboard → Settings → API → Project API keys → service_role secret
-- Then run in SQL Editor: SELECT private.set_service_key('YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE');

-- Simplified and more reliable send_push_notification function
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id uuid,
  p_template_id text,
  p_merge_tags jsonb
)
RETURNS void AS $$
DECLARE
  v_supabase_url text := 'https://loeaypczgpbgruzwkgjh.supabase.co';
  v_service_role_key text;
BEGIN
  -- Try multiple methods to get the service role key
  BEGIN
    -- Method 1: Try environment setting
    v_service_role_key := current_setting('app.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    -- Method 2: Try private config table
    BEGIN
      SELECT value INTO v_service_role_key FROM private.config WHERE key = 'service_role_key';
    EXCEPTION WHEN OTHERS THEN
      -- Method 3: Try to get from a direct environment variable (if configured)
      v_service_role_key := current_setting('app.service_role_key', true);
    END;
  END;

  -- If no key found, log warning but don't fail
  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE WARNING 'Service role key not configured. Please run: SELECT private.set_service_key(''your-service-role-key-here'');';
    RETURN;
  END IF;

  -- Call the appropriate edge function based on template ID
  BEGIN
    PERFORM net.http_post(
      url := v_supabase_url || CASE
        WHEN p_template_id = 'new_match' THEN '/functions/v1/notificationapi-new_match'
        ELSE '/functions/v1/notify'
      END,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_role_key
      ),
      body := CASE
        WHEN p_template_id = 'new_match' THEN p_merge_tags::text
        ELSE jsonb_build_object(
          'action', 'send',
          'userId', p_user_id::text,
          'templateId', p_template_id,
          'payload', p_merge_tags,
          'channels', jsonb_build_array('push')
        )::text
      END
    );

    RAISE LOG 'Push notification sent for user % with template %', p_user_id, p_template_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to send push notification for user %: %', p_user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test function to verify notifications are working
CREATE OR REPLACE FUNCTION test_new_match_notification(
  p_user_id uuid,
  p_match_name text
)
RETURNS void AS $$
BEGIN
  RAISE LOG 'Testing notification for user % with match %', p_user_id, p_match_name;

  PERFORM send_push_notification(
    p_user_id,
    'new_match',
    jsonb_build_object(
      'userId', p_user_id::text,
      'matchName', p_match_name,
      'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
      'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
    )
  );

  RAISE LOG 'Test notification completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;