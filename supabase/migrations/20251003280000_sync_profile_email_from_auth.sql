-- Sync profile email from auth.users
-- This ensures profiles.email is always populated from the user's auth email

-- Create function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_profile_email_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- When a profile is inserted or user_id is updated, sync the email from auth.users
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id)) THEN
    IF NEW.user_id IS NOT NULL THEN
      -- Fetch email from auth.users using the service role
      SELECT email INTO NEW.email
      FROM auth.users
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync email before insert/update
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON public.profiles;
CREATE TRIGGER sync_profile_email_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email_from_auth();

-- Backfill existing profiles with email from auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.user_id = au.id
  AND (p.email IS NULL OR p.email = '');
