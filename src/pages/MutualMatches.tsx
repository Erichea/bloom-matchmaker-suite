import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Heart, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import MatchDetailModal from "@/components/MatchDetailModal";
import KanbanColumn from "@/components/KanbanColumn";
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

  // DnD sensors
  const sensors = useSensors(
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
      const { data: rpcData, error } = await supabase.rpc("get_matches_with_personal_status", { p_user_id: user.id });
      if (error) throw error;

      const matchesData = rpcData || [];

      // Fetch profile_answers for each match's profile_1 and profile_2
      if (matchesData.length > 0) {
        const userIds = new Set<string>();
        matchesData.forEach((row: any) => {
          const match = row.match_data;
          if (match.profile_1?.user_id) userIds.add(match.profile_1.user_id);
          if (match.profile_2?.user_id) userIds.add(match.profile_2.user_id);
        });

        const { data: answersData } = await supabase
          .from("profile_answers")
          .select("*")
          .in("user_id", Array.from(userIds));

        // Process matches with personal status
        const processedMatches = matchesData.map((row: any) => {
          const match = row.match_data;
          const isProfile1 = match.profile_1_id === profile?.id;
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
            personalStatus: row.personal_status,
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
  }, [user, profile?.id]);

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

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const matchId = active.id as string;
    const newStatus = over.id as string;

    // Update local state immediately for responsive UI
    setMatchesWithStatus(prev =>
      prev.map(match =>
        match.id === matchId
          ? { ...match, personalStatus: newStatus }
          : match
      )
    );

    // Update database
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
              ? { ...match, personalStatus: findOriginalStatus(matchId) }
              : match
          )
        );
      }
    } catch (error) {
      console.error('Error updating match status:', error);
      toast({
        title: "Error",
        description: "Failed to update match status.",
        variant: "destructive",
      });
    }
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
          <header className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                <Heart className="w-8 h-8 text-red-500" />
                Your Dating Journey
              </h1>
              <p className="text-lg text-muted-foreground">
                Organize your mutual matches by relationship stage
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
              <div className="space-y-6">
                {/* Kanban Board */}
                <div className="grid gap-6">
                  {KANBAN_STATUSES.map((status) => (
                    <motion.div
                      key={status.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: KANBAN_STATUSES.indexOf(status) * 0.1 }}
                    >
                      <KanbanColumn
                        title={status.title}
                        emoji={status.emoji}
                        status={status.id}
                        matches={matchesByStatus[status.id] || []}
                        onMatchClick={handleOpenMatch}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
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