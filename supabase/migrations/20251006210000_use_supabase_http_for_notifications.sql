-- Replace pg_net with Supabase's http extension for calling NotificationAPI edge functions
-- This is simpler and more reliable than the previous approach

-- Enable the http extension (built into Supabase)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create a simpler send_push_notification function using Supabase's http extension
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id uuid,
  p_template_id text,
  p_merge_tags jsonb
)
RETURNS void AS $$
DECLARE
  v_function_url text;
  v_response http_response;
BEGIN
  -- Map template_id to the corresponding edge function
  v_function_url := 'https://loeaypczgpbgruzwkgjh.supabase.co/functions/v1/notificationapi-' || p_template_id;

  -- Call the NotificationAPI edge function
  BEGIN
    SELECT extensions.http((
      'POST',
      v_function_url,
      ARRAY[extensions.http_header('Content-Type', 'application/json')],
      'application/json',
      p_merge_tags::text
    )::extensions.http_request) INTO v_response;

    -- Log success
    RAISE LOG 'Push notification sent for user % with template % (status: %)',
      p_user_id, p_template_id, v_response.status;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to send push notification for user % with template %: %',
        p_user_id, p_template_id, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notify_new_match to use simplified parameters
CREATE OR REPLACE FUNCTION notify_new_match()
RETURNS TRIGGER AS $$
DECLARE
  profile1_user_id uuid;
  profile2_user_id uuid;
  profile1_name text;
  profile2_name text;
  app_origin text := 'https://bloom-matchmaker-suite.lovable.app';
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
        'icon', app_origin || '/icon-192.png',
        'url', app_origin || '/client/dashboard?match=' || NEW.id
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
        'icon', app_origin || '/icon-192.png',
        'url', app_origin || '/client/dashboard?match=' || NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notify_mutual_match
CREATE OR REPLACE FUNCTION notify_mutual_match()
RETURNS TRIGGER AS $$
DECLARE
  profile1_user_id uuid;
  profile2_user_id uuid;
  profile1_name text;
  profile2_name text;
  app_origin text := 'https://bloom-matchmaker-suite.lovable.app';
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
        'icon', app_origin || '/icon-192.png',
        'url', app_origin || '/client/dashboard?match=' || NEW.id
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
        'icon', app_origin || '/icon-192.png',
        'url', app_origin || '/client/dashboard?match=' || NEW.id
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

-- Update notify_profile_status_change for approval and rejection
CREATE OR REPLACE FUNCTION notify_profile_status_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  client_name text;
  app_origin text := 'https://bloom-matchmaker-suite.lovable.app';
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
        'userId', NEW.user_id::text,
        'icon', app_origin || '/icon-192.png',
        'url', app_origin || '/client/dashboard'
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
        'icon', app_origin || '/icon-192.png',
        'url', app_origin || '/client/profile/edit'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
