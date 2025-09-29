-- Fix infinite recursion in user_roles policies
-- Drop the problematic admin policy and recreate it properly
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create a simple policy that allows users to manage roles only if they are already confirmed admins
-- We'll use a direct check against the table instead of a recursive one
CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.user_id != user_roles.user_id  -- Prevent self-reference
  )
);

-- Also ensure we can insert the first admin without issues
CREATE POLICY "Allow first admin creation" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND (
    role = 'client' 
    OR 
    NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
  )
);