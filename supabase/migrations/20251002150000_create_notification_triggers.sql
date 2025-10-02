-- Function to create notification for new match
CREATE OR REPLACE FUNCTION notify_new_match()
RETURNS TRIGGER AS $$
DECLARE
  profile1_user_id uuid;
  profile2_user_id uuid;
  profile1_name text;
  profile2_name text;
BEGIN
  -- Get user IDs and names for both profiles
  SELECT user_id, first_name || ' ' || last_name
  INTO profile1_user_id, profile1_name
  FROM profiles
  WHERE id = NEW.profile_1_id;

  SELECT user_id, first_name || ' ' || last_name
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on mutual match
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admin when profile status changes
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
        priority
      ) VALUES (
        admin_user_id,
        'admin',
        'pending_review',
        'New profile pending review',
        client_name || ' has submitted their profile for review',
        '/admin/clients',
        'pending_review',
        'high'
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_match ON matches;
CREATE TRIGGER trigger_notify_new_match
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_match();

DROP TRIGGER IF EXISTS trigger_notify_mutual_match ON matches;
CREATE TRIGGER trigger_notify_mutual_match
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_mutual_match();

DROP TRIGGER IF EXISTS trigger_notify_profile_status_change ON profiles;
CREATE TRIGGER trigger_notify_profile_status_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_profile_status_change();
