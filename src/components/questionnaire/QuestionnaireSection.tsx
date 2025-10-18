import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { getQuestionSummary, getDisplayValue, shouldDisplayQuestion, getQuestionConfig } from "@/config/questionnaireConfig";

interface QuestionnaireSectionProps {
  title: string;
  description?: string;
  questions: QuestionnaireQuestion[];
  answers: Record<string, any>;
  onEdit?: (questionId: string) => void;
  profile?: any;
  context?: {
    isMutualMatch?: boolean;
    hideSpecialFields?: boolean;
  };
  editable?: boolean;
}

/**
 * Reusable component for displaying a section of questionnaire questions
 * Automatically respects question order and display rules
 */
export function QuestionnaireSection({
  title,
  description,
  questions,
  answers,
  onEdit,
  profile,
  context = {},
  editable = true
}: QuestionnaireSectionProps) {
  // Filter questions based on display rules
  const visibleQuestions = questions.filter(q => shouldDisplayQuestion(q, context));

  // Helper function to get icon component from icon name
  const getIconComponent = (iconName: string | undefined) => {
    if (!iconName) return null;

    // Convert kebab-case to PascalCase (e.g., "graduation-cap" -> "GraduationCap")
    const pascalCaseName = iconName
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    const IconComponent = (LucideIcons as any)[pascalCaseName];
    return IconComponent || null;
  };

  if (visibleQuestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-0 divide-y divide-border/30">
          {visibleQuestions.map((question) => {
            const answer = answers[question.id];
            const displayValue = getDisplayValue(question, answer, profile);
            const questionConfig = getQuestionConfig(question.id);
            const IconComponent = getIconComponent(questionConfig?.icon);

            return (
              <div key={question.id} className="py-3 first:pt-0">
                <div className="flex items-start gap-3">
                  {IconComponent && (
                    <IconComponent className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {getQuestionSummary(question)}
                    </p>
                    <p className="text-base leading-relaxed">
                      {displayValue}
                    </p>
                  </div>
                  {editable && onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(question.id)}
                      className="flex-shrink-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
