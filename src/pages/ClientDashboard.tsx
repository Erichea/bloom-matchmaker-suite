import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

// Simple CSS animation instead of framer-motion for better performance
const floatAnimation = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(15px, -10px); }
  }
`;
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/experience/MatchList";
import MatchDetailModal from "@/components/MatchDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface ProfilePhoto {
  photo_url: string;
  is_primary: boolean | null;
  order_index: number | null;
  created_at?: string | null;
}

const ClientDashboard = () => {
  const { user, session, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const createBasicProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          email: user.email || null,
          status: "incomplete",
          completion_percentage: 0,
        })
        .select("*, profile_photos ( photo_url, is_primary, order_index, created_at )")
        .single();

      if (error) {
        if ((error as any)?.code === "23505") {
          const { data: existing, error: existingError } = await supabase
            .from("profiles")
            .select("*, profile_photos ( photo_url, is_primary, order_index, created_at )")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (existingError) throw existingError;
          const existingProfile = existing?.[0];
          if (existingProfile) {
            setProfile(existingProfile);
            setProfilePhotoUrl(null);
            return existingProfile;
          }
        }
        throw error;
      }
      setProfile(data);
      setProfilePhotoUrl(null);
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  const loadPrimaryProfilePhoto = useCallback(async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from("profile_photos")
        .select("photo_url, is_primary, order_index, created_at")
        .eq("profile_id", profileId)
        .order("is_primary", { ascending: false })
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setProfilePhotoUrl(data[0].photo_url);
      } else {
        setProfilePhotoUrl(null);
      }
    } catch (error) {
      console.error("Error loading profile photo:", error);
      setProfilePhotoUrl(null);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data: completionData } = await supabase.rpc("calculate_questionnaire_completion", { p_user_id: user.id });

      if (completionData !== null) {
        await supabase.from("profiles").update({ completion_percentage: completionData }).eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*, profile_photos ( photo_url, is_primary, order_index, created_at )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      let profileData = (data && data[0]) || null;

      if (!profileData) {
        profileData = await createBasicProfile();
        if (!profileData) return;
      }

      setProfile(profileData);
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
        await loadPrimaryProfilePhoto(profileData.id);
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
  }, [user, toast, createBasicProfile, loadPrimaryProfilePhoto]);

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    try {
      const { data: rpcData, error } = await supabase.rpc("get_matches_for_user" as any, { p_user_id: user.id });
      if (error) throw error;

      const data = rpcData ? (rpcData as any[]).map((row: any) => row.match_data) : [];

      const { data: userProfileData, error: userProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (userProfileError) throw userProfileError;

      const userProfile = userProfileData?.[0];
      if (!userProfile) return;

      setMatches(data || []);
      const unviewedMatches = (data || []).filter((match: Match) => {
        const isProfile1 = match.profile_1_id === userProfile.id;
        return isProfile1 ? !match.viewed_by_profile_1 : !match.viewed_by_profile_2;
      });

      if (unviewedMatches.length > 0) {
        for (const match of unviewedMatches) {
          const isProfile1 = match.profile_1_id === userProfile.id;
          await supabase
            .from("matches")
            .update({ [isProfile1 ? "viewed_by_profile_1" : "viewed_by_profile_2"]: true })
            .eq("id", match.id);
        }
      }
    } catch (error: any) {
      console.error("Error fetching matches:", error);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log("ClientDashboard: Auth still loading, waiting...");
      return;
    }

    // Only redirect if auth is done loading AND there's no session/user
    if (!session && !user) {
      console.log("ClientDashboard: No session or user, redirecting to /auth");
      navigate("/auth");
      return;
    }

    console.log("ClientDashboard: Auth complete, loading profile data");
    const loadData = async () => {
      await fetchProfile();
      await fetchMatches();
    };

    loadData();
  }, [user, session, authLoading, navigate, fetchProfile, fetchMatches]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const currentProfileId = profile?.id ?? null;

  const handleOpenMatch = useCallback((matchId: string) => {
    const match = matches.find((item) => item.id === matchId);
    if (match) {
      setSelectedMatch({
        ...match,
        current_profile_id: currentProfileId,
      });
      setModalOpen(true);
    }
  }, [matches, currentProfileId]);

  // Handle opening match from notification (query parameter)
  useEffect(() => {
    const matchId = searchParams.get('match');
    if (matchId && matches.length > 0 && !modalOpen) {
      handleOpenMatch(matchId);
      // Clear the query parameter
      setSearchParams({});
    }
  }, [searchParams, matches, modalOpen, handleOpenMatch, setSearchParams]);

  const handleMatchResponse = () => {
    fetchMatches();
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

  const categorizedMatches = useMemo(() => {
    if (!matches.length || !currentProfileId) {
      return {
        yourTurn: [],
        theirTurn: [],
        rejected: [],
        mutualMatch: [],
      };
    }

    const categories = {
      yourTurn: [] as any[],
      theirTurn: [] as any[],
      rejected: [] as any[],
      mutualMatch: [] as any[],
    };

    matches.forEach((match) => {
      const isProfile1 = match.profile_1_id === currentProfileId;
      const currentUserResponse = isProfile1 ? match.profile_1_response : match.profile_2_response;
      const otherUserResponse = isProfile1 ? match.profile_2_response : match.profile_1_response;
      const other = isProfile1 ? match.profile_2 : match.profile_1;
      const name = other ? `${other.first_name ?? ""} ${other.last_name ?? ""}`.trim() || "Untitled" : "Match";
      const avatarUrl = other?.photo_url || (Array.isArray(other?.photos) && other.photos[0]?.photo_url) || undefined;

      const matchSummary = {
        id: match.id,
        name,
        compatibility: match.compatibility_score,
        subtitle: match.suggested_at ? new Date(match.suggested_at).toLocaleDateString() : undefined,
        match: {
          ...match,
          current_profile_id: currentProfileId,
        },
        avatarUrl,
      };

      // Categorize based on responses
      if (match.match_status === "both_accepted") {
        categories.mutualMatch.push({ ...matchSummary, status: "mutual" });
      } else if (currentUserResponse === "rejected" || otherUserResponse === "rejected") {
        categories.rejected.push({ ...matchSummary, status: "inactive" });
      } else if (currentUserResponse === "accepted") {
        categories.theirTurn.push({ ...matchSummary, status: "pending" });
      } else if (!currentUserResponse) {
        categories.yourTurn.push({ ...matchSummary, status: "new" });
      }
    });

    return categories;
  }, [matches, currentProfileId]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
        <motion.div
          className="h-24 w-24 rounded-full border-[3px] border-[hsl(var(--brand-secondary))]/20 border-t-[hsl(var(--brand-primary))]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Determine the profile status
  const profileStatus = profile?.status || "incomplete";
  const completionPercentage = profile?.completion_percentage || 0;

  return (
    <>
      <style>{floatAnimation}</style>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background pb-20">
      <MatchDetailModal match={selectedMatch} open={modalOpen} onOpenChange={setModalOpen} onMatchResponse={handleMatchResponse} />

      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface to-background" />

      <header className="relative z-10 flex items-center justify-between px-6 pb-6 pt-8 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground">
            B
          </div>
          <span className="text-sm font-semibold text-foreground">
            Bloom
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            {profilePhotoUrl ? (
              <AvatarImage
                src={profilePhotoUrl}
                alt={profile?.first_name ? `${profile.first_name}'s profile photo` : "Profile photo"}
              />
            ) : (
              <AvatarFallback className="bg-secondary text-[0.65rem] uppercase tracking-[0.3em] text-foreground">
                {userInitials}
              </AvatarFallback>
            )}
          </Avatar>
          {profileStatus === "approved" && (
            <Button
              variant="ghost"
              onClick={() => navigate("/client/profile/edit")}
              className="hidden rounded-lg border border-border bg-transparent px-6 py-2 text-sm text-muted-foreground transition hover:border-ring hover:bg-secondary hover:text-foreground md:inline-flex"
            >
              Update profile
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-muted-foreground transition hover:border-ring hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-start px-6 pb-16 md:px-10">
        <motion.div
          className="mx-auto flex w-full max-w-4xl flex-col gap-10 text-center md:items-start md:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {profileStatus === "incomplete" && (
            <div className="flex flex-col gap-4">
              <span className="self-center text-sm text-muted-foreground md:self-start">
                Complete your profile
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
                {profile?.first_name ? `Welcome, ${profile.first_name}.` : "Let's get started."}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground md:max-w-xl">
                Complete your questionnaire so we can start curating perfect introductions for you.
              </p>
            </div>
          )}

          {profileStatus === "rejected" && (
            <div className="flex flex-col gap-4">
              <span className="self-center text-sm text-muted-foreground md:self-start">
                Profile needs revision
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
                {profile?.first_name ? `${profile.first_name}, let's refine your profile.` : "Update required"}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground md:max-w-xl">
                Your matchmaker has requested some changes to your profile. Please review and resubmit.
              </p>
            </div>
          )}

          {profileStatus === "pending_approval" && (
            <div className="flex flex-col gap-4">
              <span className="self-center text-sm text-muted-foreground md:self-start">
                Under review
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
                {profile?.first_name ? `Thank you, ${profile.first_name}.` : "Profile submitted"}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground md:max-w-xl">
                Your profile is being reviewed by your matchmaker. You'll be notified once approved and we start curating introductions.
              </p>
            </div>
          )}

          {profileStatus === "approved" && (
            <div className="flex flex-col gap-4">
              <span className="self-center text-sm text-muted-foreground md:self-start">
                Curated introductions
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl md:text-6xl">
                {profile?.first_name ? `Good to see you, ${profile.first_name}.` : "Your curated matches await."}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground md:max-w-xl">
                Explore new introductions as they arrive. Each dossier is prepared intentionally so you can focus on the
                connections that matter.
              </p>
              <Button
                variant="ghost"
                onClick={() => navigate("/client/profile/edit")}
                className="inline-flex w-full items-center justify-center gap-2 self-center rounded-lg border border-border bg-transparent px-6 py-3 text-sm text-muted-foreground transition hover:border-ring hover:bg-secondary hover:text-foreground md:w-auto md:self-start"
              >
                <User className="h-3.5 w-3.5" /> Update profile preferences
              </Button>
            </div>
          )}

          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            {(profileStatus === "incomplete" || profileStatus === "rejected") && (
              <div className="space-y-6 card p-8 text-left">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Questionnaire progress</span>
                    <span className="font-serif text-2xl font-light text-foreground">{completionPercentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {profileStatus === "rejected"
                    ? "Please update your profile and resubmit for review."
                    : "Complete your profile questionnaire to submit for matchmaker review."}
                </p>
                <Button
                  onClick={() =>
                    navigate(
                      profileStatus === "rejected" ? "/client/profile/edit" : "/onboarding"
                    )
                  }
                  className="btn-primary w-full"
                >
                  {profileStatus === "rejected" ? "Update questionnaire" : "Continue questionnaire"}
                </Button>
              </div>
            )}

            {profileStatus === "pending_approval" && (
              <div className="space-y-6 card p-8 text-left">
                <div>
                  <span className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Profile status</span>
                  <h2 className="font-serif text-2xl font-light text-foreground">Under review</h2>
                </div>
                <div className="rounded-2xl border border-dashed border-border bg-secondary p-10 text-center text-sm text-muted-foreground">
                  Your matchmaker is carefully reviewing your profile. You'll receive a notification once approved and we can start creating your perfect introductions.
                </div>
              </div>
            )}

            {profileStatus === "approved" && (
              <div className="space-y-6">
                {/* Your Turn */}
                {categorizedMatches.yourTurn.length > 0 && (
                  <div className="card p-8 text-left">
                    <div className="mb-6">
                      <span className="text-sm text-muted-foreground">Your turn</span>
                      <h2 className="text-xl font-semibold text-foreground">
                        {categorizedMatches.yourTurn.length} {categorizedMatches.yourTurn.length === 1 ? "match" : "matches"} waiting
                      </h2>
                    </div>
                    <MatchList matches={categorizedMatches.yourTurn} highlightNew onSelect={handleOpenMatch} className="space-y-4" />
                  </div>
                )}

                {/* Mutual Matches */}
                {categorizedMatches.mutualMatch.length > 0 && (
                  <div className="card p-8 text-left">
                    <div className="mb-6">
                      <span className="text-sm text-muted-foreground">Mutual match</span>
                      <h2 className="text-xl font-semibold text-foreground">
                        {categorizedMatches.mutualMatch.length} {categorizedMatches.mutualMatch.length === 1 ? "connection" : "connections"}
                      </h2>
                    </div>
                    <MatchList matches={categorizedMatches.mutualMatch} onSelect={handleOpenMatch} className="space-y-4" />
                  </div>
                )}

                {/* Their Turn */}
                {categorizedMatches.theirTurn.length > 0 && (
                  <div className="card p-8 text-left">
                    <div className="mb-6">
                      <span className="text-sm text-muted-foreground">Their turn</span>
                      <h2 className="text-xl font-semibold text-foreground">
                        Waiting for {categorizedMatches.theirTurn.length} {categorizedMatches.theirTurn.length === 1 ? "response" : "responses"}
                      </h2>
                    </div>
                    <MatchList matches={categorizedMatches.theirTurn} onSelect={handleOpenMatch} className="space-y-4" />
                  </div>
                )}

                {/* Rejected */}
                {categorizedMatches.rejected.length > 0 && (
                  <div className="card p-8 text-left">
                    <div className="mb-6">
                      <span className="text-sm text-muted-foreground">Rejected</span>
                      <h2 className="text-xl font-semibold text-foreground">
                        {categorizedMatches.rejected.length} {categorizedMatches.rejected.length === 1 ? "match" : "matches"}
                      </h2>
                    </div>
                    <MatchList matches={categorizedMatches.rejected} onSelect={handleOpenMatch} className="space-y-4" />
                  </div>
                )}

                {/* Empty state */}
                {categorizedMatches.yourTurn.length === 0 &&
                 categorizedMatches.theirTurn.length === 0 &&
                 categorizedMatches.rejected.length === 0 &&
                 categorizedMatches.mutualMatch.length === 0 && (
                  <div className="card p-8 text-left">
                    <div className="rounded-2xl border border-dashed border-border bg-secondary p-10 text-center text-sm text-muted-foreground">
                      Your matchmaker is curating the perfect introduction. We&apos;ll let you know the moment a dossier is ready.
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
      <BottomNavigation />
      </div>
    </>
  );
};

export default ClientDashboard;
