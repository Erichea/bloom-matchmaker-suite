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
import MatchDetailModal from "@/components/MatchDetailModal";
import { EditableProfileCardGroup } from "@/components/profile";
import { ArrowLeft, X, LogOut, Eye } from "lucide-react";
import * as LucideIcons from "lucide-react";

type ProfileTab = "questions" | "photos";

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>("questions");
  const [photos, setPhotos] = useState<any[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [previewMatch, setPreviewMatch] = useState<any>(null);

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
        setProfileData(profileData);

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

  const handlePreviewProfile = () => {
    if (!profileData) return;

    // Build a mock match object that mimics what MatchDetailModal expects
    const mockMatch = {
      id: "preview",
      profile_1_id: profileData.id,
      profile_2_id: "other",
      current_profile_id: "other", // Set as "other" so our profile shows as profile_1 (the "other" profile)
      match_status: "pending",
      profile_1_response: null,
      profile_2_response: null,
      compatibility_score: 85,
      profile_1: profileData,
      profile_2: {
        ...profileData,
        photos: photos,
        profile_photos: photos
      }
    };

    setPreviewMatch(mockMatch);
    setShowPreview(true);
  };

  // No need for hard-coded category logic anymore - handled by QuestionnaireDisplay component

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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)} className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
        <div className="sticky top-0 z-40 border-b border-border bg-background-light dark:bg-background-dark">
          <div className="flex h-16 items-center justify-between px-4">
            <Button variant="ghost" onClick={() => navigate("/client/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-lg font-semibold">Edit Profile</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviewProfile}
              disabled={!profileData}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
          <TabsList className="mx-4 mb-2 grid w-auto grid-cols-2">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="questions" className="mt-0">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Profile displayed in same card layout as match detail view */}
            <EditableProfileCardGroup
              allQuestions={questions}
              profileAnswers={answers}
              profile={profileData}
              onEdit={setEditingQuestionId}
            />

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

      {/* Profile Preview Modal */}
      {previewMatch && (
        <MatchDetailModal
          match={previewMatch}
          open={showPreview}
          onOpenChange={setShowPreview}
        />
      )}
    </>
  );
}
