import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  X,
  MapPin,
  MessageSquare,
  Instagram
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatAnswer, calculateAge } from "@/config/questionnaireConfig";
import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import { ProfileCardGroup } from "@/components/profile";

interface MatchDetailModalProps {
  match: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchResponse?: () => void;
}

const MatchDetailModal = ({ match, open, onOpenChange, onMatchResponse }: MatchDetailModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [responding, setResponding] = useState(false);
  const [profileAnswers, setProfileAnswers] = useState<Record<string, any>>({});
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [questionnaireQuestions, setQuestionnaireQuestions] = useState<QuestionnaireQuestion[]>([]);

  // Fetch questionnaire questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data: questionsData, error } = await supabase
        .from("questionnaire_questions")
        .select("*")
        .order("question_order", { ascending: true });

      if (error) {
        console.error('Error fetching questionnaire questions:', error);
        return;
      }

      if (questionsData) {
        setQuestionnaireQuestions(questionsData as QuestionnaireQuestion[]);
      }
    };

    fetchQuestions();
  }, []);

  // Fetch profile answers when the modal opens
  useEffect(() => {
    const fetchProfileAnswers = async () => {
      if (!match || !open) return;

      const isProfile1 = match.profile_1_id === match?.current_profile_id;
      const otherProfile = isProfile1 ? match.profile_2 : match.profile_1;

      if (!otherProfile?.user_id) return;

      // First, let's verify the current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('=== RLS DEBUG ===');
      console.log('Current session user:', session?.user?.id);
      console.log('Current auth user from hook:', user?.id);
      console.log('Fetching profile_answers for user_id:', otherProfile.user_id);
      console.log('Match ID:', match.id);
      console.log('Match status:', match.match_status);

      // Fetch profile answers
      const { data: answersData, error: answersError } = await supabase
        .from("profile_answers")
        .select("*")
        .eq("user_id", otherProfile.user_id);

      if (answersError) {
        console.error('Error fetching profile answers:', answersError);
        console.error('Error code:', answersError.code);
        console.error('Error details:', answersError.details);
        console.error('Error hint:', answersError.hint);
        console.error('Error message:', answersError.message);
      }

      const answers: Record<string, any> = {};
      answersData?.forEach((item) => {
        answers[item.question_id] = item.answer;
      });
      console.log('Raw answersData from database:', answersData);
      console.log('Profile Answers Loaded (keyed by question_id):', answers);
      console.log('Profile Answers Keys:', Object.keys(answers));
      console.log('Other Profile Data:', otherProfile);
      setProfileAnswers(answers);
    };

    fetchProfileAnswers();
  }, [match, open, user?.id]);

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
            title: t('match.itsAMatch'),
            description: t('match.mutualInterestInfo'),
            duration: 5000,
          });
        } else {
          toast({
            title: response === 'accepted' ? t('match.responseSentAccepted') : t('match.responseSent'),
            description: response === 'accepted'
              ? t('match.acceptedInfo')
              : t('match.rejectedInfo'),
          });
        }

        onMatchResponse?.();
        onOpenChange(false);
      } else {
        throw new Error(result?.message || t('match.failedResponse'));
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('match.failedResponse'),
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

            {/* Bottom Shadow Gradient for Text Visibility */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none" />

            {/* Photo Indicators */}
            {otherProfilePhotos.length > 1 && (
              <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1.5 z-10">
                {otherProfilePhotos.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200 drop-shadow-md",
                      index === currentPhotoIndex
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Name and Age Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              <div className="flex items-baseline gap-2 text-white">
                <h2 className="text-3xl font-bold drop-shadow-lg">{name.split(' ')[0]}</h2>
                {age && <span className="text-2xl drop-shadow-lg">{age}</span>}
              </div>
              {location && (
                <div className="flex items-center gap-1 text-white/90 mt-1 drop-shadow-md">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-4">
            {/* Mutual Match Celebration - Top of Profile */}
            {isMutualMatch && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="text-4xl">🎉</div>
                  <h3 className="font-semibold text-lg">{t('match.itsAMatch')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('match.contactInfo')}
                  </p>
                  {profileAnswers.instagram_contact && (
                    <div className="pt-3 border-t border-primary/20">
                      <div className="flex items-center justify-center gap-2">
                        <Instagram className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t('match.instagram')}:</span>
                        <span className="text-base font-medium">{formatAnswer(profileAnswers.instagram_contact)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Profile Information - 4 Card Layout */}
            <ProfileCardGroup
              allQuestions={questionnaireQuestions}
              profileAnswers={profileAnswers}
              profile={otherProfile}
              isMutualMatch={isMutualMatch}
            />

            {/* Response Section */}
            {!isMutualMatch && userAccepted ? (
              <div className="space-y-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="text-3xl">💌</div>
                    <h3 className="font-semibold">{t('match.waitingForResponse')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('match.interestShown')}
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
                  {t('match.changeReject')}
                </Button>
              </div>
            ) : userRejected ? (
              <Card className="bg-muted/30">
                <CardContent className="p-6 text-center space-y-2">
                  <div className="text-3xl">✕</div>
                  <h3 className="font-semibold">{t('match.youRejected')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('match.decliningMessage')}
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
                    {t('match.pass')}
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 rounded-full h-14 bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/90"
                    onClick={() => handleResponse('accepted')}
                    disabled={responding}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    {t('match.like')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">{t('match.helpImprove')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('match.feedbackPrompt')}
                </p>
                <Textarea
                  placeholder={t('match.feedbackExample')}
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
                    {t('common.back')}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={submitRejection}
                    disabled={responding}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {responding ? t('common.sending') : t('common.submit')}
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
