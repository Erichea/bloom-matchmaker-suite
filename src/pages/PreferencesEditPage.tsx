import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingQuestionnaire } from "@/hooks/useOnboardingQuestionnaire";
import { useToast } from "@/hooks/use-toast";
import { QuestionScreen } from "@/components/onboarding/QuestionScreen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ArrowLeft, Edit2, X, Heart } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { questionnaireCategories } from "@/constants/questionnaireCategories";

// Preference categories that should be editable on this page
const PREFERENCE_CATEGORIES = [
  "Dating & Relationship Goals",
  "Compatibility Preferences"
];

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
    "dating_preference": "Looking for",
    "marriage": "Marriage plans",
    "marriage_timeline": "Marriage timeline",
    "relationship_values": "Relationship values",
    "relationship_keys": "Key elements",
    "age_importance": "Age importance",
    "height_preference": "Height preference",
    "income_importance": "Income importance",
    "education_importance": "Education importance",
    "ethnicity_importance": "Ethnicity importance",
    "appearance_importance": "Looks importance",
    "religion_importance": "Religion importance",
    "mbti": "Personality type",
  };

  return summaries[questionId] || questionText.split("?")[0];
};

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

  const preferenceQuestions = useMemo(() => {
    const preferenceQuestionsList: any[] = [];

    PREFERENCE_CATEGORIES.forEach(categoryName => {
      const category = questionnaireCategories.find(cat => cat.name === categoryName);
      if (category) {
        const categoryQuestions = questions.filter(q =>
          category.questionIds.includes(q.id as string)
        );
        preferenceQuestionsList.push({
          categoryName,
          questions: categoryQuestions
        });
      }
    });

    return preferenceQuestionsList.filter(cat => cat.questions.length > 0);
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

        {/* Preference Categories */}
        <div className="max-w-2xl mx-auto px-4 py-2 space-y-6">
          {preferenceQuestions.map((category, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  {category.categoryName}
                </CardTitle>
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

          {preferenceQuestions.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No preference questions available</h3>
                  <p className="text-muted-foreground">
                    Dating preference questions will appear here once available.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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