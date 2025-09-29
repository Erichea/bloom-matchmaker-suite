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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchProfile();
  }, [user, navigate]);

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
      case 'pending':
        return <Clock className="w-5 h-5 text-warning" />;
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
      case 'pending':
        return 'Pending Review';
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
      case 'pending':
        return 'Your profile is under review by our matchmaking team.';
      case 'incomplete':
        return 'Please complete your profile to start receiving matches.';
      default:
        return '';
    }
  };

  if (loading) {
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
      {/* Header */}
      <div className="bg-[--gradient-hero] px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Status */}
        <Card className="card-premium">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {getStatusIcon(profile.status)}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{getStatusText(profile.status)}</h3>
                <p className="text-muted-foreground">{getStatusDescription(profile.status)}</p>
                {profile.completion_percentage && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Profile Completion</span>
                      <span>{profile.completion_percentage}%</span>
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
              {profile.status === 'incomplete' && (
                <Button onClick={() => navigate('/profile-questionnaire')} className="btn-premium">
                  Complete Profile
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchSuggestions.map((match) => (
              <Card key={match.id} className="card-premium group hover:shadow-glow transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary-muted">
                      <AvatarImage src={match.photo} alt={match.name} />
                      <AvatarFallback>{match.name[0]}</AvatarFallback>
                    </Avatar>
                    <Badge className="absolute top-0 right-1/4 bg-primary text-primary-foreground">
                      {match.compatibility}% Match
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {match.name}, {match.age}
                  </CardTitle>
                  <CardDescription className="flex items-center justify-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    {match.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <div className="flex gap-2 pt-2">
                    <Button className="btn-premium flex-1">
                      <Heart className="mr-2 h-4 w-4" />
                      Like
                    </Button>
                    <Button variant="outline" className="flex-1">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMatches.map((match, index) => (
              <Card key={index} className="card-premium">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={match.photo} alt={match.name} />
                      <AvatarFallback>{match.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">{match.name}</h3>
                      <div className="flex items-center mt-1">
                        {match.status === "Date Scheduled" ? (
                          <>
                            <Calendar className="w-4 h-4 mr-1 text-success" />
                            <span className="text-sm text-success font-medium">{match.status}</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4 mr-1 text-primary" />
                            <span className="text-sm text-primary font-medium">{match.status}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {match.date || match.lastMessage}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      {match.status === "Date Scheduled" ? "View Details" : "Message"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-premium text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">12</div>
              <p className="text-muted-foreground">Total Matches</p>
            </CardContent>
          </Card>
          <Card className="card-premium text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-accent mb-2">5</div>
              <p className="text-muted-foreground">Dates This Month</p>
            </CardContent>
          </Card>
          <Card className="card-premium text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-success mb-2">94%</div>
              <p className="text-muted-foreground">Profile Completion</p>
            </CardContent>
          </Card>
            </div>
          </>
        )}

        {profile.status !== 'approved' && (
          <Card className="card-premium text-center">
            <CardContent className="p-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-4">Your Journey Begins Soon</h3>
              <p className="text-muted-foreground text-lg mb-6">
                {profile.status === 'pending' 
                  ? "Our matchmaking team is reviewing your profile. You'll receive an email once approved."
                  : "Complete your profile to begin receiving curated matches from our expert team."
                }
              </p>
              {profile.status === 'incomplete' && (
                <Button onClick={() => navigate('/profile-questionnaire')} className="btn-premium">
                  Complete Your Profile
                </Button>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default ClientDashboard;