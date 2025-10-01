import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Question } from "@/constants/profileQuestions";
import { QuestionInput } from "@/components/profile/QuestionInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionnaireStepperProps {
  answers: Record<string, any>;
  questions: Question[];
  categories: string[];
  completedCategories: string[];
  currentQuestionIndex: number;
  onCurrentQuestionIndexChange: (index: number) => void;
  onAnswer: (questionId: string, answer: any) => void;
  onFinish?: () => void;
  onSaveExit?: () => void;
  showSaveExit?: boolean;
  finalActionLabel?: string;
  renderFinalAction?: () => React.ReactNode;
}

export const QuestionnaireStepper = ({
  answers,
  questions,
  categories,
  completedCategories,
  currentQuestionIndex,
  onCurrentQuestionIndexChange,
  onAnswer,
  onFinish,
  onSaveExit,
  showSaveExit = true,
  finalActionLabel = "Complete Profile",
  renderFinalAction,
}: QuestionnaireStepperProps) => {
  const currentQuestion = questions[currentQuestionIndex];
  const Icon = currentQuestion.icon;
  const value = answers[currentQuestion.id] ?? (currentQuestion.type === "multiselect" ? [] : "");

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const categoryQuestions = questions.filter((question) => question.category === category);
          const isCompleted = completedCategories.includes(category);
          const firstQuestionIndex = questions.findIndex((question) => question.category === category);
          const isCurrent = category === currentQuestion.category;

          const CategoryIcon = categoryQuestions[0]?.icon ?? Icon;

          return (
            <button
              key={category}
              onClick={() => {
                if (firstQuestionIndex !== -1) {
                  onCurrentQuestionIndexChange(firstQuestionIndex);
                }
              }}
              className={`flex items-center space-x-2 rounded-full px-3 py-2 text-sm font-medium transition-all hover:scale-105 ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-md"
                  : isCompleted
                  ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <CategoryIcon className="h-4 w-4" />
              <span>{category}</span>
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current opacity-50" />
              )}
            </button>
          );
        })}
      </div>

      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-start space-x-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {currentQuestion.category}
                </Badge>
                {currentQuestion.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <CardTitle className="mb-2 text-xl">{currentQuestion.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <QuestionInput
            question={currentQuestion}
            value={value}
            onChange={(nextValue) => onAnswer(currentQuestion.id, nextValue)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => onCurrentQuestionIndexChange(Math.max(0, currentQuestionIndex - 1))}
          disabled={isFirstQuestion}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        <div className="flex items-center space-x-4">
          {showSaveExit && (
            <Button variant="ghost" onClick={onSaveExit}>
              Save & Exit
            </Button>
          )}

          {!isLastQuestion && (
            <Button
              onClick={() => onCurrentQuestionIndexChange(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              className="btn-premium flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {isLastQuestion && (
            renderFinalAction ? (
              renderFinalAction()
            ) : (
              <Button onClick={onFinish} className="btn-premium flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>{finalActionLabel}</span>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
