-- Fix the send_push_notification function to not use http_response type
-- Instead, just fire and forget the HTTP request

CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id uuid,
  p_template_id text,
  p_merge_tags jsonb
)
RETURNS void AS $$
DECLARE
  v_function_url text;
BEGIN
  -- Map template_id to the corresponding edge function
  v_function_url := 'https://loeaypczgpbgruzwkgjh.supabase.co/functions/v1/notificationapi-' || p_template_id;

  -- Call the NotificationAPI edge function (fire and forget)
  BEGIN
    PERFORM extensions.http_post(
      v_function_url,
      p_merge_tags::text,
      'application/json'
    );

    -- Log success
    RAISE LOG 'Push notification queued for user % with template %', p_user_id, p_template_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to send push notification for user % with template %: %',
        p_user_id, p_template_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
