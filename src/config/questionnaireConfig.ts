import { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";

/**
 * CENTRALIZED QUESTIONNAIRE CONFIGURATION
 *
 * This is the single source of truth for how questionnaire data is displayed
 * across all screens. When questions are added/removed/reordered in the database,
 * all screens will automatically reflect these changes.
 */

// Define question groups
export const QUESTION_GROUPS = {
  PROFILE: { minOrder: 1, maxOrder: 18 },
  PREFERENCES: { minOrder: 19, maxOrder: 25 }
} as const;

// Define display categories for profile questions
// These categories organize questions into logical sections for UI display
export interface QuestionCategory {
  name: string;
  description?: string;
  orderRange: { min: number; max: number };
}

export const PROFILE_CATEGORIES: QuestionCategory[] = [
  {
    name: "Basic Identity",
    description: "Essential personal information",
    orderRange: { min: 1, max: 5 } // name, date_of_birth, gender, city, instagram_contact
  },
  {
    name: "Dating Preferences",
    description: "Who you're looking for",
    orderRange: { min: 6, max: 6 } // dating_preference
  },
  {
    name: "Personal Background",
    description: "Education, appearance, and cultural background",
    orderRange: { min: 7, max: 10 } // education_level, height, ethnicity, religion
  },
  {
    name: "Lifestyle",
    description: "Daily habits and choices",
    orderRange: { min: 11, max: 12 } // alcohol, smoking
  },
  {
    name: "Relationship Goals",
    description: "What you're looking for in a relationship",
    orderRange: { min: 13, max: 17 } // marriage, marriage_timeline, interests, relationship_values, relationship_keys
  },
  {
    name: "Personality",
    description: "Your personality type",
    orderRange: { min: 18, max: 18 } // mbti
  }
];

export const PREFERENCE_CATEGORIES: QuestionCategory[] = [
  {
    name: "Compatibility Preferences",
    description: "What matters most to you in a match",
    orderRange: { min: 19, max: 25 } // All preference importance questions
  }
];

// Special display rules for specific questions
export interface DisplayRule {
  questionId: string;
  showOnMutualMatchOnly?: boolean; // Only show when there's a mutual match
  hideInList?: boolean; // Don't show in certain lists
  customFormatter?: (answer: any) => string; // Custom formatting function
}

export const DISPLAY_RULES: DisplayRule[] = [
  {
    questionId: "instagram_contact",
    showOnMutualMatchOnly: true, // Only display Instagram when mutual match
  },
  // Add more special rules as needed
];

// Question summaries for compact display
// Maps question IDs to short, user-friendly labels
export const QUESTION_SUMMARIES: Record<string, string> = {
  name: "Name",
  date_of_birth: "Age",
  gender: "Gender",
  city: "Location",
  instagram_contact: "Instagram",
  dating_preference: "Looking for",
  education_level: "Education",
  education_importance: "Education importance",
  height: "Height",
  height_preference: "Height preference",
  ethnicity: "Ethnicity",
  ethnicity_importance: "Ethnicity importance",
  appearance_importance: "Looks importance",
  religion: "Religion",
  religion_importance: "Religion importance",
  alcohol: "Drinking",
  smoking: "Smoking",
  marriage: "Marriage plans",
  marriage_timeline: "Marriage timeline",
  age_importance: "Age importance",
  income_importance: "Income importance",
  interests: "Interests",
  relationship_values: "Relationship values",
  relationship_keys: "Key elements",
  mbti: "Personality type",
};

/**
 * UTILITY FUNCTIONS
 */

/**
 * Filters questions to only include profile questions (order 1-18)
 */
export function getProfileQuestions(questions: QuestionnaireQuestion[]): QuestionnaireQuestion[] {
  const { minOrder, maxOrder } = QUESTION_GROUPS.PROFILE;
  return questions
    .filter(q => q.question_order >= minOrder && q.question_order <= maxOrder)
    .sort((a, b) => a.question_order - b.question_order);
}

/**
 * Filters questions to only include preference questions (order 19-25)
 */
export function getPreferenceQuestions(questions: QuestionnaireQuestion[]): QuestionnaireQuestion[] {
  const { minOrder, maxOrder } = QUESTION_GROUPS.PREFERENCES;
  return questions
    .filter(q => q.question_order >= minOrder && q.question_order <= maxOrder)
    .sort((a, b) => a.question_order - b.question_order);
}

/**
 * Groups questions by category for organized display
 */
export function groupQuestionsByCategory(
  questions: QuestionnaireQuestion[],
  categories: QuestionCategory[]
): Array<{ category: QuestionCategory; questions: QuestionnaireQuestion[] }> {
  return categories
    .map(category => ({
      category,
      questions: questions
        .filter(q =>
          q.question_order >= category.orderRange.min &&
          q.question_order <= category.orderRange.max
        )
        .sort((a, b) => a.question_order - b.question_order)
    }))
    .filter(group => group.questions.length > 0);
}

/**
 * Gets a short summary label for a question
 */
export function getQuestionSummary(question: QuestionnaireQuestion): string {
  return QUESTION_SUMMARIES[question.id] || question.question_text_en.split("?")[0];
}

/**
 * Checks if a question should be displayed based on display rules
 */
export function shouldDisplayQuestion(
  question: QuestionnaireQuestion,
  context: {
    isMutualMatch?: boolean;
    hideSpecialFields?: boolean;
  } = {}
): boolean {
  const rule = DISPLAY_RULES.find(r => r.questionId === question.id);

  if (!rule) return true; // No special rules, show it

  // Check mutual match rule
  if (rule.showOnMutualMatchOnly && !context.isMutualMatch) {
    return false;
  }

  // Check hide in list rule
  if (rule.hideInList && context.hideSpecialFields) {
    return false;
  }

  return true;
}

/**
 * Formats an answer for display
 */
export function formatAnswer(answer: any, question?: QuestionnaireQuestion): string {
  // Check if there's a custom formatter for this question
  if (question) {
    const rule = DISPLAY_RULES.find(r => r.questionId === question.id);
    if (rule?.customFormatter) {
      return rule.customFormatter(answer);
    }
  }

  // Default formatting logic
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
}

/**
 * Calculates age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number | null {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  if (isNaN(birthDate.getTime())) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Gets the display value for a specific question's answer
 * Handles special cases like age calculation, formatting, etc.
 */
export function getDisplayValue(
  question: QuestionnaireQuestion,
  answer: any,
  profile?: any
): string {
  // Special case: date_of_birth should show age
  if (question.id === "date_of_birth" && answer) {
    const age = calculateAge(answer);
    return age ? `${age} years old` : formatAnswer(answer, question);
  }

  // Special case: name might be split into first_name/last_name
  if (question.id === "name" && profile) {
    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
  }

  return formatAnswer(answer, question);
}
