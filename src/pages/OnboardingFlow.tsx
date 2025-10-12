import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingQuestionnaire } from "@/hooks/useOnboardingQuestionnaire";
import { useToast } from "@/hooks/use-toast";
import { OnboardingProgressDots } from "@/components/onboarding/OnboardingProgressDots";
import { QuestionScreen } from "@/components/onboarding/QuestionScreen";
import { TransitionScreen } from "@/components/onboarding/TransitionScreen";
import { PhotoUploadGrid } from "@/components/PhotoUploadGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

type OnboardingStep = "photos" | "questionnaire" | "transition" | "complete";

// Question 17 is 'mbti' - the last profile question
// Question 18 is 'education_importance' - the first preference question
const PROFILE_SECTION_END_INDEX = 16; // 0-indexed, so question 17

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("photos");
  const [photos, setPhotos] = useState<any[]>([]);
  const [profileId, setProfileId] = useState<string>("");

  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    saveAnswer,
    profile,
    loading,
  } = useOnboardingQuestionnaire(user?.id);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load profile and photos
    const loadProfile = async () => {
      const { data: profileRows, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      let profileData = (profileRows && profileRows[0]) || null;

      if (!profileData) {
        // Get first and last name from user metadata
        const firstName = user.user_metadata?.first_name || '';
        const lastName = user.user_metadata?.last_name || '';

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            status: "incomplete",
          })
          .select()
          .single();

        if (insertError) {
          if ((insertError as any)?.code === '23505') {
            const { data: existing, error: existingError } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1);

            if (existingError) {
              console.error("Error loading existing profile after conflict:", existingError);
              toast({
                title: "Error",
                description: "Failed to load profile. Please try again.",
                variant: "destructive",
              });
              return;
            }

            profileData = existing?.[0] ?? null;
          } else {
            console.error("Error creating profile:", insertError);
            toast({
              title: "Error",
              description: "Failed to create profile. Please try again.",
              variant: "destructive",
            });
            return;
          }
        } else {
          profileData = newProfile;
        }
      }

      if (profileData) {
        setProfileId(profileData.id);

        // Load photos
        const { data: photosData } = await supabase
          .from("profile_photos")
          .select("*")
          .eq("profile_id", profileData.id)
          .order("order_index");

        setPhotos(photosData || []);

        // Determine starting step based on progress
        if ((photosData?.length || 0) >= 1 && profileData.status !== "pending_approval") {
          setCurrentStep("questionnaire");
        }
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handlePhotoComplete = () => {
    if (photos.length < 1) {
      toast({
        title: "At least 1 photo required",
        description: "Please upload at least 1 photo to continue",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep("questionnaire");
  };

  const handleQuestionNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];

    // Save answer
    await saveAnswer(currentQuestion.id, currentAnswer);

    // Check if we just completed the profile section (question 17 - mbti)
    if (currentQuestionIndex === PROFILE_SECTION_END_INDEX) {
      // Show transition screen before preferences
      setCurrentStep("transition");
      return;
    }

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentStep("complete");
    }
  };

  const handleTransitionContinue = () => {
    // Move to first preference question (question 18)
    setCurrentQuestionIndex(PROFILE_SECTION_END_INDEX + 1);
    setCurrentStep("questionnaire");
  };

  const handleQuestionBack = () => {
    // If we're at the first preference question, go back to transition
    if (currentQuestionIndex === PROFILE_SECTION_END_INDEX + 1) {
      setCurrentStep("transition");
      return;
    }

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setCurrentStep("photos");
    }
  };

  const handleTransitionBack = () => {
    // Go back to the last profile question (question 17 - mbti)
    setCurrentQuestionIndex(PROFILE_SECTION_END_INDEX);
    setCurrentStep("questionnaire");
  };

  const handleSubmitForReview = async () => {
    try {
      const { data, error } = await supabase.rpc("submit_profile_for_review", {
        p_user_id: user?.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string };

      if (result?.success) {
        toast({
          title: "Profile submitted!",
          description: "Your profile is now pending review. We'll notify you once it's approved.",
        });
        navigate("/client/dashboard");
      } else {
        toast({
          title: "Submission failed",
          description: result?.message || "Please complete your profile first",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast({
        title: "Error",
        description: "Failed to submit profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshPhotos = async () => {
    const { data } = await supabase
      .from("profile_photos")
      .select("*")
      .eq("profile_id", profileId)
      .order("order_index");
    setPhotos(data || []);
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center" />;

    // Convert kebab-case to PascalCase (e.g., "graduation-cap" -> "GraduationCap")
    const pascalCaseName = iconName
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    const IconComponent = (LucideIcons as any)[pascalCaseName];

    return (
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        {IconComponent ? <IconComponent className="h-8 w-8 text-primary" /> : null}
      </div>
    );
  };

  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (currentStep === "photos") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-8">
          <OnboardingProgressDots total={questions.length + 2} current={0} />
          
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Add your photos
            </h1>
            <p className="text-base text-muted-foreground">
              Upload at least 1 photo to get started
            </p>
          </div>

          <div className="flex-1">
            <PhotoUploadGrid
              userId={user.id}
              profileId={profileId}
              photos={photos}
              onPhotosUpdate={refreshPhotos}
            />
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t">
            <Button
              onClick={handlePhotoComplete}
              disabled={photos.length < 1}
              size="lg"
              className="rounded-full h-14 px-8"
            >
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "transition") {
    return <TransitionScreen onContinue={handleTransitionContinue} />;
  }

  if (currentStep === "questionnaire") {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    return (
      <div>
        <OnboardingProgressDots
          total={questions.length + 2}
          current={currentQuestionIndex + 1}
        />
        <QuestionScreen
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onAnswer={(answer) => saveAnswer(currentQuestion.id, answer)}
          onNext={handleQuestionNext}
          onBack={handleQuestionBack}
          canGoBack={currentQuestionIndex > 0 || true}
          iconComponent={getIconComponent(currentQuestion.icon_name)}
        />
      </div>
    );
  }

  // Complete screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-3">Profile Complete!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for completing your profile.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 text-left space-y-3">
            <h2 className="font-semibold text-lg">What happens next?</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Your profile will be reviewed by our matchmaking team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Once approved, you'll receive a notification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You'll start receiving curated match suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Review usually takes 1-2 business days</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleSubmitForReview}
            size="lg"
            className="w-full"
          >
            Submit for Review
          </Button>

          <p className="text-xs text-muted-foreground">
            By submitting, you agree to our terms of service and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
