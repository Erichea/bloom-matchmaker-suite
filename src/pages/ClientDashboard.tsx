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

        <header className="flex justify-between items-start mb-16 px-6 pt-8 md:px-10">
          <div>
            <p className="font-body text-base text-muted-foreground mb-2">
              Hello, {profile?.first_name || user?.user_metadata?.first_name || 'there'}
            </p>
            <h1 className="text-4xl font-display font-bold">Your Next Chapter</h1>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden">
            {profilePhotoUrl ? (
              <img
                alt="User profile picture"
                className="w-full h-full object-cover"
                src={profilePhotoUrl}
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-sm font-semibold">
                {userInitials}
              </div>
            )}
          </div>
        </header>

        <main className="relative z-10 flex flex-1 items-start px-6 pb-16 md:px-10">
          <motion.div
            className="mx-auto flex w-full max-w-4xl flex-col gap-12 text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {profileStatus === "incomplete" && (
              <div className="flex flex-col gap-4">
                <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground md:self-start">
                  Complete your profile
                </span>
                <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  {profile?.first_name ? `Welcome, ${profile.first_name}.` : "Let's get started."}
                </h1>
                <p className="text-sm leading-7 text-muted-foreground md:max-w-xl md:text-base">
                  Complete your questionnaire so we can start curating perfect introductions for you.
                </p>
              </div>
            )}

            {profileStatus === "rejected" && (
              <div className="flex flex-col gap-4">
                <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground md:self-start">
                  Profile needs revision
                </span>
                <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  {profile?.first_name ? `${profile.first_name}, let's refine your profile.` : "Update required"}
                </h1>
                <p className="text-sm leading-7 text-muted-foreground md:max-w-xl md:text-base">
                  Your matchmaker has requested some changes to your profile. Please review and resubmit.
                </p>
              </div>
            )}

            {profileStatus === "pending_approval" && (
              <div className="flex flex-col gap-4">
                <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground md:self-start">
                  Under review
                </span>
                <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  {profile?.first_name ? `Thank you, ${profile.first_name}.` : "Profile submitted"}
                </h1>
                <p className="text-sm leading-7 text-muted-foreground md:max-w-xl md:text-base">
                  Your profile is being reviewed by your matchmaker. You'll be notified once approved and we start curating introductions.
                </p>
              </div>
            )}

            {profileStatus === "approved" && (
              <>
                <section className="mb-12">
                  <p className="font-body text-base leading-relaxed max-w-prose text-muted-foreground">
                    We curate connections with intention. Forget endless swiping; here, introductions are thoughtful, based on shared values and a deeper understanding of what truly matters.
                  </p>
                </section>
                <section className="mb-12">
                  <div className="bg-card p-5 rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                      <h2 className="text-lg font-display font-semibold">Your Preferences</h2>
                      <p className="text-sm font-body text-muted-foreground">Fine-tune your personal criteria.</p>
                    </div>
                    <button className="bg-transparent p-2 rounded-lg hover:bg-secondary transition-colors">
                      <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </button>
                  </div>
                </section>
              </>
            )}

            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              {(profileStatus === "incomplete" || profileStatus === "rejected") && (
                <div className="space-y-6 rounded-3xl border border-border bg-card p-6 text-left shadow-lg sm:p-8">
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
                    className="w-full rounded-2xl bg-primary px-8 py-3 text-sm font-medium uppercase tracking-[0.25em] text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
                  >
                    {profileStatus === "rejected" ? "Update questionnaire" : "Continue questionnaire"}
                  </Button>
                </div>
              )}

              {profileStatus === "pending_approval" && (
                <div className="space-y-6 rounded-3xl border border-border bg-card p-6 text-left shadow-lg sm:p-8">
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
                <section>
                  <h2 className="text-2xl font-display font-bold mb-6">New Introductions</h2>
                  <div className="space-y-4">
                    {/* Combine all matches into a single list for the new design */}
                    {(() => {
                      const allMatches = [
                        ...categorizedMatches.yourTurn,
                        ...categorizedMatches.theirTurn,
                        ...categorizedMatches.mutualMatch,
                        ...categorizedMatches.rejected
                      ];

                      return allMatches.length > 0 ? (
                        allMatches.map((match) => (
                          <button
                            key={match.id}
                            onClick={() => handleOpenMatch(match.id)}
                            className="w-full bg-card p-4 rounded-2xl flex items-center shadow-sm hover:shadow-md transition-all duration-200 text-left"
                          >
                            <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden mr-4">
                              {match.avatarUrl ? (
                                <img alt={`${match.name}`} className="w-full h-full object-cover" src={match.avatarUrl} />
                              ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-sm font-semibold">
                                  {match.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <h3 className="font-semibold font-body text-foreground">
                                {match.name}, {match.subtitle ? new Date(match.subtitle).getFullYear() : 'Unknown'}
                              </h3>
                              <p className="text-sm font-body text-muted-foreground">
                                {match.status === 'new' && 'Introduced by mutual values'}
                                {match.status === 'pending' && 'Waiting for your response'}
                                {match.status === 'mutual' && 'Mutual connection'}
                                {match.status === 'inactive' && 'Conversation archived'}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))
                      ) : (
                        <div className="bg-card p-6 rounded-2xl text-left shadow-sm">
                          <div className="rounded-2xl border border-dashed border-border bg-secondary p-10 text-center text-sm text-muted-foreground">
                            Your matchmaker is curating the perfect introduction. We'll let you know the moment a dossier is ready.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </section>
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
