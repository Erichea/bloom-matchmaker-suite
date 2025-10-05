import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function NotificationDebug() {
  const { user } = useAuth();
  const [status, setStatus] = useState<any>({});
  const [swStatus, setSWStatus] = useState<string>("Checking...");

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const checks: any = {};

    // 1. Check if notifications are supported
    checks.notificationSupported = 'Notification' in window;
    
    // 2. Check permission status
    if (checks.notificationSupported) {
      checks.permission = Notification.permission;
    }

    // 3. Check service worker
    if ('serviceWorker' in navigator) {
      checks.serviceWorkerSupported = true;
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        checks.serviceWorkerRegistered = !!registration;
        if (registration) {
          checks.swScope = registration.scope;
          checks.swActive = !!registration.active;
          checks.swWaiting = !!registration.waiting;
          checks.swInstalling = !!registration.installing;
          
          // Check for push subscription
          const subscription = await registration.pushManager.getSubscription();
          checks.pushSubscribed = !!subscription;
          if (subscription) {
            checks.subscriptionEndpoint = subscription.endpoint;
          }
        }
      } catch (error: any) {
        checks.serviceWorkerError = error.message;
      }
    } else {
      checks.serviceWorkerSupported = false;
    }

    // 4. Check PushManager
    checks.pushManagerSupported = 'PushManager' in window;

    setStatus(checks);
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setStatus({ ...status, permission });
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const registerSW = async () => {
    try {
      setSWStatus("Registering...");
      const registration = await navigator.serviceWorker.register('/notificationapi-service-worker.js', {
        scope: '/'
      });
      setSWStatus("Registered: " + registration.scope);
      await checkNotificationStatus();
    } catch (error: any) {
      setSWStatus("Error: " + error.message);
    }
  };

  const sendTestNotification = async () => {
    if (status.permission !== 'granted') {
      alert("Please grant notification permission first!");
      return;
    }

    try {
      // Local test notification (works without server)
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        alert("No service worker registered!");
        return;
      }

      await registration.showNotification("Local Test 🧪", {
        body: "This is a local test notification",
        icon: "/icon-192.png",
        badge: "/badge-72.png"
      });
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">Notification Debug</h1>

        <Card>
          <CardHeader>
            <CardTitle>Status Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(status).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="font-mono text-sm">{key}</span>
                <div className="flex items-center gap-2">
                  {typeof value === 'boolean' ? (
                    value ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )
                  ) : (
                    <span className="text-sm">{String(value)}</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={checkNotificationStatus} className="w-full">
              Refresh Status
            </Button>
            
            {status.permission !== 'granted' && (
              <Button onClick={requestPermission} variant="secondary" className="w-full">
                Request Permission
              </Button>
            )}

            {!status.serviceWorkerRegistered && (
              <Button onClick={registerSW} variant="secondary" className="w-full">
                Register Service Worker
              </Button>
            )}

            <Button onClick={sendTestNotification} variant="outline" className="w-full">
              Send Local Test Notification
            </Button>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Service Worker Status:</strong> {swStatus}
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertDescription className="font-mono text-xs">
            <strong>User ID:</strong> {user?.id || "Not logged in"}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
