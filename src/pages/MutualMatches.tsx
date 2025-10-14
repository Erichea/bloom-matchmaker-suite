import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, User, MapPin, Calendar, Sparkles, Home, Briefcase, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MatchDetailModal from "@/components/MatchDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { cn } from "@/lib/utils";

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

const MutualMatches = () => {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

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
      const { data: rpcData, error } = await supabase.rpc("get_matches_for_user" as any, { p_user_id: user.id });
      if (error) throw error;

      let data = rpcData ? (rpcData as any[]).map((row: any) => row.match_data) : [];

      // Fetch profile_answers for each match's profile_1 and profile_2
      if (data && data.length > 0) {
        const userIds = new Set<string>();
        data.forEach((match: any) => {
          if (match.profile_1?.user_id) userIds.add(match.profile_1.user_id);
          if (match.profile_2?.user_id) userIds.add(match.profile_2.user_id);
        });

        const { data: answersData } = await supabase
          .from("profile_answers")
          .select("*")
          .in("user_id", Array.from(userIds));

        // Attach answers to the correct profiles
        data = data.map((match: any) => ({
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

      setMatches(data || []);
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

  const handleMatchResponse = () => {
    fetchMatches();
  };

  const mutualMatches = useMemo(() => {
    if (!matches.length || !currentProfileId) {
      return [];
    }

    return matches.filter((match) => {
      const isProfile1 = match.profile_1_id === currentProfileId;
      const currentUserResponse = isProfile1 ? match.profile_1_response : match.profile_2_response;
      const otherUserResponse = isProfile1 ? match.profile_2_response : match.profile_1_response;

      // Only return mutual matches (both accepted)
      return match.match_status === "both_accepted" ||
             (currentUserResponse === "accepted" && otherUserResponse === "accepted");
    }).map((match) => {
      const isProfile1 = match.profile_1_id === currentProfileId;
      const other = isProfile1 ? match.profile_2 : match.profile_1;
      const name = other ? `${other.first_name ?? ""} ${other.last_name ?? ""}`.trim() : "Match";
      const initials = name.split(" ").map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
      const age = other?.date_of_birth ? new Date().getFullYear() - new Date(other.date_of_birth).getFullYear() : null;
      const location = [other?.city, other?.country].filter(Boolean).join(', ');
      const avatarUrl = other?.photo_url || (Array.isArray(other?.photos) && other.photos[0]?.photo_url) || undefined;

      return {
        id: match.id,
        name,
        initials,
        age,
        location,
        avatarUrl,
        compatibility: match.compatibility_score,
        matchDate: match.suggested_at,
        profile: other,
      };
    });
  }, [matches, currentProfileId]);

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
      <div className="bg-background text-foreground min-h-screen flex flex-col p-6 pb-32">
        <main className="flex-grow">
          <header className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                <Heart className="w-8 h-8 text-red-500" />
                Mutual Matches
              </h1>
              <p className="text-lg text-muted-foreground">
                Connections where both of you are interested
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

          {mutualMatches.length > 0 ? (
            <div className="space-y-6">
              {mutualMatches.map((match) => (
                <Card key={match.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Profile Photo */}
                      <div className="md:w-48 lg:w-64">
                        <div className="aspect-[3/4] md:aspect-square relative">
                          {match.avatarUrl ? (
                            <img
                              src={match.avatarUrl}
                              alt={match.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Avatar className="w-24 h-24">
                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                  {match.initials}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <h3 className="text-xl font-bold text-white">{match.name.split(' ')[0]}</h3>
                            {match.age && (
                              <p className="text-lg text-white/90">{match.age}</p>
                            )}
                            {match.location && (
                              <div className="flex items-center gap-1 text-white/80 mt-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{match.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Match Details */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <Badge variant="secondary" className="mb-2">
                              <Heart className="w-3 h-3 mr-1" />
                              Mutual Match
                            </Badge>
                            <h2 className="text-2xl font-bold">{match.name}</h2>
                            <p className="text-sm text-muted-foreground">
                              Connected {formatMatchDate(match.matchDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {match.compatibility}%
                            </div>
                            <p className="text-xs text-muted-foreground">Compatible</p>
                          </div>
                        </div>

                        {/* Preview of Profile Answers */}
                        {match.profile?.profile_answers && (
                          <div className="space-y-3 mb-6">
                            {match.profile.profile_answers
                              .filter((answer: any) => answer.question_id === 'interests')
                              .slice(0, 1)
                              .map((answer: any) => (
                                <div key={answer.question_id} className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium">Interests:</span>
                                  <span className="text-sm text-muted-foreground">
                                    {formatAnswer(answer.answer).split(', ').slice(0, 3).join(', ')}
                                    {formatAnswer(answer.answer).split(', ').length > 3 && '...'}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleOpenMatch(match.id)}
                            className="flex-1"
                            size="lg"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            View Full Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No mutual matches yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                When both you and someone else express interest in each other, you'll see those mutual matches here.
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