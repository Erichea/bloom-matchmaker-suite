-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all profile views" ON public.profile_views;
DROP POLICY IF EXISTS "Admins can manage their own profile views" ON public.profile_views;

-- Simpler policy: Users can view their own profile views
CREATE POLICY "Users can view their own profile views"
  ON public.profile_views
  FOR SELECT
  TO authenticated
  USING (admin_user_id = auth.uid());

-- Policy: Users can insert their own profile views
CREATE POLICY "Users can insert their own profile views"
  ON public.profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = auth.uid());

-- Policy: Users can update their own profile views
CREATE POLICY "Users can update their own profile views"
  ON public.profile_views
  FOR UPDATE
  TO authenticated
  USING (admin_user_id = auth.uid())
  WITH CHECK (admin_user_id = auth.uid());
