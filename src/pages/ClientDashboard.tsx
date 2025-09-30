import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Settings,
  Sparkles,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Menu,
  LogOut,
  Edit,
  Star,
  Briefcase,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MatchDetailModal from "@/components/MatchDetailModal";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalMatches: 0,
    pendingMatches: 0,
    mutualMatches: 0,
    newMatches: 0
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
    fetchMatches();
  }, [user, authLoading, navigate]);

  const createBasicProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          email: user.email || null,
          status: 'incomplete',
          completion_percentage: 0
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: completionData } = await supabase
        .rpc('calculate_questionnaire_completion', { p_user_id: user.id });

      if (completionData !== null) {
        await supabase
          .from('profiles')
          .update({ completion_percentage: completionData })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        await createBasicProfile();
        return;
      }

      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    if (!user) return;

    try {
      // First, get the user's profile ID
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) return;

      // Fetch matches where the user is either profile_1 or profile_2
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          profile_1:profiles!matches_profile_1_id_fkey(*),
          profile_2:profiles!matches_profile_2_id_fkey(*)
        `)
        .or(`profile_1_id.eq.${userProfile.id},profile_2_id.eq.${userProfile.id}`)
        .order('suggested_at', { ascending: false });

      if (error) throw error;

      setMatches(data || []);
      calculateStats(data || [], userProfile.id);

      // Mark matches as viewed
      const unviewedMatches = (data || []).filter((match: Match) => {
        const isProfile1 = match.profile_1_id === userProfile.id;
        return isProfile1 ? !match.viewed_by_profile_1 : !match.viewed_by_profile_2;
      });

      if (unviewedMatches.length > 0) {
        for (const match of unviewedMatches) {
          const isProfile1 = match.profile_1_id === userProfile.id;
          await supabase
            .from('matches')
            .update({
              [isProfile1 ? 'viewed_by_profile_1' : 'viewed_by_profile_2']: true
            })
            .eq('id', match.id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
    }
  };

  const calculateStats = (matchesData: Match[], userProfileId: string) => {
    const pending = matchesData.filter(m => 
      m.match_status === 'pending' || 
      (m.match_status === 'profile_1_accepted' && m.profile_1_id !== userProfileId) ||
      (m.match_status === 'profile_2_accepted' && m.profile_2_id !== userProfileId)
    );
    
    const mutual = matchesData.filter(m => m.match_status === 'both_accepted');
    
    const newMatches = matchesData.filter(m => {
      const isProfile1 = m.profile_1_id === userProfileId;
      return isProfile1 ? !m.viewed_by_profile_1 : !m.viewed_by_profile_2;
    });

    setStats({
      totalMatches: matchesData.length,
      pendingMatches: pending.length,
      mutualMatches: mutual.length,
      newMatches: newMatches.length
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending_approval':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getMatchStatus = (match: Match) => {
    const userProfileId = profile?.id;
    const isProfile1 = match.profile_1_id === userProfileId;
    const userResponse = isProfile1 ? match.profile_1_response : match.profile_2_response;
    const otherResponse = isProfile1 ? match.profile_2_response : match.profile_1_response;

    if (match.match_status === 'both_accepted') {
      return { text: 'Mutual Match! 🎉', color: 'badge-success' };
    }
    
    if (userResponse === 'accepted') {
      return otherResponse === null 
        ? { text: 'Waiting for response...', color: 'badge-warning' }
        : { text: 'They passed', color: 'badge-error' };
    }
    
    if (userResponse === 'rejected') {
      return { text: 'You passed', color: 'badge-pending' };
    }
    
    if (otherResponse === 'accepted') {
      return { text: 'They\'re interested!', color: 'badge-warning' };
    }
    
    return { text: 'New Match', color: 'badge-success' };
  };

  const openMatchModal = (match: Match) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  const hasUserResponded = (match: Match) => {
    const userProfileId = profile?.id;
    const isProfile1 = match.profile_1_id === userProfileId;
    const userResponse = isProfile1 ? match.profile_1_response : match.profile_2_response;
    return userResponse !== null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) return null;

  const firstName = profile.first_name || 'User';
  const lastName = profile.last_name || '';
  const initials = `${firstName[0]}${lastName[0] || ''}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim();

  // Filter matches for display - show pending and mutual matches
  const displayMatches = matches.filter(m => 
    m.match_status !== 'rejected' && 
    m.match_status !== 'profile_1_rejected' && 
    m.match_status !== 'profile_2_rejected'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Elegant Header */}
      <header className="bg-surface/50 backdrop-blur-lg border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Heart className="h-5 w-5 text-accent animate-pulse-soft" />
              <span className="text-xl font-light tracking-wide text-foreground">
                BLOOM
              </span>
            </div>

            {/* Profile Menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                  <Avatar className="w-9 h-9 border border-accent/30">
                    <AvatarImage src={profile.photo_url} />
                    <AvatarFallback className="bg-accent/10 text-accent-foreground font-light">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Menu className="w-4 h-4 text-muted-foreground" />
                  {stats.newMatches > 0 && (
                    <Badge className="bg-primary text-white text-xs">
                      {stats.newMatches}
                    </Badge>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="bg-surface border-border">
                <SheetHeader>
                  <div className="flex flex-col items-center pt-6 pb-6">
                    <Avatar className="w-20 h-20 border-2 border-accent/30 mb-4">
                      <AvatarImage src={profile.photo_url} />
                      <AvatarFallback className="bg-accent/10 text-accent-foreground text-2xl font-light">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <SheetTitle className="text-xl font-light text-foreground">{fullName}</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">{profile.email}</SheetDescription>
                    <Badge className={`mt-3 ${getStatusBadgeClass(profile.status)} flex items-center space-x-1 font-light`}>
                      {getStatusIcon(profile.status)}
                      <span className="capitalize">{profile.status?.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="space-y-1 mt-6">
                  <Button
                    variant="ghost"
                    className="w-full justify-start font-light text-foreground hover:bg-accent/10"
                    onClick={() => {
                      navigate('/profile-questionnaire');
                      setMenuOpen(false);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start font-light text-foreground hover:bg-accent/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Button>
                  <div className="border-t border-border my-4"></div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start font-light text-muted-foreground hover:text-foreground hover:bg-accent/10"
                    onClick={() => {
                      handleSignOut();
                      setMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 pb-20 animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-12 text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-light text-foreground tracking-tight">
              Welcome back, {firstName}
            </h1>
            <div className="w-12 h-0.5 bg-accent mx-auto"></div>
          </div>
          <p className="text-lg text-muted-foreground font-light">
            Your journey to meaningful connection continues <span className="fun-emoji">✨</span>
          </p>
        </div>

        {/* Profile Status Card */}
        {profile.status !== 'approved' && (
          <Card className="mb-12 card-premium animate-slide-up">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="illustration-icon mx-auto bg-accent/10">
                  {profile.status === 'pending_approval' ? (
                    <Clock className="w-6 h-6 text-accent animate-wiggle" />
                  ) : profile.status === 'rejected' ? (
                    <AlertCircle className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-accent animate-float" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-light text-foreground">
                    {profile.status === 'pending_approval'
                      ? 'Profile Under Review'
                      : profile.status === 'rejected'
                      ? 'Action Required'
                      : 'Complete Your Profile'}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-md mx-auto">
                    {profile.status === 'pending_approval'
                      ? 'Our team is carefully reviewing your profile. You\'ll be notified within 24-48 hours.'
                      : profile.status === 'rejected'
                      ? 'Please review the feedback and update your profile to continue.'
                      : 'Share more about yourself to start receiving curated matches.'}
                  </p>
                </div>

                {profile.status === 'rejected' && profile.rejection_reason && (
                  <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
                    <p className="text-sm text-foreground font-light">{profile.rejection_reason}</p>
                  </div>
                )}

                {profile.completion_percentage !== null && profile.status !== 'pending_approval' && (
                  <div className="max-w-sm mx-auto space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-light">Profile Completion</span>
                      <span className="text-foreground font-light">{profile.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-accent h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${profile.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {(profile.status === 'incomplete' || profile.status === 'rejected') && (
                  <Button
                    onClick={() => navigate('/profile-questionnaire')}
                    className="btn-premium"
                  >
                    {profile.status === 'rejected' ? 'Update Profile' : 'Complete Profile'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats - Only show if approved */}
        {profile.status === 'approved' && (
          <div className="grid grid-cols-3 gap-4 mb-12">
            <Card className="card-premium text-center hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="illustration-icon mx-auto bg-accent/10 mb-3">
                  <Heart className="w-5 h-5 text-accent animate-pulse-soft" />
                </div>
                <div className="text-2xl font-light text-foreground mb-1">{stats.totalMatches}</div>
                <div className="text-xs text-muted-foreground font-light">Total Matches</div>
              </CardContent>
            </Card>
            <Card className="card-premium text-center hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="illustration-icon mx-auto bg-primary/10 mb-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-light text-foreground mb-1">{stats.mutualMatches}</div>
                <div className="text-xs text-muted-foreground font-light">Mutual</div>
              </CardContent>
            </Card>
            <Card className="card-premium text-center hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="illustration-icon mx-auto bg-success/10 mb-3">
                  <Sparkles className="w-5 h-5 text-success animate-float" />
                </div>
                <div className="text-2xl font-light text-foreground mb-1">{stats.pendingMatches}</div>
                <div className="text-xs text-muted-foreground font-light">Pending</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Matches Section - Only show if approved */}
        {profile.status === 'approved' && (
          <>
            <div className="text-center mb-8 space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-light text-foreground">
                  Curated For You
                </h2>
                <div className="w-12 h-0.5 bg-accent mx-auto"></div>
              </div>
              <p className="text-sm text-muted-foreground font-light">
                Handpicked matches based on your preferences <span className="fun-emoji">💫</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {displayMatches.map((match, index) => {
                const userProfileId = profile?.id;
                const otherProfile = match.profile_1_id === userProfileId ? match.profile_2 : match.profile_1;
                const name = `${otherProfile?.first_name || ''} ${otherProfile?.last_name || ''}`.trim();
                const age = otherProfile?.date_of_birth ? calculateAge(otherProfile.date_of_birth) : null;
                const location = [otherProfile?.city, otherProfile?.country].filter(Boolean).join(', ');
                const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                const status = getMatchStatus(match);
                const hasResponded = hasUserResponded(match);

                return (
                  <Card key={match.id} className="card-premium overflow-hidden group animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="relative">
                      <div className="w-full h-96 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                          <AvatarFallback className="text-4xl bg-primary-muted text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-surface/90 backdrop-blur-sm text-accent border-accent/20 font-light">
                          <Star className="w-3 h-3 mr-1" />
                          {match.compatibility_score}% Match
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-light text-foreground mb-1">
                          {name}{age && `, ${age}`}
                        </h3>
                        {location && (
                          <div className="flex items-center text-muted-foreground text-sm font-light mb-2">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {location}
                          </div>
                        )}
                        {otherProfile?.profession && (
                          <div className="flex items-center text-muted-foreground text-sm font-light">
                            <Briefcase className="w-3.5 h-3.5 mr-1" />
                            {otherProfile.profession}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-center">
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <Button 
                          className="flex-1 btn-premium group"
                          onClick={() => openMatchModal(match)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {displayMatches.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No matches yet. Check back soon!</p>
              </div>
            )}
          </>
        )}

        {/* Match Detail Modal */}
        <MatchDetailModal
          match={selectedMatch}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onMatchResponse={() => {
            fetchMatches();
            setSelectedMatch(null);
          }}
        />
      </main>
    </div>
  );
};

export default ClientDashboard;