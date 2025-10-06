-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, anon, authenticated, service_role;

-- Update the send_push_notification function to use Supabase environment
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id uuid,
  p_template_id text,
  p_merge_tags jsonb
)
RETURNS void AS $$
DECLARE
  v_supabase_url text;
  v_service_role_key text;
BEGIN
  -- Get Supabase URL from settings
  -- In Supabase, the URL is available as SUPABASE_URL env var
  v_supabase_url := current_setting('request.headers', true)::json->>'x-forwarded-host';

  -- If we can't get it from headers, use the JWT issuer claim
  IF v_supabase_url IS NULL THEN
    BEGIN
      SELECT (current_setting('request.jwt.claims', true)::json->>'iss') INTO v_supabase_url;
    EXCEPTION WHEN OTHERS THEN
      v_supabase_url := NULL;
    END;
  END IF;

  -- Fallback to hardcoded project URL (update this with your actual project URL)
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://loeaypczgpbgruzwkgjh.supabase.co';
  END IF;

  -- Make sure we have https://
  IF v_supabase_url NOT LIKE 'http%' THEN
    v_supabase_url := 'https://' || v_supabase_url;
  END IF;

  -- Get service role key from vault or use environment
  BEGIN
    v_service_role_key := current_setting('app.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    v_service_role_key := NULL;
  END;

  -- Call the notify edge function asynchronously using pg_net
  BEGIN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(v_service_role_key, '')
      ),
      body := jsonb_build_object(
        'action', 'send',
        'userId', p_user_id::text,
        'templateId', p_template_id,
        'payload', p_merge_tags,
        'channels', jsonb_build_array('push')
      )
    );

    -- Log success for debugging
    RAISE LOG 'Push notification queued for user % with template %', p_user_id, p_template_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Failed to send push notification for user %: %', p_user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
