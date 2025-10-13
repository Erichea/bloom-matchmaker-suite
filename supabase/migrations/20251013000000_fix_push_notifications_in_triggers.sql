-- Fix push notifications in trigger functions
-- CRITICAL: pg_net signature is http_post(url, body, params, headers, timeout)
-- Headers must be passed as a SEPARATE parameter, not nested in params!

-- 1. Fix send_push_notification to use correct headers parameter
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

  -- Build headers separately (NOT nested in params!)
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_role_key
  );

  RAISE LOG 'Calling edge function: % with body: %', v_url, v_body;

  -- Call edge function using CORRECT signature: http_post(url, body, params, headers, timeout)
  BEGIN
    SELECT net.http_post(
      url := v_url,
      body := v_body,
      params := '{}'::jsonb,  -- Empty params
      headers := v_headers     -- Headers as separate parameter!
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
  -- Get user IDs and names for both profiles
  SELECT user_id, first_name || ' ' || COALESCE(last_name, '')
  INTO profile1_user_id, profile1_name
  FROM profiles
  WHERE id = NEW.profile_1_id;

  SELECT user_id, first_name || ' ' || COALESCE(last_name, '')
  INTO profile2_user_id, profile2_name
  FROM profiles
  WHERE id = NEW.profile_2_id;

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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update notify_mutual_match to include push notifications
CREATE OR REPLACE FUNCTION notify_mutual_match()
RETURNS TRIGGER AS $$
DECLARE
  profile1_user_id uuid;
  profile2_user_id uuid;
  profile1_name text;
  profile2_name text;
BEGIN
  -- Only proceed if match status changed to both_accepted
  IF NEW.match_status = 'both_accepted' AND (OLD.match_status IS NULL OR OLD.match_status != 'both_accepted') THEN
    -- Get user IDs and names
    SELECT user_id, first_name || ' ' || COALESCE(last_name, '')
    INTO profile1_user_id, profile1_name
    FROM profiles
    WHERE id = NEW.profile_1_id;

    SELECT user_id, first_name || ' ' || COALESCE(last_name, '')
    INTO profile2_user_id, profile2_name
    FROM profiles
    WHERE id = NEW.profile_2_id;

    -- Notify profile 1 about mutual match with profile 2
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
      'mutual_match',
      'Mutual match with ' || profile2_name || '!',
      'Congratulations! You both matched. Start your conversation.',
      '/client/dashboard?match=' || NEW.id,
      'match',
      'high',
      NEW.id,
      'match'
    );

    -- Send push notification to profile 1
    PERFORM send_push_notification(
      profile1_user_id,
      'mutual_match',
      jsonb_build_object(
        'userId', profile1_user_id::text,
        'matchName', profile2_name,
        'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
        'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
      )
    );

    -- Notify profile 2 about mutual match with profile 1
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
      'mutual_match',
      'Mutual match with ' || profile1_name || '!',
      'Congratulations! You both matched. Start your conversation.',
      '/client/dashboard?match=' || NEW.id,
      'match',
      'high',
      NEW.id,
      'match'
    );

    -- Send push notification to profile 2
    PERFORM send_push_notification(
      profile2_user_id,
      'mutual_match',
      jsonb_build_object(
        'userId', profile2_user_id::text,
        'matchName', profile1_name,
        'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
        'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
      )
    );

    -- Notify admin about mutual match
    DECLARE
      admin_user_id uuid;
    BEGIN
      SELECT user_id INTO admin_user_id
      FROM user_roles
      WHERE role = 'admin'
      LIMIT 1;

      IF admin_user_id IS NOT NULL THEN
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
          admin_user_id,
          'admin',
          'mutual_match',
          'Mutual match: ' || profile1_name || ' & ' || profile2_name,
          'Both users have accepted the match',
          '/admin/matches',
          'approval',
          'medium',
          NEW.id,
          'match'
        );
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update notify_profile_status_change to include push notifications
CREATE OR REPLACE FUNCTION notify_profile_status_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  client_name text;
BEGIN
  -- Get admin user ID (first admin found)
  SELECT user_id INTO admin_user_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Get client name
  SELECT first_name || ' ' || COALESCE(last_name, '')
  INTO client_name
  FROM profiles
  WHERE id = NEW.id;

  -- Notify admin when profile submitted for review
  IF NEW.status = 'pending_approval' AND (OLD.status IS NULL OR OLD.status != 'pending_approval') THEN
    IF admin_user_id IS NOT NULL THEN
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
        admin_user_id,
        'admin',
        'pending_review',
        'Profile review: ' || client_name,
        client_name || ' has submitted their profile for review',
        '/admin/clients',
        'pending_review',
        'high',
        NEW.id,
        'profile'
      );
    END IF;
  END IF;

  -- Notify client when profile is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO notifications (
      user_id,
      user_type,
      notification_type,
      title,
      description,
      redirect_url,
      icon_type,
      priority
    ) VALUES (
      NEW.user_id,
      'client',
      'profile_approval',
      'Your profile has been approved ✓',
      'Your profile is now active and you''ll start receiving curated matches',
      '/client/dashboard',
      'profile_approval',
      'high'
    );

    -- Send push notification
    PERFORM send_push_notification(
      NEW.user_id,
      'profile_approval',
      jsonb_build_object(
        'userId', NEW.user_id::text,
        'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
        'url', 'https://bloom-matchmaker-suite.lovable.app/client/dashboard'
      )
    );
  END IF;

  -- Notify client when profile needs updates
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    INSERT INTO notifications (
      user_id,
      user_type,
      notification_type,
      title,
      description,
      redirect_url,
      icon_type,
      priority
    ) VALUES (
      NEW.user_id,
      'client',
      'profile_update',
      'Your profile needs updates',
      'Your matchmaker has requested some changes to your profile',
      '/client/profile/edit',
      'alert',
      'high'
    );

    -- Send push notification
    PERFORM send_push_notification(
      NEW.user_id,
      'profile_update',
      jsonb_build_object(
        'userId', NEW.user_id::text,
        'icon', 'https://bloom-matchmaker-suite.lovable.app/icon-192.png',
        'url', 'https://bloom-matchmaker-suite.lovable.app/client/profile/edit'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
