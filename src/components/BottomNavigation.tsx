import { Home, Bell, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InteractiveMenu } from "@/components/ui/interactive-menu";

export const BottomNavigation = () => {
  const location = useLocation();
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

  const navItems = useMemo(() => [
    { path: "/client/dashboard", icon: Home, label: "Home" },
    { path: "/client/updates", icon: Bell, label: "Updates", badge: unreadCount },
    { path: "/client/profile", icon: User, label: "Profile" },
  ], [unreadCount]);

  const activeIndex = useMemo(() => {
    const index = navItems.findIndex(item => item.path === location.pathname);
    return index >= 0 ? index : 0;
  }, [location.pathname, navItems]);

  const menuItems = useMemo(() => navItems.map((item) => ({
    label: item.label,
    icon: item.icon,
    badge: item.badge,
    onClick: () => navigate(item.path),
  })), [navItems, navigate]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border">
      <div className="mx-auto max-w-md">
        <InteractiveMenu
          items={menuItems}
          activeIndex={activeIndex}
          accentColor="hsl(var(--brand-primary))"
        />
      </div>
    </div>
  );
};
