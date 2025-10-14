import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  X,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  User,
  MessageSquare,
  Sparkles,
  Target,
  Home,
  GraduationCap,
  Ruler,
  Users,
  Church,
  Wine,
  Cigarette,
  Baby
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MatchDetailModalProps {
  match: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchResponse?: () => void;
}

const MatchDetailModal = ({ match, open, onOpenChange, onMatchResponse }: MatchDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [responding, setResponding] = useState(false);
  const [profileAnswers, setProfileAnswers] = useState<Record<string, any>>({});
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch profile answers when the modal opens
  useEffect(() => {
    const fetchProfileAnswers = async () => {
      if (!match || !open) return;

      const isProfile1 = match.profile_1_id === match?.current_profile_id;
      const otherProfile = isProfile1 ? match.profile_2 : match.profile_1;

      if (!otherProfile?.user_id) return;

      // Fetch profile answers
      const { data: answersData } = await supabase
        .from("profile_answers")
        .select("*")
        .eq("user_id", otherProfile.user_id);

      const answers: Record<string, any> = {};
      answersData?.forEach((item) => {
        answers[item.question_id] = item.answer;
      });
      console.log('Profile Answers Loaded:', answers);
      console.log('Other Profile Data:', otherProfile);
      setProfileAnswers(answers);
    };

    fetchProfileAnswers();
  }, [match, open]);

  // Reset photo index when modal opens
  useEffect(() => {
    if (open) {
      setCurrentPhotoIndex(0);
    }
  }, [open]);

  // Handle scroll for photo gallery
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const width = container.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentPhotoIndex(index);
  };

  if (!match) return null;

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

  const getProfilePhoto = (profile: any): string | null => {
    if (!profile) return null;
    if (profile.photo_url) return profile.photo_url;
    const photos = Array.isArray(profile.profile_photos) ? profile.profile_photos : [];
    if (!photos.length) return null;
    const sorted = [...photos].sort((a, b) => {
      if (a.is_primary === b.is_primary) {
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      }
      return a.is_primary ? -1 : 1;
    });
    return sorted[0]?.photo_url ?? null;
  };

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

  const handleResponse = async (response: 'accepted' | 'rejected') => {
    if (!user?.id) return;

    setResponding(true);
    try {
      const { data, error } = await supabase
        .rpc('respond_to_match', {
          p_match_id: match.id,
          p_user_id: user.id,
          p_response: response,
          p_feedback: response === 'rejected' ? feedback : null
        });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        if (result.is_mutual_match) {
          // Show celebration modal for mutual match
          toast({
            title: "🎉 It's a Match!",
            description: "Both of you are interested! You can now exchange contact information.",
            duration: 5000,
          });
        } else {
          toast({
            title: response === 'accepted' ? "Response Sent! ❤️" : "Response Sent",
            description: response === 'accepted' 
              ? "We've let them know you're interested. We'll notify you if they feel the same!"
              : "Thanks for your feedback. We'll use this to improve future matches.",
          });
        }
        
        onMatchResponse?.();
        onOpenChange(false);
      } else {
        throw new Error(result?.message || 'Failed to respond to match');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setResponding(false);
      setShowFeedbackForm(false);
      setFeedback("");
    }
  };

  const handleReject = () => {
    setShowFeedbackForm(true);
  };

  const submitRejection = () => {
    handleResponse('rejected');
  };

  // Get the other person's profile (not the current user)
  const isProfile1 = match.profile_1_id === match?.current_profile_id;
  const currentUserProfile = isProfile1 ? match.profile_1 : match.profile_2;
  const otherProfile = isProfile1 ? match.profile_2 : match.profile_1;
  const currentUserResponse = isProfile1 ? match.profile_1_response : match.profile_2_response;
  const otherUserResponse = isProfile1 ? match.profile_2_response : match.profile_1_response;

  if (!otherProfile) return null;

  const name = `${otherProfile.first_name || ''} ${otherProfile.last_name || ''}`.trim();
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  const age = otherProfile.date_of_birth ? calculateAge(otherProfile.date_of_birth) : null;
  const location = [otherProfile.city, otherProfile.country].filter(Boolean).join(', ');
  const otherProfilePhotos = Array.isArray(otherProfile?.photos)
    ? otherProfile.photos.filter((photo: any) => photo && photo.photo_url)
    : [];
  const otherProfilePhoto = otherProfilePhotos.length > 0
    ? otherProfilePhotos[0].photo_url
    : getProfilePhoto(otherProfile);

  // Determine match state
  const isMutualMatch = match.match_status === "both_accepted";
  const hasResponded = currentUserResponse !== null;
  const userAccepted = currentUserResponse === "accepted";
  const userRejected = currentUserResponse === "rejected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Match Profile</DialogTitle>
          <DialogDescription>
            Review this curated match and decide if you'd like to connect
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-0">
          {/* Horizontal Scrollable Photo Gallery */}
          <div className="relative w-full">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {otherProfilePhotos.length > 0 ? (
                otherProfilePhotos.map((photo: any, index: number) => (
                  <div
                    key={photo.id ?? photo.photo_url ?? index}
                    className="w-full flex-shrink-0 snap-center"
                  >
                    <div className="relative aspect-[3/4] w-full bg-muted">
                      <img
                        src={photo.photo_url}
                        alt={`${name || "Match"} photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full flex-shrink-0 snap-center">
                  <div className="relative aspect-[3/4] w-full bg-muted flex items-center justify-center">
                    <Avatar className="h-32 w-32">
                      <AvatarFallback className="bg-primary-muted text-4xl text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              )}
            </div>

            {/* Photo Indicators */}
            {otherProfilePhotos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {otherProfilePhotos.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200",
                      index === currentPhotoIndex
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Name and Age Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <div className="flex items-baseline gap-2 text-white">
                <h2 className="text-3xl font-bold">{name.split(' ')[0]}</h2>
                {age && <span className="text-2xl">{age}</span>}
              </div>
              {location && (
                <div className="flex items-center gap-1 text-white/90 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-5">
            {/* Section 1: Interests & Passions */}
            {profileAnswers.interests && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-serif text-lg font-medium">Interests & Passions</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formatAnswer(profileAnswers.interests).split(', ').map((interest: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-sm font-normal">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 2: Relationship Philosophy */}
            {(profileAnswers.relationship_values || profileAnswers.relationship_keys) && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-primary" />
                    <h3 className="font-serif text-lg font-medium">Relationship Philosophy</h3>
                  </div>
                  
                  {profileAnswers.relationship_values && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">What I value in a relationship</p>
                      <p className="text-base leading-relaxed">{formatAnswer(profileAnswers.relationship_values)}</p>
                    </div>
                  )}

                  {profileAnswers.relationship_keys && (
                    <div className={cn(profileAnswers.relationship_values && "pt-4 border-t")}>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Key to a good relationship</p>
                      <p className="text-base leading-relaxed">{formatAnswer(profileAnswers.relationship_keys)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Section 3: Personal Details */}
            {(profileAnswers.gender || profileAnswers.city || otherProfile.city || profileAnswers.education_level || 
              profileAnswers.height || otherProfile.height_cm || profileAnswers.ethnicity || profileAnswers.religion || 
              profileAnswers.profession) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="font-serif text-lg font-medium">Personal Details</h3>
                  </div>
                  <div className="grid gap-3">
                    {profileAnswers.gender && (
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Gender</span>
                          <p className="text-base capitalize">{formatAnswer(profileAnswers.gender)}</p>
                        </div>
                      </div>
                    )}

                    {(otherProfile.city || profileAnswers.city) && (
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Location</span>
                          <p className="text-base">{otherProfile.city || formatAnswer(profileAnswers.city)}</p>
                        </div>
                      </div>
                    )}

                    {profileAnswers.profession && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Profession</span>
                          <p className="text-base">{formatAnswer(profileAnswers.profession)}</p>
                        </div>
                      </div>
                    )}

                    {profileAnswers.education_level && (
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Education</span>
                          <p className="text-base">{formatAnswer(profileAnswers.education_level)}</p>
                        </div>
                      </div>
                    )}

                    {(otherProfile.height_cm || profileAnswers.height) && (
                      <div className="flex items-center gap-3">
                        <Ruler className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Height</span>
                          <p className="text-base">
                            {otherProfile.height_cm ? `${otherProfile.height_cm} cm` : `${formatAnswer(profileAnswers.height)} cm`}
                          </p>
                        </div>
                      </div>
                    )}

                    {profileAnswers.ethnicity && (
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Ethnicity</span>
                          <p className="text-base">{formatAnswer(profileAnswers.ethnicity)}</p>
                        </div>
                      </div>
                    )}

                    {profileAnswers.religion && (
                      <div className="flex items-center gap-3">
                        <Church className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Religion</span>
                          <p className="text-base">{formatAnswer(profileAnswers.religion)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 4: Lifestyle */}
            {(profileAnswers.alcohol || profileAnswers.smoking) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-primary" />
                    <h3 className="font-serif text-lg font-medium">Lifestyle</h3>
                  </div>
                  <div className="grid gap-3">
                    {profileAnswers.alcohol && (
                      <div className="flex items-center gap-3">
                        <Wine className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Drinking</span>
                          <p className="text-base">{formatAnswer(profileAnswers.alcohol)}</p>
                        </div>
                      </div>
                    )}

                    {profileAnswers.smoking && (
                      <div className="flex items-center gap-3">
                        <Cigarette className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Smoking</span>
                          <p className="text-base">{formatAnswer(profileAnswers.smoking)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 5: Future Goals */}
            {(profileAnswers.marriage || profileAnswers.marriage_timeline || profileAnswers.dating_preference) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-serif text-lg font-medium">Future Goals</h3>
                  </div>
                  <div className="grid gap-3">
                    {profileAnswers.dating_preference && (
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Looking for</span>
                          <p className="text-base">{formatAnswer(profileAnswers.dating_preference)}</p>
                        </div>
                      </div>
                    )}

                    {profileAnswers.marriage && (
                      <div className="flex items-center gap-3">
                        <Baby className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Marriage</span>
                          <p className="text-base">{formatAnswer(profileAnswers.marriage)}</p>
                        </div>
                      </div>
                    )}

                    {profileAnswers.marriage_timeline && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">Timeline</span>
                          <p className="text-base">{formatAnswer(profileAnswers.marriage_timeline)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 6: Personality (Optional) */}
            {profileAnswers.mbti && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-serif text-lg font-medium">Personality</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">MBTI Type</span>
                      <p className="text-base font-medium">{formatAnswer(profileAnswers.mbti)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Response Section */}
            {isMutualMatch ? (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-4xl">🎉</div>
                  <h3 className="font-semibold text-lg">It's a Match!</h3>
                  <p className="text-sm text-muted-foreground">
                    Both of you are interested! You can now exchange contact information.
                  </p>
                </CardContent>
              </Card>
            ) : userAccepted ? (
              <div className="space-y-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="text-3xl">💌</div>
                    <h3 className="font-semibold">Waiting for their response</h3>
                    <p className="text-sm text-muted-foreground">
                      You've shown interest. We'll notify you if they feel the same!
                    </p>
                  </CardContent>
                </Card>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReject}
                  disabled={responding}
                >
                  <X className="w-4 h-4 mr-2" />
                  Change mind and reject
                </Button>
              </div>
            ) : userRejected ? (
              <Card className="bg-muted/30">
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-3xl">✕</div>
                  <h3 className="font-semibold">You rejected this match</h3>
                  <p className="text-sm text-muted-foreground">
                    This match has been declined. We'll keep finding better connections for you.
                  </p>
                </CardContent>
              </Card>
            ) : !showFeedbackForm ? (
              <div className="space-y-4 sticky bottom-0 bg-background pt-4 pb-2">
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 rounded-full h-14 border-2"
                    onClick={handleReject}
                    disabled={responding}
                  >
                    <X className="w-5 h-5 mr-2" />
                    Pass
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 rounded-full h-14 bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/90"
                    onClick={() => handleResponse('accepted')}
                    disabled={responding}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Like
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">Optional: Help us improve</h3>
                <p className="text-sm text-muted-foreground">
                  Any feedback on why this match isn't right for you? (Optional)
                </p>
                <Textarea
                  placeholder="e.g., Different life goals, not my type, etc."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowFeedbackForm(false)}
                    disabled={responding}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={submitRejection}
                    disabled={responding}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {responding ? "Sending..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchDetailModal;
