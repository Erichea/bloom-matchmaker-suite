-- Refine profile update notifications to only fire on meaningful profile changes
CREATE OR REPLACE FUNCTION notify_profile_updated()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id uuid;
  client_name text;
  non_trigger_fields text[] := ARRAY[
    'id',
    'user_id',
    'access_code_id',
    'created_at',
    'updated_at',
    'completion_percentage',
    'status',
    'admin_notes'
  ];
  old_filtered jsonb;
  new_filtered jsonb;
BEGIN
  IF OLD.id IS NULL THEN
    RETURN NEW;
  END IF;

  new_filtered := to_jsonb(NEW) - non_trigger_fields;
  old_filtered := to_jsonb(OLD) - non_trigger_fields;

  IF new_filtered IS NOT DISTINCT FROM old_filtered THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO admin_user_id
  FROM user_roles
  WHERE role = 'admin'
  ORDER BY created_at
  LIMIT 1;

  client_name := trim(
    coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, '')
  );

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
      'Profile updated: ' || client_name,
      client_name || ' has updated their profile',
      '/admin/clients',
      'profile_update',
      'low',
      NEW.id,
      'profile'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
