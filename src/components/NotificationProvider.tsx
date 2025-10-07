import { NotificationAPIProvider } from '@notificationapi/react';
import { useAuth } from '@/hooks/useAuth';
import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationProviderProps {
  children: ReactNode;
}

// Component to sync push tokens after NotificationAPI SDK is initialized
function TokenSyncHelper() {
  const { user } = useAuth();
  const notificationAPI = NotificationAPIProvider.useNotificationAPIContext();
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (!user || !notificationAPI || hasSynced) return;

    const syncTokens = async () => {
      try {
        // Check if user has push enabled
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('push_enabled')
          .eq('user_id', user.id)
          .single();

        if (prefs?.push_enabled && Notification.permission === 'granted') {
          console.log('[NotificationProvider] Re-syncing push tokens with NotificationAPI...');

          // Force SDK to re-register push subscription
          await notificationAPI.setWebPushOptIn(true);

          console.log('[NotificationProvider] Push tokens re-synced successfully');
          setHasSynced(true);
        }
      } catch (error) {
        console.error('[NotificationProvider] Error syncing tokens:', error);
      }
    };

    // Delay to ensure SDK is fully initialized
    const timer = setTimeout(syncTokens, 2000);
    return () => clearTimeout(timer);
  }, [user, notificationAPI, hasSynced]);

  return null;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();

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
      webPushOptInMessage={false} // We'll handle opt-in manually
      customServiceWorkerPath="/notificationapi-service-worker.js"
      debug={true} // Enable debug logging
    >
      <TokenSyncHelper />
      {children}
    </NotificationAPIProvider>
  );
}
