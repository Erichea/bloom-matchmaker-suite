import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2 } from "lucide-react";
import { getQuestionSummary, getDisplayValue, shouldDisplayQuestion } from "@/config/questionnaireConfig";

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
      <CardContent className="space-y-1">
        {visibleQuestions.map((question, index) => {
          const answer = answers[question.id];
          const displayValue = getDisplayValue(question, answer, profile);

          return (
            <div
              key={question.id}
              className={`flex items-center justify-between py-3 ${
                index !== visibleQuestions.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-sm font-medium text-foreground mb-1">
                  {getQuestionSummary(question)}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {displayValue}
                </div>
              </div>
              {editable && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(question.id)}
                  className="flex-shrink-0"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
