-- Set database configuration for push notifications
-- This allows the send_push_notification function to access the service role key

-- Set the service role key from environment
-- Note: In Supabase, secrets are available as environment variables in edge functions
-- For database functions, we need to set them via ALTER DATABASE

-- Unfortunately, we can't directly access secrets from database functions
-- So we'll use a workaround: store the service role key in a secure schema

-- Create a secure schema for storing configuration
CREATE SCHEMA IF NOT EXISTS private;

-- Revoke all permissions except from postgres
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres;

-- Create a function that edge functions can call to register the service key
CREATE OR REPLACE FUNCTION private.set_service_key(p_key text)
RETURNS void AS $$
BEGIN
  -- Store in a table that only postgres can access
  CREATE TABLE IF NOT EXISTS private.config (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz DEFAULT now()
  );

  INSERT INTO private.config (key, value, updated_at)
  VALUES ('service_role_key', p_key, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update send_push_notification to use the stored key
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
BEGIN
  -- Get service role key from private config
  BEGIN
    SELECT value INTO v_service_role_key FROM private.config WHERE key = 'service_role_key';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not retrieve service role key: %', SQLERRM;
    RETURN;
  END;

  -- If no key, skip
  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    RAISE WARNING 'Service role key not configured, skipping push notification';
    RETURN;
  END IF;

  -- Call the notify edge function asynchronously using pg_net
  BEGIN
    SELECT net.http_post(
      url := v_supabase_url || '/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_role_key
      ),
      body := jsonb_build_object(
        'action', 'send',
        'userId', p_user_id::text,
        'templateId', p_template_id,
        'payload', p_merge_tags,
        'channels', jsonb_build_array('push')
      )
    ) INTO v_request_id;

    -- Log success for debugging
    RAISE LOG 'Push notification queued (request_id: %) for user % with template %', v_request_id, p_user_id, p_template_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Failed to send push notification for user %: %', p_user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: After this migration, you need to manually set the service role key by running:
-- SELECT private.set_service_key('your-service-role-key-here');
