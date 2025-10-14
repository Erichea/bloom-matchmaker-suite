import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  label: string;
  icon: string;
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
    "/client/mutual-matches",
    "/client/updates",
    "/client/profile",
    "/client/settings/notifications",
  ], []);

  const menuItems: MenuItem[] = useMemo(() => [
    { label: "Home", icon: "home" },
    { label: "Matches", icon: "favorite" },
    { label: "Updates", icon: "notifications", badge: unreadCount },
    { label: "Profile", icon: "person" },
    { label: "Settings", icon: "settings" },
  ], [unreadCount]);

  const activeIndex = useMemo(() => {
    const index = navPaths.findIndex(path => location.pathname.startsWith(path));
    return index >= 0 ? index : 0;
  }, [location.pathname, navPaths]);

  const handleItemClick = useCallback((index: number) => {
    navigate(navPaths[index]);
  }, [navigate, navPaths]);

  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 bg-transparent z-10">
      <nav className="bg-nav-light dark:bg-nav-dark rounded-full p-2 flex justify-around items-center max-w-xs mx-auto shadow-nav-light dark:shadow-nav-dark">
        {menuItems.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.label}
              onClick={() => handleItemClick(index)}
              className={`relative p-3 flex flex-col items-center space-y-1 ${
                isActive ? "text-accent dark:text-accent-dark" : "text-subtle-light dark:text-subtle-dark"
              }`}>
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>{item.icon}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
