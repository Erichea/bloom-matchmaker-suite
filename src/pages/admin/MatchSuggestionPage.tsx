import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Filter,
  Heart,
  MapPin,
  Briefcase,
  Star,
  Plus,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  country: string;
  profession: string;
  gender: string;
  date_of_birth: string;
  preferred_gender: string;
  preferred_min_age?: number;
  preferred_max_age?: number;
  user_id: string;
}

interface ProfileAnswers {
  question_id: string;
  answer: any;
}

const MatchSuggestionPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageRangeFilter, setAgeRangeFilter] = useState("all");
  const [profileAnswers, setProfileAnswers] = useState<Record<string, ProfileAnswers[]>>({});
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchApprovedProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm, genderFilter, ageRangeFilter]);

  const fetchApprovedProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileAnswers = async (userIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('profile_answers')
        .select('*')
        .in('user_id', userIds);

      if (error) throw error;

      const answersMap: Record<string, ProfileAnswers[]> = {};
      data?.forEach(answer => {
        if (!answersMap[answer.user_id]) {
          answersMap[answer.user_id] = [];
        }
        answersMap[answer.user_id].push(answer);
      });

      setProfileAnswers(answersMap);
    } catch (error: any) {
      console.error('Error fetching profile answers:', error);
    }
  };

  const filterProfiles = () => {
    let filtered = profiles;

    if (searchTerm) {
      filtered = filtered.filter(profile => {
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
      });
    }

    if (genderFilter !== "all") {
      filtered = filtered.filter(profile => profile.gender === genderFilter);
    }

    if (ageRangeFilter !== "all") {
      filtered = filtered.filter(profile => {
        if (!profile.date_of_birth) return false;
        const age = calculateAge(profile.date_of_birth);
        
        switch (ageRangeFilter) {
          case "18-25": return age >= 18 && age <= 25;
          case "26-35": return age >= 26 && age <= 35;
          case "36-45": return age >= 36 && age <= 45;
          case "46+": return age >= 46;
          default: return true;
        }
      });
    }

    setFilteredProfiles(filtered);
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

  const getInterests = (userAnswers: ProfileAnswers[]) => {
    const interestsAnswer = userAnswers?.find(a => a.question_id === 'interests');
    return Array.isArray(interestsAnswer?.answer) ? interestsAnswer.answer : [];
  };

  const openMatchModal = async (profile: Profile) => {
    setSelectedProfile(profile);
    setModalOpen(true);

    // Find potential matches (excluding the selected profile)
    const otherProfiles = profiles.filter(p => 
      p.id !== profile.id && 
      (!profile.preferred_gender || profile.preferred_gender === 'any' || p.gender === profile.preferred_gender)
    );

    // Fetch answers for all profiles
    const allUserIds = [profile.user_id, ...otherProfiles.map(p => p.user_id)];
    await fetchProfileAnswers(allUserIds);

    // Calculate compatibility scores
    const matchesWithScores = await Promise.all(
      otherProfiles.map(async (otherProfile) => {
        const { data: score } = await supabase
          .rpc('calculate_compatibility_score', {
            p_profile_1_id: profile.id,
            p_profile_2_id: otherProfile.id
          });

        return {
          ...otherProfile,
          compatibilityScore: score || 0
        };
      })
    );

    // Sort by compatibility score
    matchesWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    setPotentialMatches(matchesWithScores);
  };

  const createMatch = async (profile1: Profile, profile2: Profile, compatibilityScore: number) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('matches')
        .insert({
          profile_1_id: profile1.id,
          profile_2_id: profile2.id,
          compatibility_score: compatibilityScore,
          suggested_by: user.id,
          suggested_at: new Date().toISOString(),
          match_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Match Created! 💕",
        description: `Successfully suggested ${profile1.first_name} and ${profile2.first_name} as a match.`
      });

      setModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create match. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Match Suggestions</h1>
            <p className="text-muted-foreground mt-2">
              Create matches between approved profiles
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Find Profiles</CardTitle>
            <CardDescription>Search and filter through approved profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46+">46+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProfiles.map((profile) => {
                const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
                const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
                const location = [profile.city, profile.country].filter(Boolean).join(', ');
                const interests = getInterests(profileAnswers[profile.user_id] || []);

                return (
                  <Card key={profile.id} className="card-premium hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-primary-muted text-primary text-lg font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{name}</h3>
                          {age && (
                            <p className="text-sm text-muted-foreground">Age {age}</p>
                          )}
                          {location && (
                            <div className="flex items-center justify-center text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              {location}
                            </div>
                          )}
                          {profile.profession && (
                            <div className="flex items-center justify-center text-sm text-muted-foreground">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {profile.profession}
                            </div>
                          )}
                        </div>

                        {interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {interests.slice(0, 3).map((interest: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                            {interests.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{interests.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <Dialog open={modalOpen && selectedProfile?.id === profile.id} onOpenChange={setModalOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              className="btn-premium w-full"
                              onClick={() => openMatchModal(profile)}
                            >
                              <Heart className="w-4 h-4 mr-2" />
                              Suggest Match
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Find Match for {selectedProfile?.first_name}</DialogTitle>
                              <DialogDescription>
                                Select a compatible profile to create a match suggestion
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Selected Profile Summary */}
                              {selectedProfile && (
                                <Card className="bg-primary/5 border-primary/20">
                                  <CardContent className="p-4">
                                    <div className="flex items-center space-x-4">
                                      <Avatar className="w-12 h-12">
                                        <AvatarFallback className="bg-primary-muted text-primary">
                                          {`${selectedProfile.first_name?.[0]}${selectedProfile.last_name?.[0]}`}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h4 className="font-semibold">
                                          {selectedProfile.first_name} {selectedProfile.last_name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedProfile.date_of_birth && `Age ${calculateAge(selectedProfile.date_of_birth)}`} • {selectedProfile.city}, {selectedProfile.country}
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Potential Matches */}
                              <div className="space-y-3">
                                <h4 className="font-semibold">Compatible Profiles</h4>
                                {potentialMatches.map((match) => {
                                  const matchName = `${match.first_name || ''} ${match.last_name || ''}`.trim();
                                  const matchInitials = matchName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                                  const matchAge = match.date_of_birth ? calculateAge(match.date_of_birth) : null;
                                  
                                  return (
                                    <Card key={match.id} className="border hover:bg-muted/30 transition-colors">
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-4">
                                            <Avatar className="w-10 h-10">
                                              <AvatarFallback>{matchInitials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <h5 className="font-medium">{matchName}</h5>
                                              <p className="text-sm text-muted-foreground">
                                                {matchAge && `Age ${matchAge}`} • {match.city}, {match.country}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-3">
                                            <div className="text-right">
                                              <div className="flex items-center space-x-1">
                                                <Star className="w-4 h-4 text-yellow-500" />
                                                <span className="font-semibold">{match.compatibilityScore}%</span>
                                              </div>
                                              <p className="text-xs text-muted-foreground">Compatibility</p>
                                            </div>
                                            <Button
                                              size="sm"
                                              className="btn-premium"
                                              onClick={() => selectedProfile && createMatch(selectedProfile, match, match.compatibilityScore)}
                                            >
                                              <Plus className="w-4 h-4 mr-1" />
                                              Create Match
                                            </Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProfiles.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No approved profiles found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatchSuggestionPage;