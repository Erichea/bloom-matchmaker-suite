import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingQuestionnaire } from "@/hooks/useOnboardingQuestionnaire";
import { useToast } from "@/hooks/use-toast";
import { QuestionScreen } from "@/components/onboarding/QuestionScreen";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import { QuestionnaireDisplay } from "@/components/questionnaire";
import { ArrowLeft, X, Heart } from "lucide-react";
import * as LucideIcons from "lucide-react";

export default function PreferencesEditPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
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
  }, [user, navigate]);

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
      title: "Preference saved",
      description: "Your dating preference has been updated successfully."
    });
  };

  // No need for hard-coded category logic - handled by QuestionnaireDisplay component

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
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="flex h-16 items-center justify-between px-4">
            <Button variant="ghost" onClick={() => navigate("/client/profile")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
            <h1 className="text-lg font-semibold">Edit Preferences</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Description */}
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Dating Preferences</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Let us know what you're looking for in a partner. These preferences help us find better matches for you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preference Categories - dynamically loaded from questionnaire */}
        <div className="max-w-2xl mx-auto px-4 py-2 space-y-6">
          <QuestionnaireDisplay
            questions={questions}
            answers={answers}
            onEdit={setEditingQuestionId}
            editable={true}
            showProfile={false} // Don't show profile questions
            showPreferences={true} // Only show preference questions
          />
        </div>
      </div>

      <BottomNavigation />

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