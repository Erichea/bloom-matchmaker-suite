import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NotificationAPIProvider } from '@notificationapi/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import {
  ArrowLeft,
  Bell,
  AlertCircle,
  CheckCircle2,
  Smartphone
} from "lucide-react";

export default function NotificationSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const notificationAPI = NotificationAPIProvider.useNotificationAPIContext();

  const [preferences, setPreferences] = useState<any>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    const init = async () => {
      await loadPreferences();
      await checkPushStatus();

      // CRITICAL: Re-sync push tokens with NotificationAPI every time component mounts
      // This fixes the issue where tokens are lost when user closes/reopens the app
      if (notificationAPI && Notification.permission === 'granted') {
        console.log('[NotificationSettings] Re-syncing push tokens with NotificationAPI...');
        try {
          // Force the SDK to re-register push subscription
          await notificationAPI.setWebPushOptIn(true);
          console.log('[NotificationSettings] Push tokens re-synced successfully');
        } catch (error) {
          console.error('[NotificationSettings] Error re-syncing push tokens:', error);
        }
      }
    };

    init();
  }, [user, notificationAPI]);

  const loadPreferences = async () => {
    try {
      // Use maybeSingle() to handle cases where no row exists yet
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Create default preferences if none exist
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user!.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = async () => {
    try {
      // Get the user's preference from database
      // Use maybeSingle() to handle cases where no row exists yet
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("push_enabled")
        .eq("user_id", user!.id)
        .maybeSingle();

      // Ignore PGRST116 (no rows) errors
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Set toggle based on database preference
      // This reflects what the user chose, not the browser permission state
      setPushEnabled(data?.push_enabled ?? false);

      // Log browser permission status for debugging
      if ('Notification' in window) {
        console.log('[NotificationSettings] Browser permission:', Notification.permission);
        console.log('[NotificationSettings] DB preference:', data?.push_enabled);
      }
    } catch (error) {
      console.error("Error checking push status:", error);
      setPushEnabled(false);
    }
  };

  const handleEnablePush = async () => {
    setSubscribing(true);
    try {
      console.log('Enabling push notifications...');

      // IMPORTANT: On iOS Safari/PWA, we must explicitly request browser permission FIRST
      // before calling NotificationAPI SDK's setWebPushOptIn()
      let permission: NotificationPermission = Notification.permission;

      if (permission === 'default') {
        console.log('Requesting browser notification permission...');
        permission = await Notification.requestPermission();
        console.log('Permission response:', permission);
      }

      if (permission !== 'granted') {
        if (permission === 'denied') {
          toast({
            title: "Permission denied",
            description: "Please enable notifications in your browser/system settings",
            variant: "destructive"
          });
        } else {
          toast({
            title: "No response",
            description: "Please try again and allow notifications",
            variant: "destructive"
          });
        }
        return;
      }

      // Now that browser permission is granted, register with NotificationAPI
      console.log('Browser permission granted, registering with NotificationAPI...');
      notificationAPI?.setWebPushOptIn(true);

      // Give SDK a moment to register tokens
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Permission result:', permission);

      // Update preferences in database
      await supabase
        .from("notification_preferences")
        .update({
          push_enabled: true,
          push_subscribed_at: new Date().toISOString()
        })
        .eq("user_id", user!.id);

      setPushEnabled(true);

      toast({
        title: "Push notifications enabled",
        description: "You'll now receive push notifications for important updates"
      });

      await loadPreferences();
      console.log('Push notifications enabled successfully');
    } catch (error: any) {
      console.error("Error enabling push:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to enable push notifications",
        variant: "destructive"
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleDisablePush = async () => {
    setSubscribing(true);
    try {
      console.log('Disabling push notifications...');

      // Tell NotificationAPI SDK to opt out (but keep tokens registered)
      // Don't call setWebPushOptIn(false) as it might unregister tokens
      // Just update our local preferences

      // Update preferences in database
      await supabase
        .from("notification_preferences")
        .update({
          push_enabled: false
          // DON'T clear push_subscription or push_subscribed_at
          // This keeps the tokens registered with NotificationAPI
        })
        .eq("user_id", user!.id);

      setPushEnabled(false);
      toast({
        title: "Push notifications disabled",
        description: "You won't receive push notifications anymore. Re-enable anytime."
      });

      await loadPreferences();
      console.log('Push notifications disabled successfully');
    } catch (error: any) {
      console.error("Error disabling push:", error);
      toast({
        title: "Error",
        description: "Failed to disable push notifications",
        variant: "destructive"
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleTestPush = async () => {
    try {
      // Send test notification via edge function
      const { error } = await supabase.functions.invoke("notify", {
        body: {
          action: "send",
          userId: user!.id,
          web_push: {
            title: "Test Notification 🔔",
            message: "This is a test push notification from Bloom!",
            icon: window.location.origin + "/icon-192.png",
            url: window.location.origin + "/client/dashboard"
          },
          channels: ["push"]
        }
      });

      if (error) {
        toast({
          title: "Failed to send test",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Test notification sent",
          description: "You should receive it shortly"
        });
      }
    } catch (error: any) {
      console.error("Error sending test:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive"
      });
    }
  };


  if (loading || !preferences) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Notification Settings</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* PWA Installation Prompt - Only show if not installed */}
        {!isStandalone && showPWAPrompt && (
          <PWAInstallPrompt onDismiss={() => setShowPWAPrompt(false)} />
        )}

        {/* Single Notification Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Enable or disable all notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable/Disable All Notifications */}
            <div className="flex items-center justify-between">
              <Label htmlFor="push-enabled" className="flex-1">
                <div>
                  <p className="font-medium">Enable notifications</p>
                  <p className="text-sm text-muted-foreground">
                    {pushEnabled ? "You'll receive all notifications" : "Turn on to stay updated"}
                  </p>
                </div>
              </Label>
              <Switch
                id="push-enabled"
                checked={pushEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleEnablePush();
                  } else {
                    handleDisablePush();
                  }
                }}
                disabled={subscribing}
              />
            </div>

            {/* Test Button */}
            {pushEnabled && (
              <Button
                variant="outline"
                onClick={handleTestPush}
                className="w-full"
              >
                <Bell className="mr-2 h-4 w-4" />
                Send Test Notification
              </Button>
            )}

            {/* Status Info */}
            {pushEnabled && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Notifications are enabled. You'll receive updates for matches, profile changes, and messages.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
