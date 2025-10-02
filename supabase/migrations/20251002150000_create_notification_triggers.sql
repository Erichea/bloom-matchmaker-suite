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

-- Function to notify admin on new user registration
CREATE OR REPLACE FUNCTION notify_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  client_name text;
BEGIN
  -- Get admin user ID
  SELECT user_id INTO admin_user_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Get client name
  client_name := COALESCE(NEW.first_name || ' ' || COALESCE(NEW.last_name, ''), NEW.email, 'New User');

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
      'new_registration',
      'New client: ' || client_name,
      client_name || ' has created an account',
      '/admin/clients',
      'profile_update',
      'medium',
      NEW.id,
      'profile'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admin when match is accepted or rejected
CREATE OR REPLACE FUNCTION notify_match_response()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  profile1_name text;
  profile2_name text;
  responding_user_name text;
  other_user_name text;
  response_type text;
BEGIN
  -- Only proceed if a response changed (not mutual match, that's handled separately)
  IF (NEW.profile_1_response IS DISTINCT FROM OLD.profile_1_response OR
      NEW.profile_2_response IS DISTINCT FROM OLD.profile_2_response) AND
      NEW.match_status != 'both_accepted' THEN

    -- Get admin user ID
    SELECT user_id INTO admin_user_id
    FROM user_roles
    WHERE role = 'admin'
    LIMIT 1;

    -- Get names
    SELECT first_name || ' ' || COALESCE(last_name, '')
    INTO profile1_name
    FROM profiles
    WHERE id = NEW.profile_1_id;

    SELECT first_name || ' ' || COALESCE(last_name, '')
    INTO profile2_name
    FROM profiles
    WHERE id = NEW.profile_2_id;

    -- Determine who responded
    IF NEW.profile_1_response IS DISTINCT FROM OLD.profile_1_response THEN
      responding_user_name := profile1_name;
      other_user_name := profile2_name;
      response_type := NEW.profile_1_response;
    ELSE
      responding_user_name := profile2_name;
      other_user_name := profile1_name;
      response_type := NEW.profile_2_response;
    END IF;

    IF admin_user_id IS NOT NULL AND response_type IS NOT NULL THEN
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
        'client_action',
        CASE
          WHEN response_type = 'accepted' THEN responding_user_name || ' accepted match'
          WHEN response_type = 'rejected' THEN responding_user_name || ' rejected match'
          ELSE responding_user_name || ' responded to match'
        END,
        responding_user_name || ' ' || response_type || ' the match with ' || other_user_name,
        '/admin/matches',
        CASE
          WHEN response_type = 'accepted' THEN 'approval'
          ELSE 'alert'
        END,
        'low',
        NEW.id,
        'match'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admin when profile is updated
CREATE OR REPLACE FUNCTION notify_profile_updated()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  client_name text;
BEGIN
  -- Only notify if profile already exists and is being updated (not initial creation)
  IF OLD.id IS NOT NULL AND NEW.updated_at > OLD.updated_at THEN
    -- Get admin user ID
    SELECT user_id INTO admin_user_id
    FROM user_roles
    WHERE role = 'admin'
    LIMIT 1;

    -- Get client name
    client_name := COALESCE(NEW.first_name || ' ' || COALESCE(NEW.last_name, ''), 'User');

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
        'profile_update',
        'Profile updated: ' || client_name,
        client_name || ' has updated their profile',
        '/admin/clients',
        'profile_update',
        'low',
        NEW.id,
        'profile'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_user_registration ON profiles;
CREATE TRIGGER trigger_notify_new_user_registration
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user_registration();

DROP TRIGGER IF EXISTS trigger_notify_new_match ON matches;
CREATE TRIGGER trigger_notify_new_match
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_match();

DROP TRIGGER IF EXISTS trigger_notify_match_response ON matches;
CREATE TRIGGER trigger_notify_match_response
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_response();

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

DROP TRIGGER IF EXISTS trigger_notify_profile_updated ON profiles;
CREATE TRIGGER trigger_notify_profile_updated
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_profile_updated();
