import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

import { PhotoUploadGrid } from "@/components/PhotoUploadGrid";
import { QuestionnaireStepper } from "@/components/profile/QuestionnaireStepper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useProfileQuestionnaireData } from "@/hooks/useProfileQuestionnaireData";
import {
  calculateCompletionPercentage,
  getCompletedCategories,
  isQuestionAnswered,
} from "@/utils/profileQuestionnaire";
import {
  profileQuestionCategories,
  profileQuestions,
} from "@/constants/profileQuestions";

const ProfileQuestionnairePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    user,
    profile,
    photos,
    answers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    loading,
    saveAnswer,
    refreshPhotos,
    submitProfileForReview,
  } = useProfileQuestionnaireData();

  useEffect(() => {
    if (user === null) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const completedCategories = useMemo(
    () => getCompletedCategories(answers, profileQuestions, profileQuestionCategories),
    [answers]
  );

  const completionPercentage = useMemo(
    () => calculateCompletionPercentage(answers, profileQuestions, profileQuestionCategories),
    [answers]
  );

  if (!user) {
    return null;
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-20 w-20 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const handleFinish = async () => {
    const requiredQuestions = profileQuestions.filter((question) => question.required);
    const answeredRequired = requiredQuestions.filter((question) => isQuestionAnswered(answers[question.id]));

    if (answeredRequired.length < requiredQuestions.length) {
      toast({
        title: "Almost there",
        description: `Please complete ${requiredQuestions.length - answeredRequired.length} more required question${
          requiredQuestions.length - answeredRequired.length === 1 ? "" : "s"
        } before submitting.`,
        variant: "destructive",
      });
      return;
    }

    const result = await submitProfileForReview();

    if (result?.success) {
      toast({
        title: "Profile submitted!",
        description:
          result.message ?? "Your profile has been sent to your matchmaker for review. We'll be in touch soon.",
      });
      navigate("/client/dashboard");
    } else {
      toast({
        title: "Unable to submit",
        description: result?.message ?? "Please review your profile and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[--gradient-hero] px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">Complete your profile</h1>
              <p className="text-white/80">Upload your gallery and answer a few questions so we can start matchmaking.</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Question {currentQuestionIndex + 1} of {profileQuestions.length}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/80">
              <span>
                {completedCategories.length} of {profileQuestionCategories.length} categories complete
              </span>
              <span>{completionPercentage}% complete</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Profile photos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload six photos that feel like you. Your first photo becomes your profile cover.
              </p>
            </div>
            <Badge variant="outline" className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {photos.length} / 6
            </Badge>
          </CardHeader>
          <CardContent>
            <PhotoUploadGrid
              userId={user.id}
              profileId={profile.id}
              photos={photos}
              onPhotosUpdate={refreshPhotos}
            />
          </CardContent>
        </Card>

        <QuestionnaireStepper
          answers={answers}
          questions={profileQuestions}
          categories={profileQuestionCategories}
          completedCategories={completedCategories}
          currentQuestionIndex={currentQuestionIndex}
          onCurrentQuestionIndexChange={setCurrentQuestionIndex}
          onAnswer={saveAnswer}
          onFinish={handleFinish}
          onSaveExit={() => navigate("/client/dashboard")}
          showSaveExit
          finalActionLabel="Complete profile"
        />
      </div>
    </div>
  );
};

export default ProfileQuestionnairePage;
