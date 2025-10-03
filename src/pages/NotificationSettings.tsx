import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  isPushSupported,
  getPermissionStatus,
  isSubscribed,
  subscribeUser,
  unsubscribeUser,
  sendTestPush
} from "@/lib/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BottomNavigation } from "@/components/BottomNavigation";
import {
  ArrowLeft,
  Bell,
  Heart,
  UserCheck,
  MessageSquare,
  Settings as SettingsIcon,
  Share,
  AlertCircle,
  CheckCircle2,
  Smartphone
} from "lucide-react";

export default function NotificationSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [preferences, setPreferences] = useState<any>(null);
  const [pushSupport, setPushSupport] = useState<any>({ supported: false });
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadPreferences();
    checkPushStatus();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .single();

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
    const support = isPushSupported();
    setPushSupport(support);

    if (support.supported) {
      setPermission(getPermissionStatus());
      const subscribed = await isSubscribed();
      setPushSubscribed(subscribed);
    }
  };

  const handleEnablePush = async () => {
    setSubscribing(true);
    try {
      const result = await subscribeUser({
        userId: user!.id,
        channels: ["push"]
      });

      if (result.success) {
        // Update preferences in database
        await supabase
          .from("notification_preferences")
          .update({
            push_enabled: true,
            push_subscribed_at: new Date().toISOString()
          })
          .eq("user_id", user!.id);

        setPushSubscribed(true);
        setPermission("granted");
        toast({
          title: "Push notifications enabled",
          description: "You'll now receive push notifications for important updates"
        });

        // Reload preferences
        await loadPreferences();
      } else {
        toast({
          title: "Failed to enable push notifications",
          description: result.error || "Please try again",
          variant: "destructive"
        });
      }
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
      await unsubscribeUser(user!.id);

      // Update preferences
      await supabase
        .from("notification_preferences")
        .update({
          push_enabled: false,
          push_subscription: null,
          push_subscribed_at: null
        })
        .eq("user_id", user!.id);

      setPushSubscribed(false);
      toast({
        title: "Push notifications disabled",
        description: "You won't receive push notifications anymore"
      });

      await loadPreferences();
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
    setTesting(true);
    try {
      const result = await sendTestPush(user!.id);
      if (result.success) {
        toast({
          title: "Test notification sent",
          description: "You should receive it shortly"
        });
      } else {
        toast({
          title: "Failed to send test",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending test:", error);
    } finally {
      setTesting(false);
    }
  };

  const handlePreferenceToggle = async (key: string, value: boolean) => {
    try {
      await supabase
        .from("notification_preferences")
        .update({ [key]: value })
        .eq("user_id", user!.id);

      setPreferences({ ...preferences, [key]: value });
      toast({
        title: "Preference updated",
        description: "Your notification preferences have been saved"
      });
    } catch (error) {
      console.error("Error updating preference:", error);
      toast({
        title: "Error",
        description: "Failed to update preference",
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
        {/* Push Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Receive real-time notifications on this device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* iOS PWA Warning */}
            {pushSupport.requiresPWA && (
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">iOS requires app installation</p>
                    <p className="text-sm">To enable push notifications on iOS, you need to:</p>
                    <ol className="text-sm list-decimal list-inside space-y-1">
                      <li>Tap the <Share className="inline h-3 w-3" /> share button in Safari</li>
                      <li>Select "Add to Home Screen"</li>
                      <li>Open the app from your home screen</li>
                      <li>Return here to enable notifications</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Unsupported Browser */}
            {!pushSupport.supported && !pushSupport.requiresPWA && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {pushSupport.reason || "Push notifications are not supported on this device"}
                </AlertDescription>
              </Alert>
            )}

            {/* Permission Denied */}
            {pushSupport.supported && permission === "denied" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Push notifications are blocked. Please enable them in your browser settings.
                </AlertDescription>
              </Alert>
            )}

            {/* Enable/Disable Push */}
            {pushSupport.supported && !pushSupport.requiresPWA && (
              <div className="flex items-center justify-between">
                <Label htmlFor="push-enabled" className="flex-1">
                  <div>
                    <p className="font-medium">Enable push notifications</p>
                    <p className="text-sm text-muted-foreground">
                      {pushSubscribed ? "Notifications are enabled" : "Get notified instantly"}
                    </p>
                  </div>
                </Label>
                <Switch
                  id="push-enabled"
                  checked={pushSubscribed}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleEnablePush();
                    } else {
                      handleDisablePush();
                    }
                  }}
                  disabled={subscribing || permission === "denied"}
                />
              </div>
            )}

            {/* Test Button */}
            {pushSubscribed && (
              <Button
                variant="outline"
                onClick={handleTestPush}
                disabled={testing}
                className="w-full"
              >
                <Bell className="mr-2 h-4 w-4" />
                {testing ? "Sending..." : "Send Test Notification"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Receive updates via email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled" className="flex-1">
                <div>
                  <p className="font-medium">Enable email notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get important updates via email
                  </p>
                </div>
              </Label>
              <Switch
                id="email-enabled"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  handlePreferenceToggle("email_enabled", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="match-notifications" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Match notifications</p>
                  <p className="text-sm text-muted-foreground">
                    New matches and match updates
                  </p>
                </div>
              </Label>
              <Switch
                id="match-notifications"
                checked={preferences.match_notifications}
                onCheckedChange={(checked) =>
                  handlePreferenceToggle("match_notifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="profile-notifications" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Profile notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Profile approvals and updates
                  </p>
                </div>
              </Label>
              <Switch
                id="profile-notifications"
                checked={preferences.profile_notifications}
                onCheckedChange={(checked) =>
                  handlePreferenceToggle("profile_notifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="message-notifications" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Message notifications</p>
                  <p className="text-sm text-muted-foreground">
                    New messages and replies
                  </p>
                </div>
              </Label>
              <Switch
                id="message-notifications"
                checked={preferences.message_notifications}
                onCheckedChange={(checked) =>
                  handlePreferenceToggle("message_notifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="system-notifications" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">System notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Account and system updates
                  </p>
                </div>
              </Label>
              <Switch
                id="system-notifications"
                checked={preferences.system_notifications}
                onCheckedChange={(checked) =>
                  handlePreferenceToggle("system_notifications", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Info */}
        {pushSubscribed && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Push notifications are enabled on this device. You'll receive notifications even when the app is closed.
            </AlertDescription>
          </Alert>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
