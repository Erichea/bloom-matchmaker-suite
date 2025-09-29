-- Insert an admin role for testing (you'll need to sign up first)
-- This is a temporary solution for testing - in production you'd assign admin roles through a proper admin interface

-- First, let's check if there are any users and create a temporary admin assignment
-- You can run this after signing up to make yourself an admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email LIKE '%@%'  -- This will match any signed up user
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.users.id AND role = 'admin'
)
LIMIT 1;