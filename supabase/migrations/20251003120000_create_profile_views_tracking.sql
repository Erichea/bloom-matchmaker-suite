-- Create profile_views table to track when admin views client profiles
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_admin_profile_view UNIQUE (admin_user_id, profile_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_views_admin_user_id ON public.profile_views(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON public.profile_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all profile views
CREATE POLICY "Admins can view all profile views"
  ON public.profile_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can insert/update their own profile views
CREATE POLICY "Admins can manage their own profile views"
  ON public.profile_views
  FOR ALL
  TO authenticated
  USING (admin_user_id = auth.uid())
  WITH CHECK (
    admin_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to track profile view (updates if already exists, otherwise inserts)
CREATE OR REPLACE FUNCTION track_profile_view(p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update the view timestamp
  INSERT INTO public.profile_views (profile_id, admin_user_id, viewed_at)
  VALUES (p_profile_id, auth.uid(), now())
  ON CONFLICT (admin_user_id, profile_id)
  DO UPDATE SET viewed_at = now();
END;
$$;
