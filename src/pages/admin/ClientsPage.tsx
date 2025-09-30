import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  UserCheck,
  UserX,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ClientsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    thisMonth: 0
  });

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setClients(data || []);

      // Calculate stats
      const now = new Date();
      const thisMonth = data?.filter(p => {
        const created = new Date(p.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length || 0;

      setStats({
        total: data?.length || 0,
        pending: data?.filter(p => p.status === 'pending_approval').length || 0,
        approved: data?.filter(p => p.status === 'approved').length || 0,
        thisMonth
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleApprove = async (profileId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('approve_profile', {
          p_profile_id: profileId,
          p_admin_id: user.id
        });

      if (error) throw error;

      if ((data as any)?.success) {
        toast({
          title: "Profile Approved",
          description: "The profile has been approved successfully."
        });
        fetchClients();
      } else {
        toast({
          title: "Error",
          description: (data as any)?.message || "Failed to approve profile",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve profile",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (profileId: string, reason: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('reject_profile', {
          p_profile_id: profileId,
          p_admin_id: user.id,
          p_rejection_reason: reason
        });

      if (error) throw error;

      if ((data as any)?.success) {
        toast({
          title: "Profile Rejected",
          description: "The profile has been rejected and the user will be notified."
        });
        fetchClients();
      } else {
        toast({
          title: "Error",
          description: (data as any)?.message || "Failed to reject profile",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject profile",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="badge-success">Approved</Badge>;
      case "pending_approval":
        return <Badge className="badge-warning">Pending Review</Badge>;
      case "rejected":
        return <Badge className="badge-error">Rejected</Badge>;
      case "incomplete":
        return <Badge className="badge-pending">Incomplete</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const filteredClients = clients.filter(client => {
    const name = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
                         (client.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesGender = genderFilter === "all" || client.gender === genderFilter;

    return matchesSearch && matchesStatus && matchesGender;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loading-spinner-lg text-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-app py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1>Client Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage all client profiles and their approval status
            </p>
          </div>
          <Button className="btn-accent w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-semibold text-warning">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-semibold text-success">{stats.approved}</p>
                </div>
                <UserCheck className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-semibold text-accent">+{stats.thisMonth}</p>
                </div>
                <Plus className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="card">
          <CardHeader>
            <CardTitle>Client List</CardTitle>
            <CardDescription>Search and filter through your client database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending_approval">Pending Review</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client List */}
            <div className="space-y-3 mt-6">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No clients found</p>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const name = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed';
                  const initials = name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase();
                  const location = [client.city, client.country]
                    .filter(Boolean)
                    .join(', ') || 'Location not set';

                  return (
                    <div key={client.id} className="card-interactive p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-semibold text-accent">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{client.email || 'No email'}</p>
                            <p className="text-sm text-muted-foreground truncate">{location}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusBadge(client.status)}
                              {client.completion_percentage !== null && (
                                <span className="text-sm text-muted-foreground hidden sm:inline">
                                  {client.completion_percentage}% complete
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(client.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              {client.status === 'pending_approval' && (
                                <>
                                  <DropdownMenuItem
                                    className="text-success"
                                    onClick={() => handleApprove(client.id)}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Approve Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      const reason = prompt('Please provide a reason for rejection:');
                                      if (reason) {
                                        handleReject(client.id, reason);
                                      }
                                    }}
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Reject Profile
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientsPage;
