import { NotificationAPIProvider } from '@notificationapi/react';
import { useAuth } from '@/hooks/useAuth';
import { ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Check if user has push enabled and ensure tokens are synced
    const syncPushTokens = async () => {
      try {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('push_enabled')
          .eq('user_id', user.id)
          .single();

        if (prefs?.push_enabled && Notification.permission === 'granted') {
          console.log('User has push enabled, ensuring tokens are registered...');
          // The NotificationAPI SDK will automatically sync tokens when initialized
        }
      } catch (error) {
        console.error('Error checking push preferences:', error);
      }
    };

    syncPushTokens();
  }, [user]);

  // Only initialize NotificationAPI when user is authenticated
  if (!user) {
    return <>{children}</>;
  }

  return (
    <NotificationAPIProvider
      userId={user.id}
      clientId="yq42fwnkajoxhxdkvoatkocrgr"
      apiURL="api.eu.notificationapi.com"
      wsURL="ws.eu.notificationapi.com"
      webPushOptInMessage={false} // We'll handle opt-in manually in settings
      customServiceWorkerPath="/notificationapi-service-worker.js"
      debug={true} // Enable debug logging
    >
      {children}
    </NotificationAPIProvider>
  );
}
