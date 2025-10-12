import { useState, useEffect, useMemo } from "react";
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
import { ArrowLeft, Edit2, X, LogOut } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { questionnaireCategories } from "@/constants/questionnaireCategories";

type ProfileTab = "questions" | "photos";

const formatAnswer = (answer: any): string => {
  if (answer === null || answer === undefined || answer === "") {
    return "Not answered";
  }
  if (Array.isArray(answer)) {
    return answer.length ? answer.join(", ") : "Not answered";
  }
  if (typeof answer === "object") {
    // Check if it's a date string
    try {
      const date = new Date(answer);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    } catch (e) {
      // Not a date
    }
    return JSON.stringify(answer);
  }

  // Check if it's a date string
  const str = String(answer);
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime()) && str.includes('-')) {
      return date.toLocaleDateString();
    }
  } catch (e) {
    // Not a date
  }

  return str;
};

const getQuestionSummary = (questionId: string, questionText: string): string => {
  // Create short summaries for common questions
  const summaries: Record<string, string> = {
    "name": "Name",
    "date_of_birth": "Age",
    "gender": "Gender",
    "city": "Location",
    "dating_preference": "Looking for",
    "education_level": "Education",
    "education_importance": "Education importance",
    "height": "Height",
    "height_preference": "Height preference",
    "ethnicity": "Ethnicity",
    "ethnicity_importance": "Ethnicity importance",
    "appearance_importance": "Looks importance",
    "religion": "Religion",
    "religion_importance": "Religion importance",
    "alcohol": "Drinking",
    "smoking": "Smoking",
    "marriage": "Marriage plans",
    "marriage_timeline": "Marriage timeline",
    "age_importance": "Age importance",
    "income_importance": "Income importance",
    "interests": "Interests",
    "relationship_values": "Relationship values",
    "relationship_keys": "Key elements",
    "mbti": "Personality type",
  };

  return summaries[questionId] || questionText.split("?")[0];
};

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("questions");
  const [photos, setPhotos] = useState<any[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const {
    questions,
    answers,
    saveAnswer,
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
    if (!iconName) return null;

    const pascalCaseName = iconName
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    const IconComponent = (LucideIcons as any)[pascalCaseName];

    return IconComponent ? (
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <IconComponent className="h-8 w-8 text-primary" />
      </div>
    ) : null;
  };

  const handleSaveAnswer = async (questionId: string, answer: any) => {
    await saveAnswer(questionId, answer);
    setEditingQuestionId(null);
    toast({
      title: "Answer saved",
      description: "Your answer has been updated successfully."
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate("/auth");
  };

  const questionsByCategory = useMemo(() => {
    return questionnaireCategories.map(category => {
      const categoryQuestions = questions.filter(q =>
        category.questionIds.includes(q.id as string)
      );
      return {
        categoryName: category.name,
        questions: categoryQuestions
      };
    }).filter(cat => cat.questions.length > 0);
  }, [questions]);

  const editingQuestion = useMemo(() => {
    if (!editingQuestionId) return null;
    return questions.find(q => q.id === editingQuestionId);
  }, [editingQuestionId, questions]);

  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)} className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="flex h-16 items-center justify-between px-4">
            <Button variant="ghost" onClick={() => navigate("/client/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Edit Profile</h1>
            <div className="w-16" /> {/* Spacer for alignment */}
          </div>
          <TabsList className="mx-4 mb-2 grid w-auto grid-cols-2">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="questions" className="mt-0">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {questionsByCategory.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{category.categoryName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {category.questions.map((question, qIdx) => (
                    <div
                      key={question.id}
                      className={`flex items-center justify-between py-3 ${
                        qIdx !== category.questions.length - 1 ? 'border-b border-border' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm font-medium text-foreground mb-1">
                          {getQuestionSummary(question.id, question.question_text_en)}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {formatAnswer(answers[question.id])}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingQuestionId(question.id)}
                        className="flex-shrink-0"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Account Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </CardContent>
            </Card>
          </div>
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

      {/* Full-screen edit overlay */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingQuestionId(null)}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <QuestionScreen
            question={editingQuestion}
            answer={answers[editingQuestion.id]}
            onAnswer={(answer) => handleSaveAnswer(editingQuestion.id, answer)}
            onNext={() => handleSaveAnswer(editingQuestion.id, answers[editingQuestion.id])}
            onBack={() => setEditingQuestionId(null)}
            canGoBack={true}
            iconComponent={getIconComponent(editingQuestion.icon_name)}
          />
        </div>
      )}
    </>
  );
}
