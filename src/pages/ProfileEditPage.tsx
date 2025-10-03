import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingQuestionnaire } from "@/hooks/useOnboardingQuestionnaire";
import { useToast } from "@/hooks/use-toast";
import { QuestionScreen } from "@/components/onboarding/QuestionScreen";
import { PhotoUploadGrid } from "@/components/PhotoUploadGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

type ProfileTab = "photos" | "questionnaire";

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("questionnaire");
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
        return;
      }

      const profileData = (profileRows && profileRows[0]) || null;

      if (profileData) {
        setProfileId(profileData.id);

        // Load photos
        const { data: photosData } = await supabase
          .from("profile_photos")
          .select("*")
          .eq("profile_id", profileData.id)
          .order("order_index");

        setPhotos(photosData || []);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const refreshPhotos = async () => {
    if (!profileId) return;
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

  const handleQuestionNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];

    // Save answer
    await saveAnswer(currentQuestion.id, currentAnswer);

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleQuestionBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleDone = () => {
    toast({
      title: "Profile saved",
      description: "Your changes have been saved successfully."
    });
    navigate("/client/dashboard");
  };

  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)} className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="flex h-16 items-center justify-between px-4">
          <Button variant="ghost" onClick={() => navigate("/client/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
          <Button variant="ghost" onClick={handleDone}>
            Done
          </Button>
        </div>
        <TabsList className="mx-4 mb-2 grid w-auto grid-cols-2">
          <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
          <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="questionnaire" className="mt-0">
        {questions.length > 0 && questions[currentQuestionIndex] && (
          <div>
            {/* Question navigation */}
            <div className="sticky top-32 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuestionBack}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQuestionNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <QuestionScreen
              question={questions[currentQuestionIndex]}
              answer={answers[questions[currentQuestionIndex].id]}
              onAnswer={(answer) => saveAnswer(questions[currentQuestionIndex].id, answer)}
              onNext={handleQuestionNext}
              onBack={handleQuestionBack}
              canGoBack={currentQuestionIndex > 0}
              iconComponent={getIconComponent(questions[currentQuestionIndex].icon_name)}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="photos" className="mt-0">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUploadGrid
                userId={user.id}
                profileId={profileId}
                photos={photos}
                onPhotosUpdate={refreshPhotos}
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <BottomNavigation />
    </Tabs>
  );
}
