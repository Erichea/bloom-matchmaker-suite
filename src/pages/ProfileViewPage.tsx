import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import MatchDetailModal from "@/components/MatchDetailModal";
import {
  Settings,
  Edit,
  User,
  MapPin,
  Heart,
  Pen,
  Eye,
  LogOut,
  GraduationCap,
  Ruler,
  Users,
  Church,
  Sparkles,
  Calendar,
  DollarSign,
  Star
} from "lucide-react";
import { formatAnswer, calculateAge, QUESTION_SUMMARIES, QUESTION_GROUPS } from "@/config/questionnaireConfig";
import { questionnaireCategories } from "@/constants/questionnaireCategories";

const getQuestionSummary = (questionId: string, questionText: string): string => {
  return QUESTION_SUMMARIES[questionId] || questionText.split("?")[0];
};

const getAgeFromDateOfBirth = (dateOfBirth: string): string => {
  const age = calculateAge(dateOfBirth);
  return age ? `${age} years old` : 'Not added';
};

export default function ProfileViewPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<any[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [profileData, setProfileData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMatch, setPreviewMatch] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadProfile = async () => {
      try {
        // Load profile
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

        // Load questionnaire answers
        const { data: answersData } = await supabase
          .from("profile_answers")
          .select("*")
          .eq("user_id", user.id);

        const savedAnswers: Record<string, any> = {};
        answersData?.forEach((item) => {
          savedAnswers[item.question_id] = item.answer;
        });

        setAnswers(savedAnswers);

      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate, toast]);

  const primaryPhotoUrl = useMemo(() => {
    if (!photos.length) return null;
    const primary = photos
      .sort((a: any, b: any) => {
        const primaryRankA = a.is_primary ? 0 : 1;
        const primaryRankB = b.is_primary ? 0 : 1;
        if (primaryRankA !== primaryRankB) return primaryRankA - primaryRankB;
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      })[0];
    return primary?.photo_url ?? null;
  }, [photos]);

  const profileSummary = useMemo(() => {
    const summary: Record<string, any> = {};

    // Basic info from profile
    if (profileData) {
      summary.name = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Not set';
      summary.city = profileData.city || 'Not added';
      summary.age = profileData.date_of_birth ? getAgeFromDateOfBirth(profileData.date_of_birth) : 'Not added';
    }

    // Key info from answers
    const keyFields = ['gender', 'education_level', 'ethnicity', 'religion', 'alcohol', 'smoking'];
    keyFields.forEach(field => {
      summary[field] = formatAnswer(answers[field]);
    });

    return summary;
  }, [profileData, answers]);

  // Get all preference questions (order 21-27) - these are the importance ratings
  const preferenceQuestions = useMemo(() => {
    const preferenceQuestionIds = [
      'education_importance',
      'height_preference',
      'ethnicity_importance',
      'religion_importance',
      'appearance_importance',
      'age_importance',
      'income_importance'
    ];

    const preferenceQuestionsList: any[] = [];

    preferenceQuestionIds.forEach(questionId => {
      if (answers[questionId] !== undefined && answers[questionId] !== null && answers[questionId] !== '') {
        preferenceQuestionsList.push({
          id: questionId,
          summary: QUESTION_SUMMARIES[questionId] || questionId,
          answer: formatAnswer(answers[questionId])
        });
      }
    });

    return preferenceQuestionsList;
  }, [answers]);

  // Get icon for each preference question
  const getPreferenceIcon = (questionId: string) => {
    const iconMap: Record<string, any> = {
      education_importance: GraduationCap,
      height_preference: Ruler,
      ethnicity_importance: Users,
      religion_importance: Church,
      appearance_importance: Sparkles,
      age_importance: Calendar,
      income_importance: DollarSign
    };
    return iconMap[questionId] || Star;
  };

  const handlePreviewProfile = () => {
    if (!profileData) return;

    const mockMatch = {
      id: "preview",
      profile_1_id: profileData.id,
      profile_2_id: "other",
      current_profile_id: "other",
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

  const completionPercentage = profileData?.completion_percentage || 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background-light dark:bg-background-dark">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="w-9"></div>
            <h1 className="text-lg font-semibold">Profile</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/client/settings/notifications")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
          {/* Profile Picture Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 z-10"
                  onClick={handlePreviewProfile}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <div className="flex flex-col items-center space-y-4 pt-8">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100">
                      {primaryPhotoUrl ? (
                        <img
                          alt="Profile"
                          className="h-full w-full object-cover"
                          src={primaryPhotoUrl}
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <User className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={() => navigate("/client/profile/edit")}
                    >
                      <Pen className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-semibold">{profileSummary.name}</h2>
                <div className="flex items-center justify-center text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {profileSummary.city}
                </div>
                <div className="text-muted-foreground text-sm mt-1">
                  {profileSummary.age}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  Profile completion: {completionPercentage}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {answers.instagram_contact && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Contact Information</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/client/profile/edit")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-0 divide-y divide-border/30">
                  <div className="py-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-base">{formatAnswer(answers.instagram_contact)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferences Summary */}
          {preferenceQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Dating Preferences</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/client/profile/preferences")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-0 divide-y divide-border/30">
                  {preferenceQuestions.map((pref) => {
                    const IconComponent = getPreferenceIcon(pref.id);
                    return (
                      <div key={pref.id} className="py-3 first:pt-0">
                        <div className="flex items-start gap-3">
                          <IconComponent className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">{pref.summary}</p>
                            <p className="text-base leading-relaxed">{pref.answer}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logout Button */}
          <div className="pt-6">
            <Button
              onClick={() => navigate("/logout")}
              variant="outline"
              className="w-full rounded-xl"
              size="lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </main>
      </div>

      <BottomNavigation />

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