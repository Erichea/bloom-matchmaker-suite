-- Add RLS policies for match_interactions table that was missing policies
CREATE POLICY "Users can view their match interactions" ON public.match_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE matches.id = match_interactions.match_id
      AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE (id = matches.profile_1_id OR id = matches.profile_2_id) 
        AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all match interactions" ON public.match_interactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );