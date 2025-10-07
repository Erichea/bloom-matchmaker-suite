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

  useEffect(() => {
    if (!user || !notificationAPI) return;

    let isMounted = true;

    const syncTokens = async () => {
      try {
        // Check if user has push enabled
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('push_enabled')
          .eq('user_id', user.id)
          .single();

        if (!isMounted) return;

        if (prefs?.push_enabled && Notification.permission === 'granted') {
          console.log('[TokenSyncHelper] User has push enabled, syncing tokens...');
          console.log('[TokenSyncHelper] Browser permission:', Notification.permission);
          console.log('[TokenSyncHelper] DB push_enabled:', prefs.push_enabled);

          // Force SDK to re-register push subscription
          console.log('[TokenSyncHelper] Calling setWebPushOptIn(true)...');
          await notificationAPI.setWebPushOptIn(true);

          console.log('[TokenSyncHelper] ✅ Push tokens synced successfully');
        } else {
          console.log('[TokenSyncHelper] ⏭️  Skipping sync - push_enabled:', prefs?.push_enabled, 'permission:', Notification.permission);
        }
      } catch (error) {
        console.error('[TokenSyncHelper] ❌ Error syncing tokens:', error);
      }
    };

    // Try multiple times to ensure sync completes
    const timer1 = setTimeout(syncTokens, 1000);
    const timer2 = setTimeout(syncTokens, 3000);
    const timer3 = setTimeout(syncTokens, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [user, notificationAPI]);

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
