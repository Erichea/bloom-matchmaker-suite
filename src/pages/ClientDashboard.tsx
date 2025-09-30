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
    const loadData = async () => {
      await fetchProfile();
      await fetchMatches();
    };
    loadData();
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
      return data; // Return the newly created profile
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

      let profileData = data;
      if (error && error.code !== 'PGRST116') throw error;

      if (!profileData) {
        profileData = await createBasicProfile();
        if (!profileData) return; // Still exit if creation failed
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
  };

  const fetchMatches = async () => {
    if (!user) return;

    try {
      const { data: rpcData, error } = await supabase
        .rpc('get_matches_for_user', { p_user_id: user.id });

      if (error) throw error;

      const data = rpcData ? rpcData.map((row: any) => row.match_data) : [];

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) return;

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loading-spinner-lg text-accent"></div>
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
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container-narrow">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Heart className="h-5 w-5 text-accent" />
              <span className="text-xl font-medium tracking-wide">
                BLOOM
              </span>
            </div>

            {/* Profile Menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                  <Avatar className="w-9 h-9 border border-accent/30">
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
      <main className="container-narrow py-8 md:py-12 animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-8 text-center space-y-3">
          <h1 className="text-2xl md:text-3xl">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground">
            Your journey to meaningful connection continues
          </p>
        </div>

        {/* Profile Status Card */}
        {profile.status !== 'approved' && (
          <Card className="mb-8 card animate-slide-up">
            <CardContent className="p-6 md:p-8">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-accent-soft mx-auto flex items-center justify-center">
                  {profile.status === 'pending_approval' ? (
                    <Clock className="w-6 h-6 text-accent" />
                  ) : profile.status === 'rejected' ? (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-accent" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {profile.status === 'pending_approval'
                      ? 'Profile Under Review'
                      : profile.status === 'rejected'
                      ? 'Action Required'
                      : 'Complete Your Profile'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {profile.status === 'pending_approval'
                      ? 'Our team is carefully reviewing your profile. You\'ll be notified within 24-48 hours.'
                      : profile.status === 'rejected'
                      ? 'Please review the feedback and update your profile to continue.'
                      : 'Share more about yourself to start receiving curated matches.'}
                  </p>
                </div>

                {profile.status === 'rejected' && profile.rejection_reason && (
                  <div className="p-4 bg-destructive-soft border border-destructive/20 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Feedback</p>
                    <p className="text-sm">{profile.rejection_reason}</p>
                  </div>
                )}

                {profile.completion_percentage !== null && profile.status !== 'pending_approval' && (
                  <div className="max-w-sm mx-auto space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Profile Completion</span>
                      <span className="font-semibold">{profile.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${profile.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {(profile.status === 'incomplete' || profile.status === 'rejected') && (
                  <Button
                    onClick={() => navigate('/profile-questionnaire')}
                    className="btn-accent"
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
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            <Card className="card text-center">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 rounded-full bg-accent-soft mx-auto flex items-center justify-center mb-2">
                  <Heart className="w-5 h-5 text-accent" />
                </div>
                <div className="text-xl md:text-2xl font-semibold mb-1">{stats.totalMatches}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card className="card text-center">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 rounded-full bg-success-soft mx-auto flex items-center justify-center mb-2">
                  <MessageCircle className="w-5 h-5 text-success" />
                </div>
                <div className="text-xl md:text-2xl font-semibold mb-1">{stats.mutualMatches}</div>
                <div className="text-xs text-muted-foreground">Mutual</div>
              </CardContent>
            </Card>
            <Card className="card text-center">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 rounded-full bg-warning-soft mx-auto flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-warning" />
                </div>
                <div className="text-xl md:text-2xl font-semibold mb-1">{stats.pendingMatches}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Matches Section - Only show if approved */}
        {profile.status === 'approved' && (
          <>
            <div className="text-center mb-6 space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold">
                Curated For You
              </h2>
              <p className="text-sm text-muted-foreground">
                Handpicked matches based on your preferences
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
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
                  <Card key={match.id} className="card-interactive overflow-hidden animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="relative">
                      <div className="w-full h-64 md:h-80 bg-accent-soft flex items-center justify-center">
                        <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-card shadow-md">
                          <AvatarFallback className="text-3xl md:text-4xl bg-accent text-accent-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-card/90 backdrop-blur-sm border">
                          <Star className="w-3 h-3 mr-1" />
                          {match.compatibility_score}%
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 md:p-6 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">
                          {name}{age && `, ${age}`}
                        </h3>
                        {location && (
                          <div className="flex items-center text-muted-foreground text-sm mb-1">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            {location}
                          </div>
                        )}
                        {otherProfile?.profession && (
                          <div className="flex items-center text-muted-foreground text-sm">
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

                      <Button
                        className="w-full btn-accent"
                        onClick={() => openMatchModal(match)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
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