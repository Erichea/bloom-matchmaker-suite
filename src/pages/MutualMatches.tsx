import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { Heart, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import MatchDetailModal from "@/components/MatchDetailModal";
import ImprovedKanbanColumn from "@/components/ImprovedKanbanColumn";
import CompactMatchCard from "@/components/CompactMatchCard";
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
}

interface ProfilePhoto {
  photo_url: string;
  is_primary: boolean | null;
  order_index: number | null;
  created_at?: string | null;
}

// Kanban status definitions
const KANBAN_STATUSES = [
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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Enhanced DnD sensors for better mobile and desktop support
  const sensors = useSensors(
    // Mouse sensor for desktop
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    // Touch sensor for mobile with long-press to avoid accidental drags
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms long-press before drag starts
        tolerance: 8, // Allow slight movement during long-press
      },
    }),
    // Pointer sensor as fallback
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
      setLoading(false);
    }
  }, [user, toast]);

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    try {
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

  const currentProfileId = profile?.id ?? null;

  // Enhanced drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Add haptic feedback on supported devices (optional)
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Short vibration for drag start
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const matchId = active.id as string;
    const newStatus = over.id as string;

    // Prevent moving to the same status
    const currentMatch = matchesWithStatus.find(m => m.id === matchId);
    if (currentMatch?.personalStatus === newStatus) return;

    // Optimistic update - update UI immediately
    const originalStatus = currentMatch?.personalStatus || 'to_discuss';
    setMatchesWithStatus(prev =>
      prev.map(match =>
        match.id === matchId
          ? { ...match, personalStatus: newStatus }
          : match
      )
    );

    // Update database with error handling
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
        // Success feedback
        toast({
          title: "Status Updated",
          description: `Moved to ${KANBAN_STATUSES.find(s => s.id === newStatus)?.title}`,
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

  // Get active drag item data for overlay
  const getActiveDragItem = () => {
    if (!activeId) return null;
    return matchesWithStatus.find(match => match.id === activeId);
  };

  const findOriginalStatus = (matchId: string): string => {
    const match = matchesWithStatus.find(m => m.id === matchId);
    return match?.personalStatus || 'to_discuss';
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

  // Organize matches by status for Kanban columns
  const matchesByStatus = useMemo(() => {
    const organized: Record<string, MatchWithStatus[]> = {};

    // Initialize all statuses with empty arrays
    KANBAN_STATUSES.forEach(status => {
      organized[status.id] = [];
    });

    // Group matches by their personal status
    matchesWithStatus.forEach(match => {
      organized[match.personalStatus]?.push(match);
    });

    return organized;
  }, [matchesWithStatus]);

  const formatAnswer = (answer: any): string => {
    if (answer === null || answer === undefined || answer === "") {
      return "";
    }
    if (Array.isArray(answer)) {
      return answer.length ? answer.join(", ") : "";
    }
    if (typeof answer === "object") {
      return JSON.stringify(answer);
    }
    return String(answer);
  };

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

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          className="h-24 w-24 rounded-full border-[3px] border-border/20 border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
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
                Your Dating Journey
              </h1>
              <p className="text-sm sm:text-base sm:text-lg text-muted-foreground">
                Drag and drop matches to organize your journey
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

          {matchesWithStatus.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Kanban Board */}
                <div className="grid gap-4 sm:gap-6">
                  {KANBAN_STATUSES.map((status) => (
                    <motion.div
                      key={status.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: KANBAN_STATUSES.indexOf(status) * 0.05 }}
                    >
                      <ImprovedKanbanColumn
                        title={status.title}
                        emoji={status.emoji}
                        status={status.id}
                        matches={matchesByStatus[status.id] || []}
                        onMatchClick={handleOpenMatch}
                        isDropTarget={activeId !== null}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Drag Overlay for visual feedback */}
              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: '0.5',
                      },
                    },
                  }),
                }}
              >
                {getActiveDragItem() ? (
                  <div className="rotate-3 scale-110">
                    <CompactMatchCard
                      id={getActiveDragItem()!.id}
                      name={getActiveDragItem()!.name}
                      photoUrl={getActiveDragItem()!.photoUrl}
                      initials={getActiveDragItem()!.initials}
                      isDragging={true}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No mutual matches yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                When both you and someone else express interest in each other, they'll appear on your personal board.
              </p>
              <Button
                onClick={() => navigate('/client/dashboard')}
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          )}
        </main>
      </div>
      <BottomNavigation />
    </>
  );
};

export default MutualMatches;