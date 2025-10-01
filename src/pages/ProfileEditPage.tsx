import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PhotoUploadGrid } from "@/components/PhotoUploadGrid";
import { QuestionnaireStepper } from "@/components/profile/QuestionnaireStepper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProfileQuestionnaireData } from "@/hooks/useProfileQuestionnaireData";
import {
  calculateCompletionPercentage,
  getCompletedCategories,
} from "@/utils/profileQuestionnaire";
import {
  profileQuestionCategories,
  profileQuestions,
} from "@/constants/profileQuestions";

const formatAnswer = (answer: any): string => {
  if (answer === null || answer === undefined) return "Not answered";
  if (Array.isArray(answer)) return answer.length ? answer.join(", ") : "Not answered";
  if (typeof answer === "object") return JSON.stringify(answer, null, 2);
  const value = String(answer).trim();
  return value.length ? value : "Not answered";
};

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"edit" | "view">("edit");

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

  const viewSections = useMemo(() => {
    return profileQuestionCategories.map((category) => ({
      category,
      questions: profileQuestions
        .filter((question) => question.category === category)
        .map((question) => ({
          id: question.id,
          title: question.title,
          answer: formatAnswer(answers[question.id]),
        })),
    }));
  }, [answers]);

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

  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Profile";

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDone = () => {
    toast({
      title: "Profile updated",
      description: "Your latest edits are saved.",
    });
    navigate(-1);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "edit" | "view")}
      className="min-h-screen bg-background"
    >
      <div className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleCancel} className="text-sm font-medium">
              Cancel
            </Button>
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              {fullName}
            </span>
            <Button onClick={handleDone} className="btn-premium px-5">
              Done
            </Button>
          </div>
          <TabsList className="w-full justify-start gap-2 rounded-full bg-muted/70 p-1 sm:w-auto">
            <TabsTrigger value="edit" className="rounded-full px-4 py-2 text-sm">
              Edit
            </TabsTrigger>
            <TabsTrigger value="view" className="rounded-full px-4 py-2 text-sm">
              View
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <TabsContent value="edit" className="space-y-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Profile completion</h2>
                <p className="text-sm text-muted-foreground">Keep refining your story as life evolves.</p>
              </div>
              <Badge variant="outline" className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                {completionPercentage}% complete
              </Badge>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <Card className="card-premium">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Photos & videos</CardTitle>
                <p className="text-sm text-muted-foreground">Drag to reorder. Tap to replace or remove.</p>
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
            showSaveExit={false}
            renderFinalAction={() => null}
          />
        </TabsContent>

        <TabsContent value="view" className="space-y-8">
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Gallery preview</CardTitle>
              <p className="text-sm text-muted-foreground">Your first photo is shown on admin views and matches.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.length === 0 ? (
                  <p className="col-span-full text-sm text-muted-foreground">No photos uploaded yet.</p>
                ) : (
                  photos
                    .slice()
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((photo) => (
                      <div key={photo.id} className="relative overflow-hidden rounded-[16px] border border-border">
                        <img src={photo.photo_url} alt="Profile" className="h-full w-full object-cover" />
                        {photo.is_primary && (
                          <span className="absolute left-2 top-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                            Primary
                          </span>
                        )}
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {viewSections.map((section) => (
            <Card key={section.category} className="card">
              <CardHeader>
                <CardTitle>{section.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.questions.map((question) => (
                  <div key={question.id} className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{question.title}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default ProfileEditPage;
