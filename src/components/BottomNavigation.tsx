import { Home, Bell, User, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { InteractiveMenu, InteractiveMenuItem } from "@/components/ui/modern-mobile-menu";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkBackground, setIsDarkBackground] = useState(true);
  const navRef = useRef<HTMLDivElement>(null);

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

  // Detect background color and adjust menu styling
  useEffect(() => {
    const detectBackgroundColor = () => {
      if (!navRef.current) return;

      const element = navRef.current.parentElement || document.body;
      const bgColor = window.getComputedStyle(element).backgroundColor;

      // Parse RGB values
      const rgb = bgColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const [r, g, b] = rgb.map(Number);
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        setIsDarkBackground(luminance < 0.5);
      }
    };

    detectBackgroundColor();

    // Re-detect on route change
    const timer = setTimeout(detectBackgroundColor, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const navPaths = useMemo(() => [
    "/client/dashboard",
    "/client/updates",
    "/client/profile",
    "/client/settings/notifications",
  ], []);

  const menuItems: InteractiveMenuItem[] = useMemo(() => [
    { label: "Home", icon: Home },
    { label: "Updates", icon: Bell, badge: unreadCount },
    { label: "Profile", icon: User },
    { label: "Settings", icon: Settings },
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
      ref={navRef}
      className={`adaptive-bottom-nav fixed bottom-0 left-0 right-0 z-50 ${isDarkBackground ? 'dark-bg' : 'light-bg'}`}
    >
      <div className="mx-auto max-w-md">
        <InteractiveMenu
          items={menuItems}
          accentColor={isDarkBackground ? "white" : "black"}
          activeIndex={activeIndex}
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  );
};
