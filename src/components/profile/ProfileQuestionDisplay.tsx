import { Badge } from "@/components/ui/badge";
import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import { getQuestionConfig, formatAnswer, getDisplayValue } from "@/config/questionnaireConfig";
import { cn } from "@/lib/utils";
import {
  User,
  Calendar,
  MapPin,
  Instagram,
  Heart,
  GraduationCap,
  Ruler,
  Users,
  Church,
  Wine,
  Cigarette,
  Baby,
  Sparkles,
  Key,
  Star,
} from "lucide-react";

interface ProfileQuestionDisplayProps {
  question: QuestionnaireQuestion;
  answer: any;
  profile?: any;
  renderStyle?: 'default' | 'tags' | 'separated';
  className?: string;
}

// Map icon names to actual icon components
const ICON_MAP: Record<string, any> = {
  User,
  Calendar,
  MapPin,
  Instagram,
  Heart,
  GraduationCap,
  Ruler,
  Users,
  Church,
  Wine,
  Cigarette,
  Baby,
  Sparkles,
  Key,
  Star,
};

export function ProfileQuestionDisplay({
  question,
  answer,
  profile,
  renderStyle = 'default',
  className,
}: ProfileQuestionDisplayProps) {
  const config = getQuestionConfig(question.id);
  const displayValue = getDisplayValue(question, answer, profile);

  // Skip if no answer
  if (!displayValue || displayValue === "Not answered") {
    return null;
  }

  // Get icon component
  const IconComponent = config?.icon ? ICON_MAP[config.icon] : User;
  const label = config?.label || question.question_text_en.replace('?', '');

  // Tags render style (for interests, etc.)
  if (renderStyle === 'tags' || config?.renderHint === 'tags') {
    const tags = Array.isArray(answer) ? answer : displayValue.split(', ');

    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {IconComponent && <IconComponent className="w-4 h-4" />}
          <span>{label}</span>
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

  // Separated render style (for relationship keys - 3 items in separated spaces)
  if (renderStyle === 'separated' || config?.renderHint === 'separated') {
    const items = Array.isArray(answer) ? answer : displayValue.split(', ');

    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
          {IconComponent && <IconComponent className="w-4 h-4" />}
          <span>{label}</span>
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

  // Default render style (icon + label + value)
  return (
    <div className={cn("flex items-start gap-3", className)}>
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
    </div>
  );
}
