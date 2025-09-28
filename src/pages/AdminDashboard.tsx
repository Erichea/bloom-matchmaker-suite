import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Heart, TrendingUp, Calendar } from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Clients",
      value: "247",
      change: "+12%",
      icon: Users,
      description: "Active client base",
      color: "text-primary"
    },
    {
      title: "Pending Approval",
      value: "18",
      change: "+3",
      icon: UserX,
      description: "Profiles awaiting review",
      color: "text-warning"
    },
    {
      title: "Active Profiles",
      value: "186",
      change: "+8%",
      icon: UserCheck,
      description: "Approved and matching",
      color: "text-success"
    },
    {
      title: "Successful Matches",
      value: "42",
      change: "+15%",
      icon: Heart,
      description: "This month",
      color: "text-accent"
    }
  ];

  const recentActivity = [
    { name: "Emma Wilson", action: "Profile completed", time: "2 min ago", status: "pending" },
    { name: "James Rodriguez", action: "Match accepted", time: "15 min ago", status: "success" },
    { name: "Sarah Chen", action: "Profile updated", time: "1 hour ago", status: "info" },
    { name: "Michael Brown", action: "Date feedback submitted", time: "2 hours ago", status: "success" },
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
          {stats.map((stat, index) => {
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
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {stat.change}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from your clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border-soft">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {activity.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{activity.name}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      <Badge 
                        className={`mt-1 ${
                          activity.status === 'pending' ? 'badge-warning' :
                          activity.status === 'success' ? 'badge-success' :
                          'badge-pending'
                        }`}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-accent" />
                This Month's Performance
              </CardTitle>
              <CardDescription>Key metrics and trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-success/10 border border-success/20">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-success">85%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div>
                  <p className="text-sm text-muted-foreground">New Registrations</p>
                  <p className="text-2xl font-bold text-primary">24</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div>
                  <p className="text-sm text-muted-foreground">Active Matches</p>
                  <p className="text-2xl font-bold text-accent">156</p>
                </div>
                <Heart className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;