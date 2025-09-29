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
  Edit
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ClientDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
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

  const matchSuggestions = [
    {
      id: 1,
      name: "Alexandra",
      age: 28,
      location: "New York, NY",
      compatibility: 94,
      profession: "Marketing Director",
      interests: ["Photography", "Travel", "Yoga"],
      photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Sofia",
      age: 26,
      location: "San Francisco, CA",
      compatibility: 91,
      profession: "UX Designer",
      interests: ["Art", "Hiking", "Coffee"],
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "Emma",
      age: 30,
      location: "Los Angeles, CA",
      compatibility: 88,
      profession: "Architect",
      interests: ["Design", "Music", "Cooking"],
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face"
    }
  ];

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
                <div className="text-2xl font-light text-foreground mb-1">12</div>
                <div className="text-xs text-muted-foreground font-light">Matches</div>
              </CardContent>
            </Card>
            <Card className="card-premium text-center hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="illustration-icon mx-auto bg-primary/10 mb-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl font-light text-foreground mb-1">5</div>
                <div className="text-xs text-muted-foreground font-light">Chats</div>
              </CardContent>
            </Card>
            <Card className="card-premium text-center hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="illustration-icon mx-auto bg-success/10 mb-3">
                  <Sparkles className="w-5 h-5 text-success animate-float" />
                </div>
                <div className="text-2xl font-light text-foreground mb-1">3</div>
                <div className="text-xs text-muted-foreground font-light">New</div>
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
              {matchSuggestions.map((match, index) => (
                <Card key={match.id} className="card-premium overflow-hidden group animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="relative">
                    <img
                      src={match.photo}
                      alt={match.name}
                      className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-surface/90 backdrop-blur-sm text-accent border-accent/20 font-light">
                        {match.compatibility}% Match
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-light text-foreground mb-1">
                        {match.name}, {match.age}
                      </h3>
                      <div className="flex items-center text-muted-foreground text-sm font-light mb-2">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {match.location}
                      </div>
                      <p className="text-sm text-muted-foreground font-light">{match.profession}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {match.interests.map((interest, idx) => (
                        <span key={idx} className="trait-tag text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <Button className="flex-1 btn-premium group">
                        <Heart className="w-4 h-4 mr-2 group-hover:animate-pulse-soft" />
                        Connect
                      </Button>
                      <Button variant="outline" className="flex-1 btn-soft font-light">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Empty State for non-approved users */}
        {profile.status !== 'approved' && (
          <Card className="card-premium text-center py-20">
            <CardContent className="space-y-6">
              <div className="illustration-icon mx-auto bg-accent/10">
                <Heart className="w-8 h-8 text-accent animate-pulse-soft" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-light text-foreground">Your Matches Await</h3>
                <p className="text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
                  {profile.status === 'pending_approval'
                    ? 'Once your profile is approved, you\'ll discover curated matches tailored to your preferences.'
                    : 'Share your story with us, and we\'ll connect you with compatible individuals.'}
                </p>
              </div>
              {profile.status === 'incomplete' && (
                <Button
                  onClick={() => navigate('/profile-questionnaire')}
                  className="btn-premium"
                >
                  Complete Your Profile
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;