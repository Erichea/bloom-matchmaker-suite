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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="md:hidden hover:bg-accent/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Updates</h1>
            {unreadCount > 0 && (
              <div className="flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <span className="text-xs font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-9 px-3 text-xs hover:bg-accent/50"
              >
                <CheckCheck className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-accent/50"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Bell className="relative h-20 w-20 text-muted-foreground/30" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">No updates yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              We'll notify you when there's something new
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = getIconByType(notification.icon_type);

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group w-full rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                    !notification.is_read
                      ? "bg-gradient-to-br from-primary/5 via-background to-background border-primary/20 shadow-md shadow-primary/5"
                      : "bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80"
                  }`}
                >
                  <div className="flex items-start gap-4 p-4">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                      !notification.is_read
                        ? "bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25"
                        : "bg-muted/50 group-hover:bg-primary/10"
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        !notification.is_read ? "text-primary-foreground" : "text-primary"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className={`font-semibold leading-snug ${
                          !notification.is_read ? "text-foreground" : "text-foreground/90"
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary mt-1.5 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {notification.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
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
