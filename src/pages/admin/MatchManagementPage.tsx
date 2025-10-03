import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Match {
  id: string;
  profile_1_id: string;
  profile_2_id: string;
  profile_1_response: string | null;
  profile_2_response: string | null;
  profile_1_feedback: string | null;
  profile_2_feedback: string | null;
  match_status: string;
  compatibility_score: number;
  suggested_at: string;
  suggested_by: string;
  profile_1: any;
  profile_2: any;
  admin_notes: string | null;
}

const getPrimaryPhotoUrl = (profile: any): string | null => {
  if (!profile) return null;
  if (profile.photo_url) return profile.photo_url;
  const photos = Array.isArray(profile.profile_photos) ? profile.profile_photos : [];
  if (!photos.length) return null;
  const sorted = [...photos].sort((a, b) => {
    if (a.is_primary === b.is_primary) {
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    }
    return a.is_primary ? -1 : 1;
  });
  return sorted[0]?.photo_url ?? null;
};

const renderProfileAvatar = (profile: any, size = "w-10 h-10") => {
  const photoUrl = getPrimaryPhotoUrl(profile);
  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((segment: string) => segment[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Avatar className={size}>
      {photoUrl ? (
        <AvatarImage src={photoUrl} alt={name || "Profile"} />
      ) : (
        <AvatarFallback>{initials}</AvatarFallback>
      )}
    </Avatar>
  );
};

const MatchManagementPage = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMatches: 0,
    pendingMatches: 0,
    mutualMatches: 0,
    rejectedMatches: 0,
    acceptanceRate: 0
  });

  const calculateStats = useCallback((matchesData: Match[]) => {
    const total = matchesData.length;
    const pending = matchesData.filter(m =>
      m.match_status === 'pending' ||
      m.match_status === 'profile_1_accepted' ||
      m.match_status === 'profile_2_accepted'
    ).length;
    const mutual = matchesData.filter(m => m.match_status === 'both_accepted').length;
    const rejected = matchesData.filter(m =>
      m.match_status === 'profile_1_rejected' ||
      m.match_status === 'profile_2_rejected' ||
      m.match_status === 'rejected'
    ).length;

    const responded = matchesData.filter(m =>
      m.profile_1_response || m.profile_2_response
    ).length;
    const accepted = matchesData.filter(m =>
      m.profile_1_response === 'accepted' || m.profile_2_response === 'accepted'
    ).length;

    const acceptanceRate = responded > 0 ? Math.round((accepted / responded) * 100) : 0;

    setStats({
      totalMatches: total,
      pendingMatches: pending,
      mutualMatches: mutual,
      rejectedMatches: rejected,
      acceptanceRate
    });
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          profile_1:profiles!matches_profile_1_id_fkey(
            *,
            profile_photos (
              id,
              photo_url,
              is_primary,
              order_index
            )
          ),
          profile_2:profiles!matches_profile_2_id_fkey(
            *,
            profile_photos (
              id,
              photo_url,
              is_primary,
              order_index
            )
          )
        `)
        .order('suggested_at', { ascending: false });

      if (error) throw error;

      setMatches(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [calculateStats, toast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const getStatusBadge = (match: Match) => {
    switch (match.match_status) {
      case 'both_accepted':
        return <Badge className="badge-success">Mutual Match ❤️</Badge>;
      case 'profile_1_accepted':
        return <Badge className="badge-warning">Profile 1 Interested</Badge>;
      case 'profile_2_accepted':
        return <Badge className="badge-warning">Profile 2 Interested</Badge>;
      case 'profile_1_rejected':
      case 'profile_2_rejected':
      case 'rejected':
        return <Badge className="badge-error">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="badge-pending">Pending Response</Badge>;
    }
  };

  const getResponseStatus = (response: string | null) => {
    if (!response) return "Pending";
    return response === 'accepted' ? "Accepted" : "Rejected";
  };

  const openDetailsModal = (match: Match) => {
    setSelectedMatch(match);
    setDetailsModalOpen(true);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteMatch = async () => {
    if (!deletingMatchId) return;

    try {
      const { data, error } = await supabase.rpc('delete_match', {
        p_match_id: deletingMatchId
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string; notifications_deleted?: number };

      if (result?.success) {
        toast({
          title: "Match deleted",
          description: `Match and ${result.notifications_deleted || 0} related notification(s) have been removed`,
        });

        // Refresh matches
        await fetchMatches();

        // Close dialogs
        setDeleteDialogOpen(false);
        setDetailsModalOpen(false);
        setDeletingMatchId(null);
      } else {
        throw new Error(result?.message || 'Failed to delete match');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete match",
        variant: "destructive"
      });
    }
  };

  const confirmDeleteMatch = (matchId: string) => {
    setDeletingMatchId(matchId);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loading-spinner-lg text-accent"></div>
      </div>
    );
  }

  const suggestedMatches = matches.filter(m => 
    m.match_status !== 'both_accepted' && m.match_status !== 'rejected'
  );
  const mutualMatches = matches.filter(m => m.match_status === 'both_accepted');
  const rejectedMatches = matches.filter(m => 
    m.match_status === 'profile_1_rejected' || 
    m.match_status === 'profile_2_rejected' || 
    m.match_status === 'rejected'
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container-app py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1>Match Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage all match suggestions and outcomes
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-semibold">{stats.totalMatches}</p>
                </div>
                <Heart className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-semibold text-warning">{stats.pendingMatches}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mutual</p>
                  <p className="text-2xl font-semibold text-success">{stats.mutualMatches}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rate</p>
                  <p className="text-2xl font-semibold text-accent">{stats.acceptanceRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="suggested" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suggested">Suggested Matches ({suggestedMatches.length})</TabsTrigger>
            <TabsTrigger value="mutual">Mutual Matches ({mutualMatches.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedMatches.length})</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="suggested">
            <Card className="card">
              <CardHeader>
                <CardTitle>Suggested Matches</CardTitle>
                <CardDescription>
                  Matches waiting for responses or partially responded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestedMatches.map((match) => (
                    <div key={match.id} className="card-interactive p-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {renderProfileAvatar(match.profile_1)}
                          <div>
                            <p className="font-medium">{match.profile_1?.first_name} {match.profile_1?.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getResponseStatus(match.profile_1_response)}
                            </p>
                          </div>
                        </div>

                        <Heart className="w-5 h-5 text-primary flex-shrink-0" />

                        <div className="flex items-center space-x-2">
                          {renderProfileAvatar(match.profile_2)}
                          <div>
                            <p className="font-medium">{match.profile_2?.first_name} {match.profile_2?.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getResponseStatus(match.profile_2_response)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {getStatusBadge(match)}
                          <p className="text-xs text-muted-foreground mt-1">
                            {match.compatibility_score}% compatible
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Suggested {formatDate(match.suggested_at)}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsModal(match)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  {suggestedMatches.length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No pending matches</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mutual">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Mutual Matches</CardTitle>
                <CardDescription>
                  Successful matches where both parties are interested
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mutualMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {renderProfileAvatar(match.profile_1)}
                          <div>
                            <p className="font-medium">{match.profile_1?.first_name} {match.profile_1?.last_name}</p>
                            <p className="text-xs text-success">Interested ❤️</p>
                          </div>
                        </div>

                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />

                        <div className="flex items-center space-x-2">
                          {renderProfileAvatar(match.profile_2)}
                          <div>
                            <p className="font-medium">{match.profile_2?.first_name} {match.profile_2?.last_name}</p>
                            <p className="text-xs text-success">Interested ❤️</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge className="badge-success">Mutual Match! 🎉</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {match.compatibility_score}% compatible
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Matched {formatDate(match.suggested_at)}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsModal(match)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  {mutualMatches.length === 0 && (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No mutual matches yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle>Rejected Matches</CardTitle>
                <CardDescription>
                  Matches where one or both parties declined
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rejectedMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {renderProfileAvatar(match.profile_1)}
                          <div>
                            <p className="font-medium">{match.profile_1?.first_name} {match.profile_1?.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getResponseStatus(match.profile_1_response)}
                            </p>
                          </div>
                        </div>

                        <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />

                        <div className="flex items-center space-x-2">
                          {renderProfileAvatar(match.profile_2)}
                          <div>
                            <p className="font-medium">{match.profile_2?.first_name} {match.profile_2?.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getResponseStatus(match.profile_2_response)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {getStatusBadge(match)}
                          <p className="text-xs text-muted-foreground mt-1">
                            {match.compatibility_score}% compatible
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Suggested {formatDate(match.suggested_at)}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsModal(match)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Feedback
                        </Button>
                      </div>
                    </div>
                  ))}
                  {rejectedMatches.length === 0 && (
                    <div className="text-center py-12">
                      <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No rejected matches</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Match Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Matches Suggested</span>
                      <span className="font-semibold">{stats.totalMatches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mutual Matches</span>
                      <span className="font-semibold text-success">{stats.mutualMatches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Responses</span>
                      <span className="font-semibold text-warning">{stats.pendingMatches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rejections</span>
                      <span className="font-semibold text-destructive">{stats.rejectedMatches}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Success Rate</span>
                      <span className="font-semibold text-primary">
                        {stats.totalMatches > 0 ? Math.round((stats.mutualMatches / stats.totalMatches) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Compatibility Score</span>
                      <span className="font-semibold">
                        {matches.length > 0 
                          ? Math.round(matches.reduce((sum, m) => sum + (m.compatibility_score || 0), 0) / matches.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Rate</span>
                      <span className="font-semibold">
                        {stats.totalMatches > 0 
                          ? Math.round(((stats.mutualMatches + stats.rejectedMatches) / stats.totalMatches) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Acceptance Rate (of responses)</span>
                      <span className="font-semibold text-success">{stats.acceptanceRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Match Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => confirmDeleteMatch(selectedMatch?.id || '')}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Match
                </Button>
              </DialogTitle>
              <DialogDescription>
                View complete information about this match suggestion
              </DialogDescription>
            </DialogHeader>

            {selectedMatch && (
              <div className="space-y-6">
                {/* Match Overview */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {renderProfileAvatar(selectedMatch.profile_1, "w-12 h-12")}
                    <div>
                      <p className="font-semibold">{selectedMatch.profile_1?.first_name} {selectedMatch.profile_1?.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedMatch.profile_1?.date_of_birth && 
                          `Age ${calculateAge(selectedMatch.profile_1.date_of_birth)}`
                        } • {selectedMatch.profile_1?.city}, {selectedMatch.profile_1?.country}
                      </p>
                    </div>
                  </div>

                  <Heart className="w-6 h-6 text-primary" />

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">{selectedMatch.profile_2?.first_name} {selectedMatch.profile_2?.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedMatch.profile_2?.date_of_birth && 
                          `Age ${calculateAge(selectedMatch.profile_2.date_of_birth)}`
                        } • {selectedMatch.profile_2?.city}, {selectedMatch.profile_2?.country}
                      </p>
                    </div>
                    {renderProfileAvatar(selectedMatch.profile_2, "w-12 h-12")}
                  </div>
                </div>

                {/* Match Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Match Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Compatibility Score:</span>
                        <span className="font-medium">{selectedMatch.compatibility_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Suggested:</span>
                        <span>{formatDate(selectedMatch.suggested_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        {getStatusBadge(selectedMatch)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Response Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{selectedMatch.profile_1?.first_name}:</span>
                        <span className={
                          selectedMatch.profile_1_response === 'accepted' ? 'text-success' :
                          selectedMatch.profile_1_response === 'rejected' ? 'text-destructive' :
                          'text-muted-foreground'
                        }>
                          {getResponseStatus(selectedMatch.profile_1_response)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{selectedMatch.profile_2?.first_name}:</span>
                        <span className={
                          selectedMatch.profile_2_response === 'accepted' ? 'text-success' :
                          selectedMatch.profile_2_response === 'rejected' ? 'text-destructive' :
                          'text-muted-foreground'
                        }>
                          {getResponseStatus(selectedMatch.profile_2_response)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                {(selectedMatch.profile_1_feedback || selectedMatch.profile_2_feedback) && (
                  <div>
                    <h4 className="font-semibold mb-2">Feedback</h4>
                    <div className="space-y-3">
                      {selectedMatch.profile_1_feedback && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium">{selectedMatch.profile_1?.first_name}:</p>
                          <p className="text-sm text-muted-foreground">{selectedMatch.profile_1_feedback}</p>
                        </div>
                      )}
                      {selectedMatch.profile_2_feedback && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm font-medium">{selectedMatch.profile_2?.first_name}:</p>
                          <p className="text-sm text-muted-foreground">{selectedMatch.profile_2_feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Information for mutual matches */}
                {selectedMatch.match_status === 'both_accepted' && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <h4 className="font-semibold mb-2 text-success">🎉 Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">{selectedMatch.profile_1?.first_name}</p>
                        <p>Email: {selectedMatch.profile_1?.email}</p>
                        {selectedMatch.profile_1?.phone && (
                          <p>Phone: {selectedMatch.profile_1.phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{selectedMatch.profile_2?.first_name}</p>
                        <p>Email: {selectedMatch.profile_2?.email}</p>
                        {selectedMatch.profile_2?.phone && (
                          <p>Phone: {selectedMatch.profile_2.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Match?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this match suggestion and all related notifications.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingMatchId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMatch}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Match
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MatchManagementPage;
