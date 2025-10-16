import { ProfileQuestionDisplay } from "./ProfileQuestionDisplay";
import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import { getAdminViewSections } from "@/config/questionnaireConfig";
import { cn } from "@/lib/utils";

interface ProfileComprehensiveViewProps {
  allQuestions: QuestionnaireQuestion[];
  profileAnswers: Record<string, any>;
  profile?: any;
  className?: string;
  compact?: boolean; // If true, renders more compactly without section titles
}

/**
 * ProfileComprehensiveView - Renders all profile information comprehensively
 * Used for admin views where everything should be visible
 */
export function ProfileComprehensiveView({
  allQuestions,
  profileAnswers,
  profile,
  className,
  compact = false,
}: ProfileComprehensiveViewProps) {
  const sectionsData = getAdminViewSections(allQuestions, profileAnswers);

  if (sectionsData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No profile information available</p>
      </div>
    );
  }

  if (compact) {
    // Compact view: all questions in a simple grid without section headers
    const allQuestionsFlat = sectionsData.flatMap(({ questions }) => questions);

    return (
      <div className={cn("space-y-3 divide-y divide-border/30", className)}>
        {allQuestionsFlat.map(({ question, answer }) => (
          <div key={question.id} className="py-3 first:pt-0">
            <ProfileQuestionDisplay
              question={question}
              answer={answer}
              profile={profile}
            />
          </div>
        ))}
      </div>
    );
  }

  // Full view with sections
  return (
    <div className={cn("space-y-6", className)}>
      {sectionsData.map(({ section, questions }) => (
        <div key={section.id} className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2">
            {section.title}
          </h3>
          <div className="space-y-3 divide-y divide-border/30">
            {questions.map(({ question, answer }) => (
              <div key={question.id} className="py-3 first:pt-0">
                <ProfileQuestionDisplay
                  question={question}
                  answer={answer}
                  profile={profile}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
