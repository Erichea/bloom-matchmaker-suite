import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Bell, CheckCircle2, Heart, UserCheck, AlertCircle, RefreshCw, ArrowLeft, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  description: string;
  is_read: boolean;
  redirect_url: string | null;
  icon_type: string | null;
  created_at: string;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
}

const getIconByType = (iconType: string | null) => {
  switch (iconType) {
    case "match":
      return Heart;
    case "profile_approval":
      return CheckCircle2;
    case "profile_update":
      return UserCheck;
    case "alert":
      return AlertCircle;
    default:
      return Bell;
  }
};

export const ClientUpdates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("user_type", "client")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("client-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);
    }

    // Navigate to the redirect URL if provided
    if (notification.redirect_url) {
      navigate(notification.redirect_url);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length === 0) return;

      const notificationIds = unreadNotifications.map(n => n.id);

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", notificationIds);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, is_read: true }
            : notification
        )
      );

      toast({
        title: "Success",
        description: `Marked ${notificationIds.length} notifications as read`,
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-16">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Updates</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-9 px-3 text-sm"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-2" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-20 w-20 text-muted-foreground/40" />
            <h3 className="mt-6 text-xl font-semibold">No updates yet</h3>
            <p className="mt-3 text-base text-muted-foreground max-w-sm">
              We'll notify you when there's something new
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => {
              const Icon = getIconByType(notification.icon_type);

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full card p-4 text-left transition-all duration-200 hover:shadow-md ${
                    !notification.is_read ? "bg-accent/50" : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-sm text-foreground truncate">{notification.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{notification.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};
