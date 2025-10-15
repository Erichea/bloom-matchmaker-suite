import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Home, Search, ChevronLeft, ChevronRight } from "lucide-react";

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

  // Handle status change with arrow buttons
  const handleStatusChange = async (matchId: string, direction: 'prev' | 'next') => {
    const currentMatch = matchesWithStatus.find(m => m.id === matchId);
    if (!currentMatch) return;

    const currentIndex = MATCH_STATUSES.findIndex(status => status.id === currentMatch.personalStatus);
    const newIndex = direction === 'next' ?
      Math.min(currentIndex + 1, MATCH_STATUSES.length - 1) :
      Math.max(currentIndex - 1, 0);

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
      } else {
        toast({
          title: "Status Updated",
          description: `Moved to ${MATCH_STATUSES[newIndex].title}`,
          duration: 2000,
        });
      }
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

  if (authLoading || loading || matchesLoading) {
    return (
      <div className="bg-background text-foreground min-h-screen flex flex-col p-4 pb-32">
        <main className="flex-grow">
          <header className="flex justify-between items-start mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                Match List
              </h1>
              <p className="text-sm sm:text-base sm:text-lg text-muted-foreground">
                View and manage your matches
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
          </header>

          {/* Search and Sort Controls Skeleton */}
          <div className="mb-6 space-y-4">
            <div className="h-10 bg-muted rounded-lg animate-pulse" />
            <div className="h-10 bg-muted rounded-lg w-48 animate-pulse" />
          </div>

          {/* Match List Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="h-6 bg-muted rounded animate-pulse mb-2 w-32" />
                      <div className="h-4 bg-muted rounded animate-pulse w-24" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className="w-3 h-3 bg-muted rounded-full animate-pulse" />
                      ))}
                    </div>
                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="mt-3 h-4 bg-muted rounded animate-pulse w-32 mx-auto" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <MatchDetailModal match={selectedMatch} open={modalOpen} onOpenChange={setModalOpen} onMatchResponse={handleMatchResponse} />
      <div className="bg-background text-foreground min-h-screen flex flex-col p-4 pb-32">
        <main className="flex-grow">
          <header className="flex justify-between items-start mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-2">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                Match List
              </h1>
              <p className="text-sm sm:text-base sm:text-lg text-muted-foreground">
                View and manage your matches
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden">
              {profilePhotoUrl ? (
                <img
                  alt="User profile picture"
                  className="w-full h-full object-cover"
                  src={profilePhotoUrl}
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-semibold">
                  {userInitials}
                </div>
              )}
            </div>
          </header>

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
          <AnimatePresence mode="wait">
            {filteredAndSortedMatches.length > 0 ? (
              <motion.div
                key="match-list"
                className="space-y-4"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filteredAndSortedMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05 // Stagger animations by 50ms
                    }}
                    className="bg-card border rounded-2xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handleOpenMatch(match.id)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left Section - Match Info */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {match.photoUrl ? (
                            <img
                              src={match.photoUrl}
                              alt={match.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-muted-foreground">
                                {match.initials}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-foreground truncate">
                            {match.firstName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Matched on {formatMatchDate(match.matchDate)}
                          </p>
                        </div>
                      </div>

                      {/* Right Section - Stage Progression */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(match.id, 'prev');
                          }}
                          disabled={MATCH_STATUSES.findIndex(s => s.id === match.personalStatus) === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center space-x-1">
                          {MATCH_STATUSES.map((status, index) => {
                            const currentIndex = MATCH_STATUSES.findIndex(s => s.id === match.personalStatus);
                            const isActive = status.id === match.personalStatus;
                            const isCompleted = index < currentIndex;

                            return (
                              <div key={status.id} className="flex items-center">
                                <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                                  isActive
                                    ? 'border-primary bg-primary'
                                    : isCompleted
                                      ? 'border-primary bg-primary/50'
                                      : 'border-muted bg-background'
                                }`} />

                                {index < MATCH_STATUSES.length - 1 && (
                                  <div className={`w-8 h-0.5 transition-all duration-300 ${
                                    index < currentIndex
                                      ? 'bg-primary'
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
                          disabled={MATCH_STATUSES.findIndex(s => s.id === match.personalStatus) === MATCH_STATUSES.length - 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Current Status Display */}
                    <div className="mt-3 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {MATCH_STATUSES.find(s => s.id === match.personalStatus)?.emoji} {MATCH_STATUSES.find(s => s.id === match.personalStatus)?.title}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
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
          </AnimatePresence>
        </main>
      </div>
      <BottomNavigation />
    </>
  );
};

export default MutualMatches;