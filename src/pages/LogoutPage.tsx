import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const LogoutPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Starting logout process...');

        // First try to use the auth context signOut
        await signOut();

        // Double-check by calling supabase directly
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Direct signOut error:', error);
        }

        console.log('Logout completed, navigating to home...');

        // Use a small delay to ensure session cleanup
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);

      } catch (error) {
        console.error('Logout error:', error);
        // Still navigate even if there's an error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      }
    };

    performLogout();
  }, [signOut, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
};

export default LogoutPage;