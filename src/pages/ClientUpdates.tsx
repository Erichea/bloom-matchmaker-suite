import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Bell, CheckCircle2, Heart, UserCheck, AlertCircle, RefreshCw, ArrowLeft, CheckCheck, Settings } from "lucide-react";
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

  const handleNotificationSettings = () => {
    navigate('/client/settings/notifications');
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="md:hidden hover:bg-accent/50 h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium">Updates</h1>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 px-2 text-xs hover:bg-accent/50 gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationSettings}
              className="hover:bg-accent/50 h-8 w-8"
              title="Notification Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Bell className="relative h-16 w-16 text-muted-foreground/30" />
            </div>
            <h3 className="mt-6 text-lg font-medium">No updates yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              We'll notify you when there's something new
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {notifications.map((notification, index) => {
              const Icon = getIconByType(notification.icon_type);

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group w-full text-left transition-all duration-200 hover:bg-accent/30 ${
                    !notification.is_read ? "bg-primary/5" : ""
                  } ${index !== notifications.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      !notification.is_read
                        ? "bg-primary shadow-sm"
                        : "bg-muted/70"
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        !notification.is_read ? "text-primary-foreground" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <h3 className={`font-medium text-sm ${
                          !notification.is_read ? "text-foreground font-semibold" : "text-foreground/80"
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2">
                        {notification.description}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    )}
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
