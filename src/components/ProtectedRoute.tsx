import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [roleLoading, setRoleLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkUserRole = async () => {
      if (!user) {
        if (isMounted) {
          setUserRole(undefined);
          setRoleLoading(false);
        }
        return;
      }

      if (isMounted) {
        setRoleLoading(true);
      }

      console.log('Checking role for user:', user.id, user.email);

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        console.log('Role query result:', { data, error });

        if (isMounted) {
          if (error) {
            console.error('Error fetching user role:', error);
            setUserRole('client'); // Default to client if no role found
          } else {
            setUserRole(data?.role || 'client');
            console.log('User role set to:', data?.role || 'client');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        if (isMounted) {
          setUserRole('client');
        }
      } finally {
        if (isMounted) {
          console.log('Setting roleLoading to false');
          setRoleLoading(false);
        }
      }
    };

    checkUserRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Redirect to admin login if not logged in and trying to access admin
  if (!user && !loading && requireAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access this page. This area is restricted to administrators only.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Current user role: <span className="font-semibold">{userRole || 'client'}</span>
            </p>
            <Button onClick={() => window.location.href = '/client'} className="w-full">
              Go to Client Dashboard
            </Button>
            <Button onClick={signOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};