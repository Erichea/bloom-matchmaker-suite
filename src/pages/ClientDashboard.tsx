import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/experience/MatchList";
import MatchDetailModal from "@/components/MatchDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Home, User, LogOut } from "lucide-react";

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
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <MatchDetailModal match={selectedMatch} open={modalOpen} onOpenChange={setModalOpen} onMatchResponse={handleMatchResponse} />

      <header className="border-b border-border bg-[hsl(var(--surface))]/60 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Welcome back</p>
            <h1 className="text-xl font-semibold text-[hsl(var(--brand-secondary))]">
              {profile?.first_name ? `Hi ${profile.first_name}` : "Your matches"}
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[hsl(var(--brand-secondary))]">Your matches</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Updated in real time</span>
          </div>
          {matchSummaries.length > 0 ? (
            <MatchList matches={matchSummaries} highlightNew onSelect={handleOpenMatch} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-[hsl(var(--surface))]/60 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Your matchmaker is curating introductions. You'll see new matches here first.
              </p>
            </div>
          )}
        </div>
      </main>

      <nav className="sticky bottom-0 border-t border-border bg-[hsl(var(--surface))]/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <Button variant="ghost" className="flex-1 justify-center gap-2 text-[hsl(var(--brand-secondary))]" disabled>
            <Home className="h-4 w-4" />
            Matches
          </Button>
          <Button
            variant="ghost"
            className="flex-1 justify-center gap-2 text-muted-foreground"
            onClick={() => navigate("/profile-questionnaire")}
          >
            <User className="h-4 w-4" />
            Update profile
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default ClientDashboard;
