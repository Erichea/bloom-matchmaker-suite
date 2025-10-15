import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import { QuestionnaireSection } from "./QuestionnaireSection";
import {
  groupQuestionsByCategory,
  getProfileQuestions,
  getPreferenceQuestions,
  PROFILE_CATEGORIES,
  PREFERENCE_CATEGORIES
} from "@/config/questionnaireConfig";

interface QuestionnaireDisplayProps {
  questions: QuestionnaireQuestion[];
  answers: Record<string, any>;
  onEdit?: (questionId: string) => void;
  profile?: any;
  context?: {
    isMutualMatch?: boolean;
    hideSpecialFields?: boolean;
  };
  editable?: boolean;
  showProfile?: boolean;
  showPreferences?: boolean;
}

/**
 * Reusable component for displaying questionnaire data
 * Automatically groups questions by category and respects order from database
 */
export function QuestionnaireDisplay({
  questions,
  answers,
  onEdit,
  profile,
  context = {},
  editable = true,
  showProfile = true,
  showPreferences = true
}: QuestionnaireDisplayProps) {
  const profileQuestions = getProfileQuestions(questions);
  const preferenceQuestions = getPreferenceQuestions(questions);

  const profileGroups = groupQuestionsByCategory(profileQuestions, PROFILE_CATEGORIES);
  const preferenceGroups = groupQuestionsByCategory(preferenceQuestions, PREFERENCE_CATEGORIES);

  return (
    <div className="space-y-6">
      {/* Profile Information Sections */}
      {showProfile && profileGroups.map(({ category, questions: categoryQuestions }) => (
        <QuestionnaireSection
          key={category.name}
          title={category.name}
          description={category.description}
          questions={categoryQuestions}
          answers={answers}
          onEdit={onEdit}
          profile={profile}
          context={context}
          editable={editable}
        />
      ))}

      {/* Preference Sections */}
      {showPreferences && preferenceGroups.map(({ category, questions: categoryQuestions }) => (
        <QuestionnaireSection
          key={category.name}
          title={category.name}
          description={category.description}
          questions={categoryQuestions}
          answers={answers}
          onEdit={onEdit}
          profile={profile}
          context={context}
          editable={editable}
        />
      ))}
    </div>
  );
}
