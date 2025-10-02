import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Heart, TrendingUp, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardStats {
  totalClients: number;
  pendingApproval: number;
  activeProfiles: number;
  successfulMatches: number;
}

interface RecentProfile {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  updated_at: string;
  photo_url?: string;
}

interface RecentUpdate {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  updated_at: string;
  photo_url?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    pendingApproval: 0,
    activeProfiles: 0,
    successfulMatches: 0,
  });
  const [recentProfiles, setRecentProfiles] = useState<RecentProfile[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get total clients count
        const { count: totalCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .is("deleted_at", null);

        // Get pending approval count
        const { count: pendingCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending_approval")
          .is("deleted_at", null);

        // Get active profiles count
        const { count: activeCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved")
          .is("deleted_at", null);

        // Get successful matches (both_accepted) count
        const { count: matchesCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("match_status", "both_accepted");

        setStats({
          totalClients: totalCount || 0,
          pendingApproval: pendingCount || 0,
          activeProfiles: activeCount || 0,
          successfulMatches: matchesCount || 0,
        });

        // Get recently updated profiles
        const { data: updatedProfiles } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name,
            last_name,
            status,
            updated_at,
            profile_photos (
              photo_url,
              is_primary
            )
          `)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(10);

        if (updatedProfiles) {
          const updatesWithPhotos = updatedProfiles.map((profile: any) => {
            const primaryPhoto = profile.profile_photos?.find((p: any) => p.is_primary);
            const photoUrl = primaryPhoto?.photo_url || profile.profile_photos?.[0]?.photo_url;

            return {
              id: profile.id,
              first_name: profile.first_name || "Unknown",
              last_name: profile.last_name || "",
              status: profile.status,
              updated_at: profile.updated_at,
              photo_url: photoUrl,
            };
          });
          setRecentUpdates(updatesWithPhotos);
        }

        // Get recently viewed profiles by current admin
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser) {
          const { data: viewedProfiles, error: viewError } = await supabase
            .from("profile_views")
            .select(`
              viewed_at,
              profile:profiles (
                id,
                first_name,
                last_name,
                status,
                updated_at,
                profile_photos (
                  photo_url,
                  is_primary
                )
              )
            `)
            .eq("admin_user_id", currentUser.id)
            .order("viewed_at", { ascending: false })
            .limit(10);

          if (viewError) {
            console.error("Error fetching viewed profiles:", viewError);
          } else if (viewedProfiles) {
            console.debug("Fetched viewed profiles:", viewedProfiles);
            const profilesWithPhotos = viewedProfiles
              .filter((vp: any) => vp.profile) // Filter out null profiles
              .map((vp: any) => {
                const profile = vp.profile;
                const primaryPhoto = profile.profile_photos?.find((p: any) => p.is_primary);
                const photoUrl = primaryPhoto?.photo_url || profile.profile_photos?.[0]?.photo_url;

                return {
                  id: profile.id,
                  first_name: profile.first_name || "Unknown",
                  last_name: profile.last_name || "",
                  status: profile.status,
                  updated_at: vp.viewed_at, // Use viewed_at instead of updated_at
                  photo_url: photoUrl,
                };
              });
            setRecentProfiles(profilesWithPhotos);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const statsConfig = [
    {
      title: "Total Clients",
      value: stats.totalClients.toString(),
      icon: Users,
      description: "Active client base",
      color: "text-primary"
    },
    {
      title: "Pending Approval",
      value: stats.pendingApproval.toString(),
      icon: UserX,
      description: "Profiles awaiting review",
      color: "text-warning"
    },
    {
      title: "Active Profiles",
      value: stats.activeProfiles.toString(),
      icon: UserCheck,
      description: "Approved and matching",
      color: "text-success"
    },
    {
      title: "Successful Matches",
      value: stats.successfulMatches.toString(),
      icon: Heart,
      description: "Both accepted",
      color: "text-accent"
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back!
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's what's happening with your matchmaking business today.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsConfig.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? "..." : stat.value}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Profile Updates */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Recent Profile Updates
              </CardTitle>
              <CardDescription>Latest profile changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Loading...</p>
                ) : recentUpdates.slice(0, 5).map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => navigate(`/admin/clients/${profile.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border-soft hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        {profile.photo_url ? (
                          <AvatarImage src={profile.photo_url} alt={profile.first_name} />
                        ) : (
                          <AvatarFallback className="bg-primary-muted text-primary">
                            {profile.first_name[0]}{profile.last_name[0] || ""}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">Profile updated</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{getTimeAgo(profile.updated_at)}</p>
                      <Badge
                        className={`mt-1 ${
                          profile.status === 'pending_approval' ? 'badge-warning' :
                          profile.status === 'approved' ? 'badge-success' :
                          profile.status === 'rejected' ? 'badge-error' :
                          'badge-neutral'
                        }`}
                      >
                        {profile.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recently Viewed Client Profiles */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5 text-accent" />
                Recently Viewed Profiles
              </CardTitle>
              <CardDescription>Profiles you've recently opened</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Loading...</p>
                ) : recentProfiles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No profiles viewed yet. Open a client profile to see it here.
                  </p>
                ) : recentProfiles.slice(0, 5).map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => navigate(`/admin/clients/${profile.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border-soft hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        {profile.photo_url ? (
                          <AvatarImage src={profile.photo_url} alt={profile.first_name} />
                        ) : (
                          <AvatarFallback className="bg-primary-muted text-primary">
                            {profile.first_name[0]}{profile.last_name[0] || ""}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">Viewed {getTimeAgo(profile.updated_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={`${
                          profile.status === 'pending_approval' ? 'badge-warning' :
                          profile.status === 'approved' ? 'badge-success' :
                          profile.status === 'rejected' ? 'badge-error' :
                          'badge-neutral'
                        }`}
                      >
                        {profile.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;