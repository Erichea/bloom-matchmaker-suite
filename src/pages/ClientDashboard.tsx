import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  User,
  Settings,
  Sparkles,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Menu,
  LogOut,
  Edit,
  Bell,
  Star,
  Users
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Bloom
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button variant="ghost" className="text-gray-700 hover:text-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Discover
              </Button>
              <Button variant="ghost" className="text-gray-700 hover:text-pink-600">
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </Button>
              <Button variant="ghost" className="text-gray-700 hover:text-pink-600">
                <Heart className="w-4 h-4 mr-2" />
                Likes
              </Button>
            </nav>

            {/* Right Side */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="relative hidden md:flex">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
              </Button>

              {/* Profile Avatar & Menu */}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-1 pr-3 transition-colors">
                    <Avatar className="w-9 h-9 border-2 border-pink-500">
                      <AvatarImage src={profile.photo_url} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Menu className="w-5 h-5 text-gray-600 md:block hidden" />
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <div className="flex flex-col items-center pt-4 pb-6">
                      <Avatar className="w-20 h-20 border-4 border-pink-500 mb-3">
                        <AvatarImage src={profile.photo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-2xl font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <SheetTitle className="text-xl">{fullName}</SheetTitle>
                      <SheetDescription className="text-sm">{profile.email}</SheetDescription>
                      <Badge className={`mt-3 ${getStatusBadgeClass(profile.status)} flex items-center space-x-1`}>
                        {getStatusIcon(profile.status)}
                        <span className="capitalize">{profile.status?.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </SheetHeader>

                  <div className="space-y-2 mt-6">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
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
                      className="w-full justify-start"
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setMenuOpen(false);
                      }}
                    >
                      <Bell className="w-4 h-4 mr-3" />
                      Notifications
                    </Button>
                    <div className="border-t my-4"></div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your matches today</p>
        </div>

        {/* Profile Status Card */}
        {profile.status !== 'approved' && (
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-white to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white rounded-full shadow-md">
                  {profile.status === 'pending_approval' ? (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  ) : profile.status === 'rejected' ? (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {profile.status === 'pending_approval'
                      ? 'Profile Under Review'
                      : profile.status === 'rejected'
                      ? 'Action Required'
                      : 'Complete Your Profile'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {profile.status === 'pending_approval'
                      ? 'Our team is reviewing your profile. You\'ll be notified within 24-48 hours.'
                      : profile.status === 'rejected'
                      ? 'Please review the feedback and update your profile to continue.'
                      : 'Complete your profile to start receiving curated matches.'}
                  </p>

                  {profile.status === 'rejected' && profile.rejection_reason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                      <p className="text-sm font-medium text-red-900 mb-1">Feedback:</p>
                      <p className="text-sm text-red-800">{profile.rejection_reason}</p>
                    </div>
                  )}

                  {profile.completion_percentage !== null && profile.status !== 'pending_approval' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Profile Completion</span>
                        <span className="font-semibold text-gray-900">{profile.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${profile.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(profile.status === 'incomplete' || profile.status === 'rejected') && (
                    <Button
                      onClick={() => navigate('/profile-questionnaire')}
                      className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
                    >
                      {profile.status === 'rejected' ? 'Update Profile' : 'Complete Profile'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-xs text-gray-600">Matches</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-xs text-gray-600">Chats</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-xs text-gray-600">New</div>
            </CardContent>
          </Card>
        </div>

        {/* Matches Section - Only show if approved */}
        {profile.status === 'approved' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-pink-600" />
                New Matches For You
              </h2>
              <Button variant="ghost" size="sm" className="text-pink-600">
                See All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {matchSuggestions.map((match) => (
                <Card key={match.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className="relative">
                    <img
                      src={match.photo}
                      alt={match.name}
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-pink-600 font-semibold border-0">
                        {match.compatibility}% Match
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {match.name}, {match.age}
                    </h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {match.location}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{match.profession}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {match.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-pink-50 text-pink-700">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                        <Heart className="w-4 h-4 mr-2" />
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
          </>
        )}

        {/* Empty State for non-approved users */}
        {profile.status !== 'approved' && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-purple-50 text-center py-16">
            <CardContent>
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="w-10 h-10 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Matches Are Coming!</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {profile.status === 'pending_approval'
                  ? 'Once your profile is approved, you\'ll start seeing curated matches tailored just for you.'
                  : 'Complete your profile to unlock personalized matches from our expert matchmaking team.'}
              </p>
              {profile.status === 'incomplete' && (
                <Button
                  onClick={() => navigate('/profile-questionnaire')}
                  size="lg"
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
                >
                  Complete Your Profile
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 z-40">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center space-y-1 text-pink-600">
            <Sparkles className="w-6 h-6" />
            <span className="text-xs font-medium">Discover</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-500 hover:text-pink-600">
            <Heart className="w-6 h-6" />
            <span className="text-xs font-medium">Likes</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-500 hover:text-pink-600 relative">
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Messages</span>
            <span className="absolute top-0 right-3 w-2 h-2 bg-pink-500 rounded-full"></span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-500 hover:text-pink-600">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default ClientDashboard;