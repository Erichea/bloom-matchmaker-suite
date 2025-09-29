-- Create a proper security definer function to check user roles
-- This prevents infinite recursion in RLS policies

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop all existing policies on user_roles and access_codes to recreate them properly
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow first admin creation" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage access codes" ON public.access_codes;

-- Recreate user_roles policies using the security definer function
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own client role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'client'
);

-- Recreate access_codes policy using the security definer function
CREATE POLICY "Admins can manage access codes" 
ON public.access_codes 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));