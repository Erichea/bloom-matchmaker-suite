import { useState, useEffect } from "react";
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
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

  // Fetch profile answers when the modal opens
  useEffect(() => {
    const fetchProfileAnswers = async () => {
      if (!match || !open) return;

      const isProfile1 = match.profile_1_id === match?.current_profile_id;
      const otherProfile = isProfile1 ? match.profile_2 : match.profile_1;

      if (!otherProfile?.user_id) return;

      try {
        const { data, error } = await supabase
          .from("profile_answers")
          .select("question_id, answer")
          .eq("user_id", otherProfile.user_id);

        if (error) throw error;

        // Convert array to object for easier access
        const answersMap: Record<string, any> = {};
        data?.forEach((item) => {
          answersMap[item.question_id] = item.answer;
        });

        setProfileAnswers(answersMap);
      } catch (error) {
        console.error("Error fetching profile answers:", error);
      }
    };

    fetchProfileAnswers();
  }, [match, open]);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-primary" />
            <span>Match Profile</span>
          </DialogTitle>
          <DialogDescription>
            Review this curated match and decide if you'd like to connect
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <Avatar className="mx-auto h-24 w-24 border-4 border-primary/20">
              {otherProfilePhoto ? (
                <AvatarImage src={otherProfilePhoto} alt={name || "Match"} />
              ) : (
                <AvatarFallback className="bg-primary-muted text-2xl text-primary">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{name}</h2>
              {age && (
                <p className="text-muted-foreground">{age} years old</p>
              )}
              {location && (
                <div className="flex items-center justify-center text-muted-foreground mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {location}
                </div>
              )}
            </div>

            {otherProfilePhotos.length > 0 && (
              <div className="space-y-2 text-left">
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Gallery</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {otherProfilePhotos.map((photo: any, index: number) => (
                    <div
                      key={photo.id ?? photo.photo_url ?? index}
                      className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/40"
                    >
                      <img
                        src={photo.photo_url}
                        alt={`${name || "Match"} photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Star className="w-3 h-3 mr-1" />
              {match.compatibility_score}% Compatible
            </Badge>
          </div>

          {/* Basic Information */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold flex items-center">
                <User className="w-4 h-4 mr-2" />
                About
              </h3>

              {otherProfile.profession && (
                <div className="flex items-start text-sm">
                  <Briefcase className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Profession: </span>
                    <span>{otherProfile.profession}</span>
                  </div>
                </div>
              )}

              {otherProfile.education && (
                <div className="flex items-start text-sm">
                  <Calendar className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Education: </span>
                    <span className="capitalize">{otherProfile.education.replace('_', ' ')}</span>
                  </div>
                </div>
              )}

              {otherProfile.height_cm && (
                <div className="flex items-start text-sm">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Height: </span>
                    <span>{otherProfile.height_cm} cm</span>
                  </div>
                </div>
              )}

              {otherProfile.ethnicity && (
                <div className="flex items-start text-sm">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Ethnicity: </span>
                    <span>{otherProfile.ethnicity}</span>
                  </div>
                </div>
              )}

              {otherProfile.faith && (
                <div className="flex items-start text-sm">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Religion: </span>
                    <span>{otherProfile.faith}</span>
                  </div>
                </div>
              )}

              {profileAnswers.alcohol && (
                <div className="flex items-start text-sm">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Drinking: </span>
                    <span>{formatAnswer(profileAnswers.alcohol)}</span>
                  </div>
                </div>
              )}

              {profileAnswers.smoking && (
                <div className="flex items-start text-sm">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Smoking: </span>
                    <span>{formatAnswer(profileAnswers.smoking)}</span>
                  </div>
                </div>
              )}

              {(otherProfile.interests || profileAnswers.interests) && (
                <div className="flex items-start text-sm">
                  <Star className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Interests: </span>
                    <span>{formatAnswer(otherProfile.interests || profileAnswers.interests)}</span>
                  </div>
                </div>
              )}

              {profileAnswers.mbti && (
                <div className="flex items-start text-sm">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">MBTI: </span>
                    <span>{formatAnswer(profileAnswers.mbti)}</span>
                  </div>
                </div>
              )}

              {profileAnswers.relationship_keys && (
                <div className="flex items-start text-sm">
                  <Heart className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">Key elements for a good relationship: </span>
                    <span>{formatAnswer(profileAnswers.relationship_keys)}</span>
                  </div>
                </div>
              )}

              {otherProfile.about_me && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {otherProfile.about_me}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compatibility Breakdown */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Why We Matched You</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Shared Interests</span>
                  <span className="text-primary font-medium">High</span>
                </div>
                <div className="flex justify-between">
                  <span>Location Compatibility</span>
                  <span className="text-primary font-medium">
                    {otherProfile.city === currentUserProfile?.city ? 'Same City' : 'Same Country'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Age Preference</span>
                  <span className="text-primary font-medium">Perfect Match</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
            <div className="space-y-4">
              <h3 className="font-semibold text-center">What do you think?</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={responding}
                >
                  <X className="w-4 h-4 mr-2" />
                  Not for me
                </Button>
                <Button
                  className="flex-1 btn-premium"
                  onClick={() => handleResponse('accepted')}
                  disabled={responding}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  I'm Interested
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
      </DialogContent>
    </Dialog>
  );
};

export default MatchDetailModal;
