-- Complete fix for push notifications
-- This restores the working version and ensures triggers call send_push_notification

-- 1. Restore the WORKING send_push_notification function
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

  RAISE LOG 'Calling edge function: % with body: %', v_url, v_body;

  -- Call edge function using pg_net with correct signature
  -- IMPORTANT: Headers must be nested inside params parameter!
  BEGIN
    SELECT net.http_post(
      url := v_url,
      body := v_body,
      params := format('{"headers": {"Content-Type": "application/json", "Authorization": "Bearer %s"}}', v_service_role_key)::jsonb
    ) INTO v_request_id;

    RAISE LOG 'Push notification queued (request_id: %) for user % with template %', v_request_id, p_user_id, p_template_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to queue push notification for user %: %', p_user_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_push_notification(uuid, text, jsonb) TO authenticated, service_role;

-- 2. Update notify_new_match to call send_push_notification
CREATE OR REPLACE FUNCTION notify_new_match()
RETURNS TRIGGER AS $$
DECLARE
  profile1_user_id uuid;
  profile2_user_id uuid;
  profile1_name text;
  profile2_name text;
BEGIN
  RAISE LOG 'notify_new_match trigger fired for match %', NEW.id;

  -- Get user IDs and names for both profiles
  SELECT user_id, first_name || ' ' || COALESCE(last_name, '')
  INTO profile1_user_id, profile1_name
  FROM profiles
  WHERE id = NEW.profile_1_id;

  SELECT user_id, first_name || ' ' || COALESCE(last_name, '')
  INTO profile2_user_id, profile2_name
  FROM profiles
  WHERE id = NEW.profile_2_id;

  RAISE LOG 'Profile 1: % (%), Profile 2: % (%)', profile1_name, profile1_user_id, profile2_name, profile2_user_id;

  -- Only create notifications for newly suggested matches (pending status)
  IF NEW.match_status = 'pending' OR NEW.match_status IS NULL THEN
    -- Notify profile 1 about profile 2
    INSERT INTO notifications (
      user_id,
      user_type,
      notification_type,
      title,
      description,
      redirect_url,
      icon_type,
      priority,
      related_entity_id,
      related_entity_type
    ) VALUES (
      profile1_user_id,
      'client',
      'new_match',
      'New match with ' || profile2_name,
      'You have a new curated match waiting for your review',
      '/client/dashboard?match=' || NEW.id,
      'match',
      'medium',
      NEW.id,
      'match'
    );

    RAISE LOG 'Calling send_push_notification for profile 1';

    -- Send push notification to profile 1
    PERFORM send_push_notification(
      profile1_user_id,
      'new_match',
      jsonb_build_object(
        'userId', profile1_user_id::text,
        'matchName', profile2_name,
        'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
        'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
      )
    );

    -- Notify profile 2 about profile 1
    INSERT INTO notifications (
      user_id,
      user_type,
      notification_type,
      title,
      description,
      redirect_url,
      icon_type,
      priority,
      related_entity_id,
      related_entity_type
    ) VALUES (
      profile2_user_id,
      'client',
      'new_match',
      'New match with ' || profile1_name,
      'You have a new curated match waiting for your review',
      '/client/dashboard?match=' || NEW.id,
      'match',
      'medium',
      NEW.id,
      'match'
    );

    RAISE LOG 'Calling send_push_notification for profile 2';

    -- Send push notification to profile 2
    PERFORM send_push_notification(
      profile2_user_id,
      'new_match',
      jsonb_build_object(
        'userId', profile2_user_id::text,
        'matchName', profile1_name,
        'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
        'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
      )
    );

    RAISE LOG 'Push notifications sent for both users';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
