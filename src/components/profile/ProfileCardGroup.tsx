import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileQuestionDisplay } from "./ProfileQuestionDisplay";
import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import { getClientProfileCards } from "@/config/questionnaireConfig";
import { cn } from "@/lib/utils";

interface ProfileCardGroupProps {
  allQuestions: QuestionnaireQuestion[];
  profileAnswers: Record<string, any>;
  profile?: any;
  isMutualMatch?: boolean;
  className?: string;
}

/**
 * ProfileCardGroup - Renders profile information in a card-based layout
 * Used for client-facing views with 4 distinct cards
 */
export function ProfileCardGroup({
  allQuestions,
  profileAnswers,
  profile,
  isMutualMatch = false,
  className,
}: ProfileCardGroupProps) {
  const cardsData = getClientProfileCards(allQuestions, profileAnswers, { isMutualMatch });

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
            {questions.map(({ question, answer }) => (
              <ProfileQuestionDisplay
                key={question.id}
                question={question}
                answer={answer}
                profile={profile}
                renderStyle={card.renderStyle}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
