-- Add push notification support to existing notification triggers
-- This migration updates triggers to send push notifications via NotificationAPI

-- Helper function to send push notification via edge function
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id uuid,
  p_template_id text,
  p_merge_tags jsonb
)
RETURNS void AS $$
DECLARE
  v_supabase_url text;
  v_service_role_key text;
  v_response record;
BEGIN
  -- Get environment variables (these should be set in your Supabase project)
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.service_role_key', true);

  -- If env vars not set, try default local development URL
  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'http://127.0.0.1:54321';
  END IF;

  -- Call the notify edge function asynchronously
  -- Using pg_net extension if available, otherwise skip silently
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
  EXCEPTION
    WHEN OTHERS THEN
      -- Silently fail if pg_net is not available or other errors
      -- This prevents blocking the main notification insert
      RAISE WARNING 'Failed to send push notification: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notify_new_match function to send push notifications
CREATE OR REPLACE FUNCTION notify_new_match()
RETURNS TRIGGER AS $$
DECLARE
  profile1_user_id uuid;
  profile2_user_id uuid;
  profile1_name text;
  profile2_name text;
  app_origin text;
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

  -- Set app origin (update this with your actual domain in production)
  app_origin := COALESCE(current_setting('app.origin', true), 'http://localhost:5173');

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
        'matchName', profile2_name,
        'url', app_origin || '/client/dashboard?match=' || NEW.id,
        'icon', app_origin || '/icon-192.png'
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
        'matchName', profile1_name,
        'url', app_origin || '/client/dashboard?match=' || NEW.id,
        'icon', app_origin || '/icon-192.png'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notify_mutual_match function to send push notifications
CREATE OR REPLACE FUNCTION notify_mutual_match()
RETURNS TRIGGER AS $$
DECLARE
  profile1_user_id uuid;
  profile2_user_id uuid;
  profile1_name text;
  profile2_name text;
  app_origin text;
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

    -- Set app origin
    app_origin := COALESCE(current_setting('app.origin', true), 'http://localhost:5173');

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
        'matchName', profile2_name,
        'url', app_origin || '/client/dashboard?match=' || NEW.id,
        'icon', app_origin || '/icon-192.png'
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
        'matchName', profile1_name,
        'url', app_origin || '/client/dashboard?match=' || NEW.id,
        'icon', app_origin || '/icon-192.png'
      )
    );

    -- Notify admin about mutual match (no push notification for admin)
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

-- Update notify_profile_status_change function to send push notifications
CREATE OR REPLACE FUNCTION notify_profile_status_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  client_name text;
  app_origin text;
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

  -- Set app origin
  app_origin := COALESCE(current_setting('app.origin', true), 'http://localhost:5173');

  -- Notify admin when profile submitted for review (no push notification)
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
        'url', app_origin || '/client/dashboard',
        'icon', app_origin || '/icon-192.png'
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
        'url', app_origin || '/client/profile/edit',
        'icon', app_origin || '/icon-192.png'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We keep other triggers (new_registration, profile_updated, match_response) unchanged
-- as they don't need push notifications for now
