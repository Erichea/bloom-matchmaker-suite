import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Home, Search, ChevronLeft, ChevronRight, Instagram } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MatchDetailModal from "@/components/MatchDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";

interface Match {
  id: string;
  profile_1_id: string;
  profile_2_id: string;
  profile_1_response: string | null;
  profile_2_response: string | null;
  match_status: string;
  compatibility_score: number;
  suggested_at: string;
  viewed_by_profile_1: boolean;
  viewed_by_profile_2: boolean;
  profile_1: any;
  profile_2: any;
  current_profile_id?: string;
}

interface MatchWithStatus {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  photoUrl?: string;
  compatibility: number;
  matchDate: string;
  profile: any;
  personalStatus: string;
  fullMatchData?: any;
}

interface ProfilePhoto {
  photo_url: string;
  is_primary: boolean | null;
  order_index: number | null;
  created_at?: string | null;
}

// Match status definitions for stage progression
const MATCH_STATUSES = [
  { id: 'to_discuss', title: 'To Discuss', emoji: '🗨️' },
  { id: 'chatting', title: 'Chatting', emoji: '💬' },
  { id: 'date_planned', title: 'Date Planned', emoji: '📅' },
  { id: 'dating', title: 'Dating', emoji: '❤️' },
  { id: 'ended', title: 'Ended', emoji: '🔚' },
] as const;

const MutualMatches = () => {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [matchesWithStatus, setMatchesWithStatus] = useState<MatchWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical">("recent");

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, profile_photos ( photo_url, is_primary, order_index, created_at )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      const profileData = (data && data[0]) || null;
      setProfile(profileData);

      // Set profile photo
      if (profileData?.profile_photos && Array.isArray(profileData.profile_photos) && profileData.profile_photos.length > 0) {
        const primary = [...profileData.profile_photos]
          .sort((a: ProfilePhoto, b: ProfilePhoto) => {
            const primaryRankA = a.is_primary ? 0 : 1;
            const primaryRankB = b.is_primary ? 0 : 1;
            if (primaryRankA !== primaryRankB) return primaryRankA - primaryRankB;
            return (a.order_index ?? 0) - (b.order_index ?? 0);
          })[0];
        setProfilePhotoUrl(primary?.photo_url ?? null);
      } else if (profileData?.id) {
        const { data: photoData } = await supabase
          .from("profile_photos")
          .select("photo_url, is_primary, order_index, created_at")
          .eq("profile_id", profileData.id)
          .order("is_primary", { ascending: false })
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(1);

        if (photoData && photoData.length > 0) {
          setProfilePhotoUrl(photoData[0].photo_url);
        } else {
          setProfilePhotoUrl(null);
        }
      } else {
        setProfilePhotoUrl(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      });
    } finally {
      // Only set profile loading to false, let matches loading handle its own state
    }
  }, [user, toast]);

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    try {
      setMatchesLoading(true);
      // First try to use the original working function
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_matches_for_user" as any, { p_user_id: user.id });

      if (rpcError) {
        console.error("RPC error:", rpcError);
        setMatchesWithStatus([]);
        return;
      }

      let data = rpcData ? (rpcData as any[]).map((row: any) => row.match_data) : [];

      // Filter only mutual matches (both accepted)
      const userProfileData = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (userProfileData.error) throw userProfileData.error;

      const userProfile = userProfileData.data?.[0];
      if (!userProfile) return;

      const mutualMatchesData = data.filter((match: any) => {
        const isProfile1 = match.profile_1_id === userProfile.id;
        const currentUserResponse = isProfile1 ? match.profile_1_response : match.profile_2_response;
        const otherUserResponse = isProfile1 ? match.profile_2_response : match.profile_1_response;

        return match.match_status === "both_accepted" ||
               (currentUserResponse === "accepted" && otherUserResponse === "accepted");
      });

      // Fetch profile_answers for each match's profile_1 and profile_2
      if (mutualMatchesData.length > 0) {
        const userIds = new Set<string>();
        mutualMatchesData.forEach((match: any) => {
          if (match.profile_1?.user_id) userIds.add(match.profile_1.user_id);
          if (match.profile_2?.user_id) userIds.add(match.profile_2.user_id);
        });

        const { data: answersData } = await supabase
          .from("profile_answers")
          .select("*")
          .in("user_id", Array.from(userIds));

        // Fetch personal status for each match
        const matchIds = mutualMatchesData.map((match: any) => match.id);
        const { data: statusData } = await supabase
          .from("match_status_tracking")
          .select("match_id, status")
          .eq("user_id", user.id)
          .in("match_id", matchIds);

        // Create a map of match_id -> status for quick lookup
        const statusMap = new Map();
        statusData?.forEach((status: any) => {
          statusMap.set(status.match_id, status.status);
        });

        // Find matches that don't have personal status and create default entries
        const matchesWithoutStatus = matchIds.filter(matchId => !statusMap.has(matchId));
        if (matchesWithoutStatus.length > 0) {
          await supabase
            .from("match_status_tracking")
            .upsert(
              matchesWithoutStatus.map(matchId => ({
                user_id: user.id,
                match_id: matchId,
                status: 'to_discuss'
              })),
              { onConflict: 'user_id,match_id' }
            );

          // Add default statuses to the map
          matchesWithoutStatus.forEach(matchId => {
            statusMap.set(matchId, 'to_discuss');
          });
        }

        // Process matches with personal status
        const processedMatches = mutualMatchesData.map((match: any) => {
          const isProfile1 = match.profile_1_id === userProfile.id;
          const other = isProfile1 ? match.profile_2 : match.profile_1;
          const name = other ? `${other.first_name ?? ""} ${other.last_name ?? ""}`.trim() : "Match";
          const initials = name.split(" ").map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
          const avatarUrl = other?.photo_url || (Array.isArray(other?.photos) && other.photos[0]?.photo_url) || undefined;

          return {
            id: match.id,
            name,
            firstName: name.split(' ')[0],
            initials,
            photoUrl: avatarUrl,
            compatibility: match.compatibility_score,
            matchDate: match.suggested_at,
            profile: {
              ...other,
              profile_answers: answersData?.filter((a: any) => a.user_id === other?.user_id) || []
            },
            personalStatus: statusMap.get(match.id) || 'to_discuss',
            // Store full match data for modal
            fullMatchData: {
              ...match,
              profile_1: {
                ...match.profile_1,
                profile_answers: answersData?.filter((a: any) => a.user_id === match.profile_1?.user_id) || []
              },
              profile_2: {
                ...match.profile_2,
                profile_answers: answersData?.filter((a: any) => a.user_id === match.profile_2?.user_id) || []
              }
            }
          };
        });

        setMatchesWithStatus(processedMatches);
      } else {
        setMatchesWithStatus([]);
      }
    } catch (error: any) {
      console.error("Error fetching matches:", error);
      setMatchesWithStatus([]);
    } finally {
      setMatchesLoading(false);
      setLoading(false); // Set main loading to false only after both profile and matches are loaded
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!session && !user) {
      navigate("/auth");
      return;
    }

    const loadData = async () => {
      await fetchProfile();
      await fetchMatches();
    };

    loadData();
  }, [user, session, authLoading, navigate, fetchProfile, fetchMatches]);

  // Handle status change with arrow buttons or direct dot clicks
  const handleStatusChange = async (matchId: string, direction: 'prev' | 'next' | number) => {
    const currentMatch = matchesWithStatus.find(m => m.id === matchId);
    if (!currentMatch) return;

    const currentIndex = MATCH_STATUSES.findIndex(status => status.id === currentMatch.personalStatus);

    let newIndex: number;
    if (typeof direction === 'number') {
      // Direct click on dot
      newIndex = direction;
    } else {
      // Arrow navigation
      newIndex = direction === 'next' ?
        Math.min(currentIndex + 1, MATCH_STATUSES.length - 1) :
        Math.max(currentIndex - 1, 0);
    }

    const newStatus = MATCH_STATUSES[newIndex].id;

    if (newStatus === currentMatch.personalStatus) return;

    // Optimistic update
    const originalStatus = currentMatch.personalStatus;
    setMatchesWithStatus(prev =>
      prev.map(match =>
        match.id === matchId
          ? { ...match, personalStatus: newStatus }
          : match
      )
    );

    try {
      const { error } = await supabase
        .from("match_status_tracking")
        .upsert({
          user_id: user!.id,
          match_id: matchId,
          status: newStatus,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,match_id'
        });

      if (error) {
        console.error('Error updating match status:', error);
        toast({
          title: "Error",
          description: "Failed to update match status.",
          variant: "destructive",
        });
        // Revert on error
        setMatchesWithStatus(prev =>
          prev.map(match =>
            match.id === matchId
              ? { ...match, personalStatus: originalStatus }
              : match
          )
        );
      }
      // No success toast - silent update for smooth UX
    } catch (error) {
      console.error('Error updating match status:', error);
      toast({
        title: "Error",
        description: "Failed to update match status.",
        variant: "destructive",
      });
      // Revert on error
      setMatchesWithStatus(prev =>
        prev.map(match =>
          match.id === matchId
            ? { ...match, personalStatus: originalStatus }
            : match
        )
      );
    }
  };

  const handleOpenMatch = useCallback((matchId: string) => {
    const matchWithStatus = matchesWithStatus.find((item) => item.id === matchId);
    if (matchWithStatus?.fullMatchData) {
      setSelectedMatch({
        ...matchWithStatus.fullMatchData,
        current_profile_id: profile?.id,
      });
      setModalOpen(true);
    }
  }, [matchesWithStatus, profile?.id]);

  const handleMatchResponse = () => {
    fetchMatches();
  };

  // Filter and sort matches
  const filteredAndSortedMatches = useMemo(() => {
    let filtered = matchesWithStatus;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(match =>
        match.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === "recent") {
      filtered = [...filtered].sort((a, b) =>
        new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
      );
    } else if (sortBy === "alphabetical") {
      filtered = [...filtered].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return filtered;
  }, [matchesWithStatus, searchQuery, sortBy]);

  const formatMatchDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Compact date format for top-right corner
  const formatCompactDate = (dateString?: string) => {
    if (!dateString) return "now";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) return "now";
      return `${diffHours}h ago`;
    }
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
  };

  const userInitials = useMemo(() => {
    const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
    if (name) {
      return name
        .split(" ")
        .filter(Boolean)
        .map((segment) => segment[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "B";
  }, [profile?.first_name, profile?.last_name, user?.email]);

  // Extract Instagram handle from profile answers
  const getInstagramHandle = (profileAnswers: any[]) => {
    const instagramAnswer = profileAnswers.find(answer => answer.question_id === 'instagram_contact');
    if (instagramAnswer?.answer) {
      let handle = instagramAnswer.answer;
      // Remove @ if present
      if (handle.startsWith('@')) {
        handle = handle.substring(1);
      }
      return handle;
    }
    return null;
  };

  if (authLoading || loading || matchesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <MatchDetailModal match={selectedMatch} open={modalOpen} onOpenChange={setModalOpen} onMatchResponse={handleMatchResponse} />
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="w-9"></div>
            <h1 className="text-lg font-semibold">Mutual Matches</h1>
            <div className="w-9"></div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">

          {/* Search and Sort Controls */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  ×
                </Button>
              )}
            </div>

            <Select value={sortBy} onValueChange={(value: "recent" | "alphabetical") => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Match List */}
          <div className="space-y-4">
            {filteredAndSortedMatches.map((match, index) => {
              const currentStatusIndex = MATCH_STATUSES.findIndex(s => s.id === match.personalStatus);
              const currentStatus = MATCH_STATUSES[currentStatusIndex];
              const instagramHandle = getInstagramHandle(match.profile.profile_answers || []);

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                  className="bg-card border rounded-2xl p-5 hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleOpenMatch(match.id)}
                >
                  {/* Top Section - Avatar, Name, and Date */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden flex-shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                        {match.photoUrl ? (
                          <img
                            src={match.photoUrl}
                            alt={match.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-base font-semibold text-primary">
                              {match.initials}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xl text-foreground truncate mb-0.5">
                          {match.firstName}
                        </h3>
                        {instagramHandle ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Instagram className="w-3.5 h-3.5" />
                            <span className="font-medium">@{instagramHandle}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No Instagram
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Compact Date in Top Right */}
                    <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      {formatCompactDate(match.matchDate)}
                    </div>
                  </div>

                  {/* Timeline Section - Centered Below */}
                  <div className="flex flex-col items-center space-y-4 pt-4 border-t border-border/50">
                    {/* Timeline with Navigation and Clickable Dots */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(match.id, 'prev');
                        }}
                        disabled={currentStatusIndex === 0}
                        className="h-8 w-8 p-0 hover:bg-primary/10 disabled:opacity-30 transition-all duration-200"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <div className="flex items-center space-x-1.5">
                        {MATCH_STATUSES.map((status, index) => {
                          const isActive = status.id === match.personalStatus;
                          const isCompleted = index < currentStatusIndex;

                          return (
                            <div key={status.id} className="flex items-center">
                              <motion.button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (status.id !== match.personalStatus) {
                                    handleStatusChange(match.id, index);
                                  }
                                }}
                                whileHover={{ scale: 1.3 }}
                                whileTap={{ scale: 0.9 }}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                  isActive
                                    ? 'bg-primary ring-4 ring-primary/20 shadow-lg shadow-primary/50'
                                    : isCompleted
                                      ? 'bg-primary/60 hover:bg-primary/80'
                                      : 'bg-muted hover:bg-muted-foreground/30 border-2 border-muted-foreground/20'
                                }`}
                              />

                              {index < MATCH_STATUSES.length - 1 && (
                                <div className={`w-8 h-0.5 transition-all duration-500 ${
                                  index < currentStatusIndex
                                    ? 'bg-gradient-to-r from-primary to-primary/60'
                                    : 'bg-muted'
                                }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(match.id, 'next');
                        }}
                        disabled={currentStatusIndex === MATCH_STATUSES.length - 1}
                        className="h-8 w-8 p-0 hover:bg-primary/10 disabled:opacity-30 transition-all duration-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Current Status Display */}
                    <motion.div
                      key={match.personalStatus}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center"
                    >
                      <span className="text-sm font-medium text-primary bg-primary/5 px-4 py-1.5 rounded-full">
                        {currentStatus?.emoji} {currentStatus?.title}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}

            {/* Empty State */}
            {filteredAndSortedMatches.length === 0 && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  {searchQuery ? "No matches found" : "No mutual matches yet"}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? "Try adjusting your search terms to find more matches."
                    : "When both you and someone else express interest in each other, they'll appear here."
                  }
                </p>
                <Button
                  onClick={() => navigate('/client/dashboard')}
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </motion.div>
            )}
          </div>
        </main>
      </div>
      <BottomNavigation />
    </>
  );
};

export default MutualMatches;