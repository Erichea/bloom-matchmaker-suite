import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Heart,
  Code,
  Settings,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Logo } from "@/components/Logo";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Client Management",
    icon: Users,
    children: [
      {
        title: "All Clients",
        url: "/admin/clients",
        icon: Users,
      },
    ],
  },
  {
    title: "Matching",
    icon: Heart,
    children: [
      {
        title: "Suggest Matches",
        url: "/admin/matches/suggest",
        icon: Heart,
      },
      {
        title: "Manage Matches",
        url: "/admin/matches",
        icon: Heart,
      },
    ],
  },
  {
    title: "Access Codes",
    url: "/admin/access-codes",
    icon: Code,
  },
];

const systemMenuItems = [
  {
    title: "Translations",
    url: "/admin/translations",
    icon: Settings,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    url: "/admin/help",
    icon: HelpCircle,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<string[]>(["Client Management", "Matching"]);

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (children: { url: string }[]) => 
    children.some(child => currentPath === child.url);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const getNavClasses = (isActive: boolean) => 
    isActive 
      ? "bg-primary-muted text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border-soft">
        {/* Header */}
        <div className="p-4 border-b border-border-soft">
          {!collapsed && (
            <div className="flex flex-col space-y-1">
              <Logo size="sm" />
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <Logo size="sm" className="h-6" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children ? (
                    <Collapsible 
                      open={openGroups.includes(item.title)} 
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          className={`w-full justify-between ${
                            isGroupActive(item.children) 
                              ? "bg-primary-muted text-primary" 
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center">
                            <item.icon className="mr-2 h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && (
                            <ChevronDown 
                              className={`h-4 w-4 transition-transform ${
                                openGroups.includes(item.title) ? "rotate-180" : ""
                              }`} 
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent className="space-y-1 ml-4">
                          {item.children.map((child) => (
                            <SidebarMenuButton key={child.title} asChild>
                              <NavLink 
                                to={child.url} 
                                className={`flex items-center py-2 px-3 rounded-md text-sm ${getNavClasses(isActive(child.url))}`}
                              >
                                <child.icon className="mr-2 h-3 w-3" />
                                <span>{child.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          ))}
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center ${getNavClasses(isActive(item.url))}`}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center ${getNavClasses(isActive(item.url))}`}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
