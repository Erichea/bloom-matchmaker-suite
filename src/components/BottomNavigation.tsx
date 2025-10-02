import { Home, Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InteractiveMenu, InteractiveMenuItem } from "@/components/ui/modern-mobile-menu";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();

    if (!user) return;

    // Subscribe to changes
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount]);

  const navPaths = useMemo(() => [
    "/client/dashboard",
    "/client/updates",
    "/client/profile",
  ], []);

  const menuItems: InteractiveMenuItem[] = useMemo(() => [
    { label: "Home", icon: Home },
    { label: "Updates", icon: Bell, badge: unreadCount },
    { label: "Profile", icon: User },
  ], [unreadCount]);

  const handleItemClick = useCallback((index: number) => {
    navigate(navPaths[index]);
  }, [navigate, navPaths]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border">
      <div className="mx-auto max-w-md">
        <InteractiveMenu
          items={menuItems}
          accentColor="hsl(var(--brand-primary))"
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  );
};
