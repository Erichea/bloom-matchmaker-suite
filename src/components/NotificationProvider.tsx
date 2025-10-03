import { NotificationAPIProvider } from '@notificationapi/react';
import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

interface NotificationProviderProps {
  children: ReactNode;
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
      webPushOptInMessage={false} // We'll handle opt-in manually in settings
      customServiceWorkerPath="/notificationapi-service-worker.js"
    >
      {children}
    </NotificationAPIProvider>
  );
}
