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
import { BottomNavigation } from "@/components/BottomNavigation";
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

  const completionPercentage = useMemo(() => {
    return calculateCompletionPercentage(answers, profileQuestions, profileQuestionCategories);
  }, [answers]);

  const completedCategoryList = useMemo(() => {
    return getCompletedCategories(answers, profileQuestions, profileQuestionCategories);
  }, [answers]);

  const viewSections = useMemo(() => {
    return profileQuestionCategories.map((category) => {
      const categoryQuestions = profileQuestions
        .filter((q) => q.category === category)
        .map((q) => {
          const userAnswer = answers[q.id];
          return {
            id: q.id,
            title: q.title,
            answer: formatAnswer(userAnswer),
          };
        });

      return { category, questions: categoryQuestions };
    });
  }, [answers]);

  const handleSave = async () => {
    toast({ title: "Profile saved", description: "Your changes have been saved successfully." });
    navigate("/client/dashboard");
  };

  const handleCancel = () => {
    navigate("/client/dashboard");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "view")} className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-16 items-center justify-between px-4">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <h1 className="text-lg font-semibold">{profile?.first_name || "Profile"}</h1>
          <Button variant="ghost" onClick={handleSave}>
            Done
          </Button>
        </div>
        <TabsList className="mx-4 mb-2 grid w-auto grid-cols-2">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="view">View</TabsTrigger>
        </TabsList>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <TabsContent value="edit" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Profile Completion</CardTitle>
                <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                  {completionPercentage}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={completionPercentage} className="h-2" />
              <div className="mt-4 flex flex-wrap gap-2">
                {profileQuestionCategories.map((category) => (
                  <Badge 
                    key={category} 
                    variant={completedCategoryList.includes(category) ? "default" : "outline"}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos & Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUploadGrid
                userId={user.id}
                profileId={profile?.id || ""}
                photos={photos}
                onPhotosUpdate={refreshPhotos}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questionnaire</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionnaireStepper
                answers={answers}
                questions={profileQuestions}
                categories={profileQuestionCategories}
                completedCategories={completedCategoryList}
                currentQuestionIndex={currentQuestionIndex}
                onCurrentQuestionIndexChange={setCurrentQuestionIndex}
                onAnswer={saveAnswer}
                showSaveExit={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.length > 0 ? (
                  photos
                    .sort((a, b) => {
                      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
                      return (a.order_index || 0) - (b.order_index || 0);
                    })
                    .map((photo, index) => (
                      <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                        <img
                          src={photo.photo_url}
                          alt={`Photo ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {photo.is_primary && (
                          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                            Primary
                          </span>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="col-span-full text-center text-sm text-muted-foreground">
                    No photos uploaded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {viewSections.map((section, sectionIdx) => (
            <Card key={sectionIdx}>
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

      <BottomNavigation />
    </Tabs>
  );
};

export default ProfileEditPage;
