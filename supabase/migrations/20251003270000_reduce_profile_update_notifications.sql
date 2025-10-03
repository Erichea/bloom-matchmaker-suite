-- Limit profile update notifications to approval events only
CREATE OR REPLACE FUNCTION notify_profile_updated()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  client_name text;
BEGIN
  -- Ignore inserts and updates that do not change status to approved
  IF OLD.id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved')) THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO admin_user_id
  FROM user_roles
  WHERE role = 'admin'
  ORDER BY created_at
  LIMIT 1;

  client_name := trim(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));

  IF client_name = '' THEN
    client_name := 'User';
  END IF;

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
      'Profile approved: ' || client_name,
      client_name || ' has an approved profile',
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
