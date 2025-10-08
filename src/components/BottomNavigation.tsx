import { Home, Heart, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  label: string;
  icon: React.ElementType<{ className?: string }>;
  badge?: number;
}

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // No need to detect background color for the new design

  const navPaths = useMemo(() => [
    "/client/dashboard",
    "/client/updates",
    "/client/profile",
  ], []);

  const menuItems: MenuItem[] = useMemo(() => [
    { label: "Home", icon: Home },
    { label: "Updates", icon: Heart, badge: unreadCount },
    { label: "Profile", icon: User },
  ], [unreadCount]);

  const activeIndex = useMemo(() => {
    const index = navPaths.findIndex(path => path === location.pathname);
    return index >= 0 ? index : 0;
  }, [location.pathname, navPaths]);

  const handleItemClick = useCallback((index: number) => {
    navigate(navPaths[index]);
  }, [navigate, navPaths]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-transparent"
    >
      <nav className="bg-card rounded-full p-2 flex justify-around items-center max-w-xs mx-auto shadow-sm">
        {menuItems.map((item, index) => {
          const isActive = index === activeIndex;
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.label}
              onClick={() => handleItemClick(index)}
              className={`p-3 rounded-full transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-destructive-foreground">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
