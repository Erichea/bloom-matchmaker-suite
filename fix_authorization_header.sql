-- Fix the send_push_notification function to correctly send Authorization header
-- The issue is that net.http_post isn't receiving the Authorization header properly

CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id uuid,
  p_template_id text,
  p_merge_tags jsonb
)
RETURNS void AS $$
DECLARE
  v_supabase_url text := 'https://loeaypczgpbgruzwkgjh.supabase.co';
  v_service_role_key text;
  v_request_id bigint;
  v_url text;
  v_body jsonb;
  v_headers jsonb;
BEGIN
  RAISE LOG 'send_push_notification called for user % template %', p_user_id, p_template_id;

  -- Get service role key from private config
  SELECT value INTO v_service_role_key FROM private.config WHERE key = 'service_role_key';

  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE WARNING 'Service role key not configured. Run: SELECT private.set_service_key(''your-key'');';
    RETURN;
  END IF;

  -- Build URL based on template
  v_url := v_supabase_url || CASE
    WHEN p_template_id = 'new_match' THEN '/functions/v1/notificationapi-new_match'
    WHEN p_template_id = 'mutual_match' THEN '/functions/v1/notificationapi-mutual_match'
    WHEN p_template_id = 'profile_approval' THEN '/functions/v1/notificationapi-profile_approval'
    WHEN p_template_id = 'profile_update' THEN '/functions/v1/notificationapi-profile_update'
    ELSE '/functions/v1/notify'
  END;

  -- Build body based on template
  v_body := CASE
    WHEN p_template_id IN ('new_match', 'mutual_match', 'profile_approval', 'profile_update') THEN
      p_merge_tags
    ELSE
      jsonb_build_object(
        'action', 'send',
        'userId', p_user_id::text,
        'templateId', p_template_id,
        'payload', p_merge_tags,
        'channels', jsonb_build_array('push')
      )
  END;

  -- Build headers with Authorization
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_role_key
  );

  RAISE LOG 'Calling edge function: % with body: %', v_url, v_body;

  -- Call edge function using pg_net with headers parameter (not params)
  BEGIN
    SELECT net.http_post(
      url := v_url,
      headers := v_headers,
      body := v_body::text
    ) INTO v_request_id;

    RAISE LOG 'Push notification queued (request_id: %) for user % with template %', v_request_id, p_user_id, p_template_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to queue push notification for user %: %', p_user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_push_notification(uuid, text, jsonb) TO authenticated, service_role;
