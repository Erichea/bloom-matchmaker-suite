-- Add preferred_language column to profiles table
ALTER TABLE public.profiles
ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language for the application (en, fr, etc.)';

-- Create index for faster lookups
CREATE INDEX idx_profiles_preferred_language ON public.profiles(preferred_language);
