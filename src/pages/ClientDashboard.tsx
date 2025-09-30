import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PremiumButton } from "@/components/experience/PremiumButton";
import { ProfileCard } from "@/components/experience/ProfileCard";
import { MatchList } from "@/components/experience/MatchList";
import { ChatBubble } from "@/components/experience/ChatBubble";
import MatchDetailModal from "@/components/MatchDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Sparkles } from "lucide-react";

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
}

const ClientDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState({ totalMatches: 0, pendingMatches: 0, mutualMatches: 0, newMatches: 0 });

  const calculateStats = useCallback((matchesData: Match[], userProfileId: string) => {
    const pending = matchesData.filter(
      (match) =>
        match.match_status === "pending" ||
        (match.match_status === "profile_1_accepted" && match.profile_1_id !== userProfileId) ||
        (match.match_status === "profile_2_accepted" && match.profile_2_id !== userProfileId),
    );

    const mutual = matchesData.filter((match) => match.match_status === "both_accepted");
    const newMatches = matchesData.filter((match) => {
      const isProfile1 = match.profile_1_id === userProfileId;
      return isProfile1 ? !match.viewed_by_profile_1 : !match.viewed_by_profile_2;
    });

    setStats({
      totalMatches: matchesData.length,
      pendingMatches: pending.length,
      mutualMatches: mutual.length,
      newMatches: newMatches.length,
    });
  }, []);

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
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
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

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data: completionData } = await supabase.rpc("calculate_questionnaire_completion", { p_user_id: user.id });

      if (completionData !== null) {
        await supabase.from("profiles").update({ completion_percentage: completionData }).eq("user_id", user.id);
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();

      let profileData = data;
      if (error && error.code !== "PGRST116") throw error;

      if (!profileData) {
        profileData = await createBasicProfile();
        if (!profileData) return;
      }

      setProfile(profileData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, createBasicProfile]);

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    try {
      const { data: rpcData, error } = await supabase.rpc("get_matches_for_user", { p_user_id: user.id });
      if (error) throw error;

      const data = rpcData ? rpcData.map((row: any) => row.match_data) : [];

      const { data: userProfile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
      if (!userProfile) return;

      setMatches(data || []);
      calculateStats(data || [], userProfile.id);

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
  }, [user, calculateStats]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadData = async () => {
      await fetchProfile();
      await fetchMatches();
    };

    loadData();
  }, [user, authLoading, navigate, fetchProfile, fetchMatches]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleOpenMatch = (matchId: string) => {
    const match = matches.find((item) => item.id === matchId);
    if (match) {
      setSelectedMatch(match);
      setModalOpen(true);
    }
  };

  const handleMatchResponse = () => {
    fetchMatches();
  };

  const currentProfileId = profile?.id ?? null;

  const matchSummaries = useMemo(() => {
    if (!matches.length) return [];
    return matches.map((match) => {
      const other = match.profile_1_id === currentProfileId ? match.profile_2 : match.profile_1;
      const name = other ? `${other.first_name ?? ""} ${other.last_name ?? ""}`.trim() || "Untitled" : "Match";
      const isNew = currentProfileId
        ? match.profile_1_id === currentProfileId
          ? !match.viewed_by_profile_1
          : !match.viewed_by_profile_2
        : false;

      let status: "pending" | "mutual" | "new" | "inactive" = "inactive";
      if (match.match_status === "both_accepted") status = "mutual";
      else if (isNew) status = "new";
      else if (match.match_status === "pending" || match.match_status?.includes("accepted")) status = "pending";

      return {
        id: match.id,
        name,
        status,
        compatibility: match.compatibility_score,
        subtitle: match.suggested_at ? new Date(match.suggested_at).toLocaleDateString() : undefined,
      };
    });
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

  const highlightMatch = matches[0];
  const highlightName = highlightMatch
    ? `${highlightMatch.profile_1_id === currentProfileId ? highlightMatch.profile_2?.first_name : highlightMatch.profile_1?.first_name ?? ""}`
    : null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <MatchDetailModal match={selectedMatch} open={modalOpen} onOpenChange={setModalOpen} onMatchResponse={handleMatchResponse} />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:px-12">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-secondary))]/90 px-4 py-1 text-xs uppercase tracking-[0.3em] text-[hsl(var(--brand-secondary-foreground))]">
              <Sparkles className="h-3 w-3" /> Welcome back
            </span>
            <h1 className="font-display text-3xl tracking-tight text-[hsl(var(--brand-secondary))] sm:text-4xl">
              Hello {profile?.first_name || "there"}, your curated matches await.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              We refresh introductions thoughtfully—take a moment to review new profiles, share your impressions, and
              we’ll guide the rest.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="rounded-full border-[hsl(var(--brand-secondary))]/20 px-6 text-sm"
              onClick={() => navigate("/profile-questionnaire")}
            >
              Update preferences
            </Button>
            <PremiumButton onClick={handleSignOut} className="justify-center">
              Sign out
            </PremiumButton>
          </div>
        </header>

        <main className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
          <section className="space-y-10">
            <ProfileCard
              name={`${profile.first_name ?? "Member"} ${profile.last_name ?? ""}`.trim() || "Member"}
              age={profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : undefined}
              location={[profile.city, profile.country].filter(Boolean).join(", ") || undefined}
              headline={profile.profession || "Thoughtful connections"}
              bio={profile.about_me || "Add a short introduction so your matchmaker can highlight you effortlessly."}
              interests={Array.isArray(profile.interests) ? profile.interests.slice(0, 3) : undefined}
              highlight
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {[{
                label: "Total introductions",
                value: stats.totalMatches,
              },
              {
                label: "Awaiting replies",
                value: stats.pendingMatches,
              },
              {
                label: "Mutual matches",
                value: stats.mutualMatches,
              },
              {
                label: "New this week",
                value: stats.newMatches,
              }].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-[hsl(var(--brand-secondary))]/10 bg-[hsl(var(--surface))] p-6 shadow-[0_18px_80px_-48px_rgba(15,15,15,0.4)]"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-[hsl(var(--brand-secondary))]">{item.value}</p>
                </div>
              ))}
            </div>

            <MatchList
              title="Your introductions"
              matches={matchSummaries}
              highlightNew
              onSelect={handleOpenMatch}
            />
          </section>

          <section className="space-y-8">
            <div className="rounded-3xl border border-[hsl(var(--brand-secondary))]/10 bg-[hsl(var(--surface))] p-8">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <Heart className="h-3 w-3" /> Conversation preview
              </div>
              {highlightMatch && highlightName ? (
                <div className="mt-6 space-y-4">
                  <Badge className="rounded-full bg-[hsl(var(--brand-primary))]/10 text-[hsl(var(--brand-primary))]">
                    {highlightMatch.match_status === "both_accepted" ? "Mutual" : "Awaiting reply"}
                  </Badge>
                  <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                    <ChatBubble
                      author="match"
                      message={`Hi ${profile.first_name || "there"}, ${highlightName.trim()} loved your profile. Shall we plan a wine tasting this week?`}
                    />
                    <ChatBubble
                      author="self"
                      message={`That sounds perfect. I'm free Thursday evening—let’s meet at The Avery.`}
                      timestamp="just now"
                    />
                  </div>
                  <PremiumButton className="mt-4 w-full justify-center" onClick={() => handleOpenMatch(highlightMatch.id)}>
                    Review introduction
                    <MessageCircle className="ml-2 h-4 w-4" />
                  </PremiumButton>
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-muted-foreground">
                  We’re currently curating your next introduction. Keep an eye out for new dossiers from your matchmaker.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-[hsl(var(--brand-secondary))]/10 bg-[hsl(var(--surface))] p-8">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <Sparkles className="h-3 w-3" /> Next steps
              </div>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
                <li>• Share feedback after each date so your matchmaker can refine future introductions.</li>
                <li>• Update your profile with recent highlights—travel plans, passions, or the latest project you’re proud of.</li>
                <li>• Keep your availability current to receive perfectly timed matches.</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
