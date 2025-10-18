import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import MatchDetailModal from "@/components/MatchDetailModal";
import { MatchList } from "@/components/experience/MatchList";
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
  const { t } = useTranslation(['dashboard', 'profileStatus', 'common']);
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

      let processedData = rpcData ? (rpcData as any[]).map((row: any) => row.match_data) : [];

      // Fetch profile_answers for each match's profile_1 and profile_2
      if (processedData && processedData.length > 0) {
        const userIds = new Set<string>();
        processedData.forEach((match: any) => {
          if (match.profile_1?.user_id) userIds.add(match.profile_1.user_id);
          if (match.profile_2?.user_id) userIds.add(match.profile_2.user_id);
        });

        const { data: answersData } = await supabase
          .from("profile_answers")
          .select("*")
          .in("user_id", Array.from(userIds));

        // Attach answers to the correct profiles
        processedData = processedData.map((match: any) => ({
          ...match,
          profile_1: {
            ...match.profile_1,
            profile_answers: answersData?.filter((a: any) => a.user_id === match.profile_1?.user_id) || []
          },
          profile_2: {
            ...match.profile_2,
            profile_answers: answersData?.filter((a: any) => a.user_id === match.profile_2?.user_id) || []
          }
        }));
      }

      const { data: userProfileData, error: userProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (userProfileError) throw userProfileError;

      const userProfile = userProfileData?.[0];
      if (!userProfile) return;

      setMatches(processedData || []);
      const unviewedMatches = (processedData || []).filter((match: Match) => {
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
  }, [user?.id, session?.access_token, authLoading, navigate, fetchProfile, fetchMatches]);

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

  const formattedMatches = useMemo(() => {
    if (!matches.length || !currentProfileId) {
      return [];
    }

    return matches.map((match) => {
      const isProfile1 = match.profile_1_id === currentProfileId;
      const currentUserResponse = isProfile1 ? match.profile_1_response : match.profile_2_response;
      const otherUserResponse = isProfile1 ? match.profile_2_response : match.profile_1_response;
      const other = isProfile1 ? match.profile_2 : match.profile_1;
      const name = other ? `${other.first_name ?? ""}`.trim() || "Match" : "Match";
      const avatarUrl = other?.photo_url || (Array.isArray(other?.photos) && other.photos[0]?.photo_url) || undefined;

      // Determine status based on responses, but exclude mutual matches
      let status: "pending" | "mutual" | "new" | "inactive" = "new";
      const isMutual = match.match_status === "both_accepted" ||
                       (currentUserResponse === "accepted" && otherUserResponse === "accepted");

      if (isMutual) {
        // Skip mutual matches on the main dashboard - they have their own page
        return null;
      } else if (currentUserResponse === "rejected" || otherUserResponse === "rejected") {
        status = "inactive";
      } else if (currentUserResponse === "accepted") {
        status = "pending";
      }

      return {
        id: match.id,
        name,
        status,
        compatibility: match.compatibility_score,
        avatarUrl,
        matchDate: match.suggested_at,
        currentUserResponse,
        otherUserResponse,
      };
    }).filter(Boolean); // Remove null entries (mutual matches)
  }, [matches, currentProfileId]);


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
      <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col px-4 py-6 pb-24">
        <main className="flex-grow max-w-4xl mx-auto w-full">
          <header className="flex justify-between items-center mb-8">
            <div>
              <p className="text-sm text-subtle-light dark:text-subtle-dark mb-1">
                {t('dashboard.welcomeBack')}
              </p>
              <h1 className="text-2xl font-display font-semibold">{profile?.first_name || user?.user_metadata?.first_name || t('dashboard.there')}</h1>
            </div>
            <button
              onClick={() => navigate('/client/profile')}
              className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent dark:hover:ring-accent-dark transition-all"
              aria-label="View profile"
            >
              {profilePhotoUrl ? (
                <img
                  alt="User profile picture"
                  className="w-full h-full object-cover"
                  src={profilePhotoUrl}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-subtle-light dark:text-subtle-dark text-xs font-medium">
                  {userInitials}
                </div>
              )}
            </button>
          </header>

          {profileStatus !== 'approved' && (
            <section className="mb-8">
              <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                {profileStatus === "incomplete" && (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-subtle-light dark:text-subtle-dark">
                      {t('profileStatus.completeYourProfile')}
                    </span>
                    <h2 className="text-lg font-display font-medium text-text-light dark:text-text-dark">
                      {profile?.first_name ? t('dashboard.welcomeName', { name: profile.first_name }) : t('profileStatus.letsGetStarted')}
                    </h2>
                    <p className="text-sm text-subtle-light dark:text-subtle-dark">
                      {t('profileStatus.completeQuestionnaireIntro')}
                    </p>
                  </div>
                )}
                {profileStatus === "rejected" && (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-subtle-light dark:text-subtle-dark">
                      {t('profileStatus.profileNeedsRevision')}
                    </span>
                    <h2 className="text-lg font-display font-medium text-text-light dark:text-text-dark">
                      {profile?.first_name ? `${profile.first_name}, ${t('profileStatus.refineProfile')}` : t('profileStatus.updateRequired')}
                    </h2>
                    <p className="text-sm text-subtle-light dark:text-subtle-dark">
                      {t('profileStatus.revisionRequested')}
                    </p>
                  </div>
                )}
                {profileStatus === "pending_approval" && (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-subtle-light dark:text-subtle-dark">
                      {t('profileStatus.underReview')}
                    </span>
                    <h2 className="text-lg font-display font-medium text-text-light dark:text-text-dark">
                      {profile?.first_name ? t('profileStatus.thankYou', { name: profile.first_name }) : t('profileStatus.profileSubmitted')}
                    </h2>
                    <p className="text-sm text-subtle-light dark:text-subtle-dark">
                      {t('profileStatus.reviewInProgress')}
                    </p>
                  </div>
                )}

                {(profileStatus === "incomplete" || profileStatus === "rejected") && (
                  <div className="mt-4 space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-subtle-light dark:text-subtle-dark">{t('dashboard.questionnaireProgress')}</span>
                        <span className="text-lg font-medium text-text-light dark:text-text-dark">{completionPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                        <div
                          className="h-full bg-accent dark:bg-accent-dark transition-all duration-500"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-subtle-light dark:text-subtle-dark">
                      {profileStatus === "rejected"
                        ? t('profileStatus.updateProfileRejected')
                        : t('profileStatus.submitForReview')}
                    </p>
                    <Button
                      onClick={() =>
                        navigate(
                          profileStatus === "rejected" ? "/client/profile/edit" : "/onboarding"
                        )
                      }
                      className="w-full rounded-lg bg-accent dark:bg-accent-dark px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white dark:text-black transition-all duration-300 hover:opacity-90"
                    >
                      {profileStatus === "rejected" ? t('profileStatus.updateQuestionnaire') : t('profileStatus.continueQuestionnaire')}
                    </Button>
                  </div>
                )}
              </div>
            </section>
          )}

          {profileStatus === 'approved' && (
            <>
              <section className="mb-8">
                <p className="text-sm text-subtle-light dark:text-subtle-dark leading-relaxed">
                  {t('profileStatus.curatorMessage')}
                </p>
              </section>

              <section>
                {formattedMatches.length > 0 ? (
                  <MatchList
                    title={t('dashboard.pendingMatches')}
                    matches={formattedMatches}
                    onSelect={handleOpenMatch}
                  />
                ) : (
                  <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl text-left shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-8 text-center text-sm text-subtle-light dark:text-subtle-dark">
                      {t('profileStatus.noMatchesYet')}
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-xs text-subtle-light dark:text-subtle-dark">
                    {t('profileStatus.lookingForMutual')}
                    <Button
                      variant="link"
                      onClick={() => navigate('/client/mutual-matches')}
                      className="p-0 ml-1 h-auto font-normal text-xs"
                    >
                      {t('dashboard.viewMutualMatches')}
                    </Button>
                  </p>
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