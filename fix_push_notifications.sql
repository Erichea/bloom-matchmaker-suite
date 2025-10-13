-- Quick fix for push notifications in triggers
-- Run this directly in your Supabase SQL Editor or local database

-- Fix notify_new_match to call send_push_notification
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
