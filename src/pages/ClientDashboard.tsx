import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/experience/MatchList";
import MatchDetailModal from "@/components/MatchDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut } from "lucide-react";

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

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[hsl(var(--brand-secondary))] text-white">
      <MatchDetailModal match={selectedMatch} open={modalOpen} onOpenChange={setModalOpen} onMatchResponse={handleMatchResponse} />

      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/placeholder.svg"
      >
        <source src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(29,32,31,0.92)_0%,rgba(29,32,31,0.78)_40%,rgba(29,32,31,0.6)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-sm" />

      <motion.div
        className="pointer-events-none absolute -left-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(223,146,142,0.35)_0%,rgba(223,146,142,0)_70%)]"
        animate={{ y: [-20, 10, -20], x: [0, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-16 right-[-6rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(223,146,142,0.25)_0%,rgba(223,146,142,0)_70%)]"
        animate={{ y: [10, -15, 10], x: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror" }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 pb-6 pt-8 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold uppercase tracking-[0.3em]">
            B
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-white">
            Bloom
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile-questionnaire")}
            className="hidden rounded-full border border-white/15 px-6 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-white/80 transition hover:border-white/35 hover:text-white md:inline-flex"
          >
            Update profile
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-white/80 transition hover:border-white/35 hover:text-white"
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
          <div className="flex flex-col gap-4">
            <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-white/60 md:self-start">
              Curated introductions
            </span>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl">
              {profile?.first_name ? `Good to see you, ${profile.first_name}.` : "Your curated matches await."}
            </h1>
            <p className="text-sm leading-7 text-white/75 md:max-w-xl md:text-base">
              Explore new introductions as they arrive. Each dossier is prepared intentionally so you can focus on the
              connections that matter.
            </p>
            <Button
              variant="ghost"
              onClick={() => navigate("/profile-questionnaire")}
              className="inline-flex w-full items-center justify-center gap-2 self-center rounded-full border border-white/15 px-6 py-3 text-[0.65rem] uppercase tracking-[0.28em] text-white/80 transition hover:border-white/35 hover:text-white md:w-auto md:self-start"
            >
              <User className="h-3.5 w-3.5" /> Update profile preferences
            </Button>
          </div>

          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div className="space-y-6 rounded-[26px] border border-white/12 bg-white/90 p-6 text-left text-[hsl(var(--brand-secondary))] shadow-[0_32px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[hsl(var(--brand-secondary))]/60">Active matches</span>
                  <h2 className="text-2xl font-semibold text-[hsl(var(--brand-secondary))]">
                    {matchSummaries.length ? "Your introductions" : "Quiet for now"}
                  </h2>
                </div>
                {matchSummaries.length ? (
                  <span className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--brand-secondary))]/60">
                    Updated moments ago
                  </span>
                ) : null}
              </div>

              {matchSummaries.length > 0 ? (
                <MatchList matches={matchSummaries} highlightNew onSelect={handleOpenMatch} className="space-y-4" />
              ) : (
                <div className="rounded-2xl border border-dashed border-[hsl(var(--brand-secondary))]/20 bg-white/70 p-10 text-center text-sm text-[hsl(var(--brand-secondary))]/70">
                  Your matchmaker is curating the perfect introduction. We&apos;ll let you know the moment a dossier is ready.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default ClientDashboard;
