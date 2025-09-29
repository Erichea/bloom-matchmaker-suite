import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, User, Settings, Sparkles, MapPin, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ClientDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ClientDashboard useEffect:', { user: !!user, authLoading });

    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate("/auth");
      return;
    }

    console.log('User found, fetching profile');
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
      // First, recalculate the completion percentage
      const { data: completionData } = await supabase
        .rpc('calculate_questionnaire_completion', { p_user_id: user.id });

      // Update the profile with the latest completion percentage
      if (completionData !== null) {
        await supabase
          .from('profiles')
          .update({ completion_percentage: completionData })
          .eq('user_id', user.id);
      }

      // Now fetch the updated profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // No profile found, create a basic one
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-warning" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'incomplete':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Profile Approved';
      case 'pending_approval':
        return 'Pending Review';
      case 'rejected':
        return 'Profile Needs Revision';
      case 'incomplete':
        return 'Profile Incomplete';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Your profile has been approved and you can now receive matches.';
      case 'pending_approval':
        return 'Your profile is under review by our matchmaking team.';
      case 'rejected':
        return 'Please review the feedback below and update your profile.';
      case 'incomplete':
        return 'Please complete your profile to start receiving matches.';
      default:
        return '';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect to profile setup
  }
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

  const activeMatches = [
    {
      name: "Isabella",
      status: "Date Scheduled",
      date: "Tomorrow, 7:00 PM",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Olivia",
      status: "Conversation Started",
      lastMessage: "Looking forward to meeting!",
      photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Responsive Header */}
      <div className="bg-[--gradient-hero] px-4 sm:px-6 py-6 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout */}
          <div className="block lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Hi, {profile.first_name || 'Member'}!
                  </h1>
                  <p className="text-white/70 text-xs">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              {getStatusIcon(profile.status)}
              <span className="text-white/90 text-sm">
                {getStatusText(profile.status)}
              </span>
              {profile.completion_percentage !== null && profile.completion_percentage !== undefined && (
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className="text-white font-semibold text-xs">
                    {profile.completion_percentage}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">
                  Welcome back, {profile.first_name || 'Member'}!
                </h1>
                <div className="flex items-center space-x-3 mb-2">
                  {getStatusIcon(profile.status)}
                  <span className="text-white/90 text-lg">
                    {getStatusText(profile.status)}
                  </span>
                  {profile.completion_percentage !== null && profile.completion_percentage !== undefined && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white font-semibold text-sm">
                        {profile.completion_percentage}% Complete
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-white/70 text-sm">
                  {user?.email} • Member since {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right text-white/80 mr-4">
                <p className="text-sm">Signed in as</p>
                <p className="font-semibold">{profile.first_name} {profile.last_name}</p>
              </div>
              <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="destructive"
                className="bg-red-500/80 text-white border-red-400/50 hover:bg-red-600/80"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Profile Status */}
        <Card className="card-premium">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {getStatusIcon(profile.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold">{getStatusText(profile.status)}</h3>
                  <p className="text-muted-foreground text-sm">{getStatusDescription(profile.status)}</p>

                  {profile.status === 'rejected' && profile.rejection_reason && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-destructive mb-1">Feedback from our team:</p>
                      <p className="text-sm text-foreground">{profile.rejection_reason}</p>
                    </div>
                  )}

                  {profile.completion_percentage !== null && profile.completion_percentage !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Profile Completion</span>
                        <span className="font-medium">{profile.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${profile.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {(profile.status === 'incomplete' || profile.status === 'rejected') && (
                <Button
                  onClick={() => navigate('/profile-questionnaire')}
                  className="btn-premium w-full sm:w-auto"
                  size="sm"
                >
                  {profile.status === 'rejected' ? 'Update Profile' : 'Complete Profile'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {profile.status === 'approved' && (
          <>
            {/* New Suggestions */}
            <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-primary" />
              New Suggestions for You
            </h2>
            <Badge className="badge-pending">
              3 new matches
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {matchSuggestions.map((match) => (
              <Card key={match.id} className="card-premium group hover:shadow-glow transition-all duration-300">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 ring-4 ring-primary-muted">
                      <AvatarImage src={match.photo} alt={match.name} />
                      <AvatarFallback>{match.name[0]}</AvatarFallback>
                    </Avatar>
                    <Badge className="absolute top-0 right-1/4 bg-primary text-primary-foreground text-xs">
                      {match.compatibility}%
                    </Badge>
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-semibold">
                    {match.name}, {match.age}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center text-muted-foreground text-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    {match.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">{match.profession}</p>
                    <div className="flex flex-wrap gap-1">
                      {match.interests.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button className="btn-premium flex-1" size="sm">
                      <Heart className="mr-2 h-4 w-4" />
                      Like
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Matches */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <MessageCircle className="mr-2 h-6 w-6 text-accent" />
            Your Active Matches
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {activeMatches.map((match, index) => (
              <Card key={index} className="card-premium">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                      <AvatarImage src={match.photo} alt={match.name} />
                      <AvatarFallback>{match.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">{match.name}</h3>
                      <div className="flex items-center mt-1">
                        {match.status === "Date Scheduled" ? (
                          <>
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-success flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-success font-medium">{match.status}</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-primary flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-primary font-medium">{match.status}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                        {match.date || match.lastMessage}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm flex-shrink-0">
                      {match.status === "Date Scheduled" ? "Details" : "Message"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <Card className="card-premium text-center">
            <CardContent className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">12</div>
              <p className="text-muted-foreground text-xs sm:text-sm">Total Matches</p>
            </CardContent>
          </Card>
          <Card className="card-premium text-center">
            <CardContent className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-accent mb-1 sm:mb-2">5</div>
              <p className="text-muted-foreground text-xs sm:text-sm">Dates This Month</p>
            </CardContent>
          </Card>
          <Card className="card-premium text-center col-span-2 sm:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl font-bold text-success mb-1 sm:mb-2">94%</div>
              <p className="text-muted-foreground text-xs sm:text-sm">Profile Complete</p>
            </CardContent>
          </Card>
        </div>
          </>
        )}

        {profile.status !== 'approved' && (
          <Card className="card-premium text-center">
            <CardContent className="p-6 sm:p-12">
              {profile.status === 'pending_approval' ? (
                <>
                  <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-warning" />
                  <h3 className="text-xl sm:text-2xl font-semibold mb-4">Your Profile Is Under Review</h3>
                  <p className="text-muted-foreground text-sm sm:text-lg mb-6">
                    Our matchmaking team is carefully reviewing your profile. You'll receive an email once approved. This usually takes 24-48 hours.
                  </p>
                </>
              ) : profile.status === 'rejected' ? (
                <>
                  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-destructive" />
                  <h3 className="text-xl sm:text-2xl font-semibold mb-4">Action Required</h3>
                  <p className="text-muted-foreground text-sm sm:text-lg mb-6">
                    Please review the feedback above and update your profile. Once updated, you can submit for review again.
                  </p>
                  <Button
                    onClick={() => navigate('/profile-questionnaire')}
                    className="btn-premium w-full sm:w-auto"
                  >
                    Update Your Profile
                  </Button>
                </>
              ) : (
                <>
                  <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl sm:text-2xl font-semibold mb-4">Your Journey Begins Soon</h3>
                  <p className="text-muted-foreground text-sm sm:text-lg mb-6">
                    Complete your profile to begin receiving curated matches from our expert team.
                  </p>
                  <Button
                    onClick={() => navigate('/profile-questionnaire')}
                    className="btn-premium w-full sm:w-auto"
                  >
                    Complete Your Profile
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default ClientDashboard;