import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      console.log('Checking role for user:', user.id, user.email);

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        console.log('Role query result:', { data, error });

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(data?.role || null);
          console.log('User role set to:', data?.role);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(null);
      } finally {
        console.log('Setting roleLoading to false');
        setRoleLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  // Redirect to auth page if not logged in
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading spinner while checking authentication OR role
  if (loading || roleLoading) {
    console.log('Loading states - auth loading:', loading, 'role loading:', roleLoading, 'user:', !!user, 'userRole:', userRole);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check admin role if required (only after loading is complete)
  if (requireAdmin && userRole !== 'admin') {
    console.log('Access denied. Required: admin, User role:', userRole, 'Require admin:', requireAdmin);
    return <Navigate to="/client" replace />;
  }

  return <>{children}</>;
};