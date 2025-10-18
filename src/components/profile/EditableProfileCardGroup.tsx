import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import { getClientProfileCards, getQuestionConfig, getDisplayValue } from "@/config/questionnaireConfig";
import { cn } from "@/lib/utils";

interface EditableProfileCardGroupProps {
  allQuestions: QuestionnaireQuestion[];
  profileAnswers: Record<string, any>;
  profile?: any;
  onEdit?: (questionId: string) => void;
  className?: string;
}

/**
 * EditableProfileCardGroup - Renders profile information in the same card layout as MatchDetailModal
 * but with edit buttons for each question. This ensures edit profile matches the view shown in matches.
 */
export function EditableProfileCardGroup({
  allQuestions,
  profileAnswers,
  profile,
  onEdit,
  className,
}: EditableProfileCardGroupProps) {
  // Use the same card configuration as match detail view
  const cardsData = getClientProfileCards(allQuestions, profileAnswers, { isMutualMatch: false });

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

  if (cardsData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No profile information available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {cardsData.map(({ card, questions }) => (
        <Card key={card.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map(({ question, answer }) => {
              const config = getQuestionConfig(question.id);
              const displayValue = getDisplayValue(question, answer, profile);
              const IconComponent = getIconComponent(config?.icon);
              const label = config?.label || question.question_text_en.replace('?', '');

              // Tags render style (for interests)
              if (card.renderStyle === 'tags' || config?.renderHint === 'tags') {
                const tags = Array.isArray(answer) ? answer : displayValue.split(', ');

                return (
                  <div key={question.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        <span>{label}</span>
                      </div>
                      {onEdit && (
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
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm font-normal rounded-full"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              }

              // Separated render style (for relationship keys)
              if (card.renderStyle === 'separated' || config?.renderHint === 'separated') {
                const items = Array.isArray(answer) ? answer : displayValue.split(', ');

                return (
                  <div key={question.id} className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        <span>{label}</span>
                      </div>
                      {onEdit && (
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
                    <div className="grid grid-cols-1 gap-3">
                      {items.slice(0, 3).map((item: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 bg-muted/30 rounded-lg border border-border/40"
                        >
                          <p className="text-base leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Default render style (icon + label + value + edit button)
              return (
                <div key={question.id} className="flex items-start gap-3">
                  {IconComponent && (
                    <IconComponent className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
                    <p className={cn(
                      "text-base leading-relaxed",
                      question.id === 'mbti' && "font-medium"
                    )}>
                      {displayValue}
                    </p>
                  </div>
                  {onEdit && (
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
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
