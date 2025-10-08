import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    const matchId = searchParams.get('match');
    if (matchId && matches.length > 0 && !modalOpen) {
      handleOpenMatch(matchId);
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
        newIntroductions: [],
        waitingForResponse: [],
        mutualConnections: [],
        archived: [],
      };
    }

    const categories = {
      newIntroductions: [] as any[],
      waitingForResponse: [] as any[],
      mutualConnections: [] as any[],
      archived: [] as any[],
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
        name: `${other.first_name}, ${other.age_range?.split('-')[0]}`,
        subtitle: "",
        match: {
          ...match,
          current_profile_id: currentProfileId,
        },
        avatarUrl,
      };

      if (match.match_status === "both_accepted") {
        matchSummary.subtitle = "Mutual connection";
        categories.mutualConnections.push(matchSummary);
      } else if (currentUserResponse === "rejected" || otherUserResponse === "rejected") {
        matchSummary.subtitle = "Conversation archived";
        categories.archived.push(matchSummary);
      } else if (currentUserResponse === "accepted") {
        matchSummary.subtitle = "Waiting for their response";
        categories.waitingForResponse.push(matchSummary);
      } else if (!currentUserResponse) {
        matchSummary.subtitle = "Introduced by mutual values";
        categories.newIntroductions.push(matchSummary);
      }
    });

    return categories;
  }, [matches, currentProfileId]);
  
  const allMatches = useMemo(() => [
    ...categorizedMatches.newIntroductions,
    ...categorizedMatches.waitingForResponse,
    ...categorizedMatches.mutualConnections,
    ...categorizedMatches.archived,
  ], [categorizedMatches]);


  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <motion.div
          className="h-24 w-24 rounded-full border-[3px] border-subtle-light/20 border-t-accent dark:border-subtle-dark/20 dark:border-t-accent-dark"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
      </div>
    );
  }

  if (!profile) {
    return null;
  }
  
  const profileStatus = profile?.status || "incomplete";
  const completionPercentage = profile?.completion_percentage || 0;

  return (
    <>
      <MatchDetailModal match={selectedMatch} open={modalOpen} onOpenChange={setModalOpen} onMatchResponse={handleMatchResponse} />
      <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col p-6 pb-32">
        <main className="flex-grow">
          <header className="flex justify-between items-start mb-16">
            <div>
              <p className="font-body text-base text-subtle-light dark:text-subtle-dark">
                Hello, {profile?.first_name || user?.user_metadata?.first_name || 'there'}
              </p>
              <h1 className="text-4xl font-display font-bold">Your Next Chapter</h1>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden">
              {profilePhotoUrl ? (
                <img
                  alt="User profile picture"
                  className="w-full h-full object-cover"
                  src={profilePhotoUrl}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-subtle-light dark:text-subtle-dark text-sm font-semibold">
                  {userInitials}
                </div>
              )}
            </div>
          </header>

          {profileStatus !== 'approved' && (
            <section className="mb-12">
              <div className="bg-card-light dark:bg-card-dark p-5 rounded-2xl shadow-sm">
                {profileStatus === "incomplete" && (
                  <div className="flex flex-col gap-4">
                     <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-subtle-light dark:text-subtle-dark md:self-start">
                      Complete your profile
                    </span>
                    <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-text-light dark:text-text-dark sm:text-5xl md:text-6xl">
                      {profile?.first_name ? `Welcome, ${profile.first_name}.` : "Let's get started."}
                    </h1>
                    <p className="text-sm leading-7 text-subtle-light dark:text-subtle-dark md:max-w-xl md:text-base">
                      Complete your questionnaire so we can start curating perfect introductions for you.
                    </p>
                  </div>
                )}
                {profileStatus === "rejected" && (
                  <div className="flex flex-col gap-4">
                    <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-subtle-light dark:text-subtle-dark md:self-start">
                      Profile needs revision
                    </span>
                    <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-text-light dark:text-text-dark sm:text-5xl md:text-6xl">
                      {profile?.first_name ? `${profile.first_name}, let's refine your profile.` : "Update required"}
                    </h1>
                    <p className="text-sm leading-7 text-subtle-light dark:text-subtle-dark md:max-w-xl md:text-base">
                      Your matchmaker has requested some changes to your profile. Please review and resubmit.
                    </p>
                  </div>
                )}
                {profileStatus === "pending_approval" && (
                  <div className="flex flex-col gap-4">
                    <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-subtle-light dark:text-subtle-dark md:self-start">
                      Under review
                    </span>
                    <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-text-light dark:text-text-dark sm:text-5xl md:text-6xl">
                      {profile?.first_name ? `Thank you, ${profile.first_name}.` : "Profile submitted"}
                    </h1>
                    <p className="text-sm leading-7 text-subtle-light dark:text-subtle-dark md:max-w-xl md:text-base">
                      Your profile is being reviewed by your matchmaker. You'll be notified once approved and we start curating introductions.
                    </p>
                  </div>
                )}
                
                {(profileStatus === "incomplete" || profileStatus === "rejected") && (
                  <div className="mt-6 space-y-6 rounded-3xl border border-gray-200 dark:border-gray-700 bg-card-light dark:bg-card-dark p-6 text-left shadow-lg sm:p-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-subtle-light dark:text-subtle-dark">Questionnaire progress</span>
                        <span className="font-serif text-2xl font-light text-text-light dark:text-text-dark">{completionPercentage}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full bg-accent dark:bg-accent-dark transition-all duration-500"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-subtle-light dark:text-subtle-dark">
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
                      className="w-full rounded-2xl bg-accent dark:bg-accent-dark px-8 py-3 text-sm font-medium uppercase tracking-[0.25em] text-white dark:text-black shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                    >
                      {profileStatus === "rejected" ? "Update questionnaire" : "Continue questionnaire"}
                    </Button>
                  </div>
                )}
              </div>
            </section>
          )}

          {profileStatus === 'approved' && (
            <>
              <section className="mb-12">
                <p className="font-body text-base leading-relaxed max-w-prose">
                  We curate connections with intention. Forget endless swiping; here, introductions are thoughtful, based on shared values and a deeper understanding of what truly matters.
                </p>
              </section>
              <section className="mb-12">
                <div className="bg-card-light dark:bg-card-dark p-5 rounded-2xl flex justify-between items-center shadow-sm">
                  <div>
                    <h2 className="text-lg font-display font-semibold">Your Preferences</h2>
                    <p className="text-sm font-body text-subtle-light dark:text-subtle-dark">Fine-tune your personal criteria.</p>
                  </div>
                  <button className="bg-transparent p-2 rounded-lg">
                    <span className="material-symbols-outlined text-text-light dark:text-text-dark">tune</span>
                  </button>
                </div>
              </section>
              <section>
                <h2 className="text-2xl font-display font-bold mb-6">New Introductions</h2>
                <div className="space-y-4">
                  {allMatches.length > 0 ? (
                    allMatches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => handleOpenMatch(match.id)}
                        className="w-full bg-card-light dark:bg-card-dark p-4 rounded-2xl flex items-center shadow-sm hover:shadow-md transition-all duration-200 text-left"
                      >
                        <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden mr-4">
                          {match.avatarUrl ? (
                            <img alt={`Profile picture of ${match.name}`} className="w-full h-full object-cover" src={match.avatarUrl} />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-subtle-light dark:text-subtle-dark text-sm font-semibold">
                              {match.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-semibold font-body text-text-light dark:text-text-dark">{match.name}</h3>
                          <p className="text-sm font-body text-subtle-light dark:text-subtle-dark">{match.subtitle}</p>
                        </div>
                        <span className="material-symbols-outlined text-subtle-light dark:text-subtle-dark text-lg">arrow_forward_ios</span>
                      </button>
                    ))
                  ) : (
                    <div className="bg-card-light dark:bg-card-dark p-6 rounded-2xl text-left shadow-sm">
                      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-10 text-center text-sm text-subtle-light dark:text-subtle-dark">
                        Your matchmaker is curating the perfect introduction. We'll let you know the moment a dossier is ready.
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
      <BottomNavigation />
    </>
  );
};

export default ClientDashboard;