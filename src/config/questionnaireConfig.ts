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
    orderRange: { min: 1, max: 5 } // name (1), date_of_birth (2), gender (3), city (4), instagram_contact (5)
  },
  {
    name: "Dating Preferences",
    description: "Who you're looking for",
    orderRange: { min: 6, max: 6 } // dating_preference (6)
  },
  {
    name: "Personal Background",
    description: "Education, appearance, and cultural background",
    orderRange: { min: 7, max: 10 } // education_level (7), height (8), ethnicity (9), religion (10)
  },
  {
    name: "Lifestyle",
    description: "Daily habits and choices",
    orderRange: { min: 11, max: 12 } // alcohol (11), smoking (12)
  },
  {
    name: "Relationship Goals",
    description: "What you're looking for in a relationship",
    orderRange: { min: 13, max: 17 } // marriage (13), marriage_timeline (14), interests (15), relationship_values (16), relationship_keys (17)
  },
  {
    name: "Personality",
    description: "Your personality type",
    orderRange: { min: 18, max: 18 } // mbti (18)
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

/**
 * CLIENT VIEW CONFIGURATION
 * Defines the 4-card layout for client-facing profile views
 */

export type ViewContext = 'client' | 'admin';

export interface ProfileCardConfig {
  id: string;
  title: string;
  questionIds: string[];
  renderStyle?: 'default' | 'tags' | 'separated'; // How to render the content
  hideInContext?: ViewContext[]; // Hide this card in specific contexts
}

// Card 1: Basic Identity & Background
// Card 2: Family & Marriage
// Card 3: Interests (with tag design)
// Card 4: Relationship Keys (3 main elements in separated spaces)
export const CLIENT_PROFILE_CARDS: ProfileCardConfig[] = [
  {
    id: 'identity_background',
    title: 'About',
    questionIds: [
      'education_level',  // Degree
      'height',           // Height
      'ethnicity',        // Origin
      'religion',         // Religion
      'alcohol',          // Drinking
      'smoking',          // Smoking
      'mbti',             // MBTI
    ],
    renderStyle: 'default',
  },
  {
    id: 'family_marriage',
    title: 'Family & Future',
    questionIds: [
      'children',         // Has Children (note: might need to add this question)
      'marriage',         // Marriage plans
      'marriage_timeline', // When
    ],
    renderStyle: 'default',
  },
  {
    id: 'interests',
    title: 'Interests & Passions',
    questionIds: [
      'interests',        // Interests with tag design
    ],
    renderStyle: 'tags',
  },
  {
    id: 'relationship_keys',
    title: 'What Makes a Great Relationship',
    questionIds: [
      'relationship_keys', // 3 main elements
    ],
    renderStyle: 'separated',
  },
];

/**
 * ADMIN VIEW CONFIGURATION
 * Defines comprehensive view for admin pages
 */

export interface AdminViewSection {
  id: string;
  title: string;
  questionIds: string[];
  alwaysShow?: boolean; // Show even if no answers
}

export const ADMIN_VIEW_SECTIONS: AdminViewSection[] = [
  {
    id: 'basic_info',
    title: 'Basic Information',
    questionIds: ['name', 'date_of_birth', 'gender', 'city', 'instagram_contact'],
    alwaysShow: true,
  },
  {
    id: 'dating_relationship',
    title: 'Dating & Relationship Goals',
    questionIds: ['dating_preference', 'marriage', 'marriage_timeline', 'children', 'relationship_values', 'relationship_keys'],
  },
  {
    id: 'physical_appearance',
    title: 'Physical & Appearance',
    questionIds: ['height', 'height_preference', 'appearance_importance'],
  },
  {
    id: 'background_culture',
    title: 'Background & Culture',
    questionIds: ['ethnicity', 'ethnicity_importance', 'religion', 'religion_importance'],
  },
  {
    id: 'education_income',
    title: 'Education & Income',
    questionIds: ['education_level', 'education_importance', 'income_importance'],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    questionIds: ['alcohol', 'smoking', 'interests'],
  },
  {
    id: 'personality',
    title: 'Personality & Compatibility',
    questionIds: ['mbti', 'age_importance'],
  },
];

/**
 * QUESTION CONFIGURATION
 * Central place to configure each question's behavior
 */

export interface QuestionConfig {
  id: string;
  label: string; // Display label
  icon?: string; // Icon name (from lucide-react)
  showInClient: boolean; // Show in client views
  showInAdmin: boolean; // Show in admin views
  renderHint?: 'tags' | 'separated' | 'default'; // Rendering hint for special display
}

export const QUESTION_CONFIGS: Record<string, QuestionConfig> = {
  name: { id: 'name', label: 'Name', icon: 'User', showInClient: false, showInAdmin: true },
  date_of_birth: { id: 'date_of_birth', label: 'Age', icon: 'Calendar', showInClient: false, showInAdmin: true },
  gender: { id: 'gender', label: 'Gender', icon: 'User', showInClient: false, showInAdmin: true },
  city: { id: 'city', label: 'Location', icon: 'MapPin', showInClient: false, showInAdmin: true },
  instagram_contact: { id: 'instagram_contact', label: 'Instagram', icon: 'Instagram', showInClient: true, showInAdmin: true },
  dating_preference: { id: 'dating_preference', label: 'Looking for', icon: 'Heart', showInClient: true, showInAdmin: true },
  education_level: { id: 'education_level', label: 'Education', icon: 'GraduationCap', showInClient: true, showInAdmin: true },
  height: { id: 'height', label: 'Height', icon: 'Ruler', showInClient: true, showInAdmin: true },
  ethnicity: { id: 'ethnicity', label: 'Origin', icon: 'Users', showInClient: true, showInAdmin: true },
  religion: { id: 'religion', label: 'Religion', icon: 'Church', showInClient: true, showInAdmin: true },
  alcohol: { id: 'alcohol', label: 'Drinking', icon: 'Wine', showInClient: true, showInAdmin: true },
  smoking: { id: 'smoking', label: 'Smoking', icon: 'Cigarette', showInClient: true, showInAdmin: true },
  marriage: { id: 'marriage', label: 'Marriage', icon: 'Heart', showInClient: true, showInAdmin: true },
  marriage_timeline: { id: 'marriage_timeline', label: 'Timeline', icon: 'Calendar', showInClient: true, showInAdmin: true },
  children: { id: 'children', label: 'Children', icon: 'Baby', showInClient: true, showInAdmin: true },
  interests: { id: 'interests', label: 'Interests', icon: 'Sparkles', showInClient: true, showInAdmin: true, renderHint: 'tags' },
  relationship_values: { id: 'relationship_values', label: 'Relationship Values', icon: 'Heart', showInClient: false, showInAdmin: true },
  relationship_keys: { id: 'relationship_keys', label: 'Key Elements', icon: 'Key', showInClient: true, showInAdmin: true, renderHint: 'separated' },
  mbti: { id: 'mbti', label: 'MBTI', icon: 'User', showInClient: true, showInAdmin: true },
  // Preference questions (importance ratings)
  education_importance: { id: 'education_importance', label: 'Education Importance', icon: 'Star', showInClient: false, showInAdmin: true },
  height_preference: { id: 'height_preference', label: 'Height Preference', icon: 'Ruler', showInClient: false, showInAdmin: true },
  ethnicity_importance: { id: 'ethnicity_importance', label: 'Ethnicity Importance', icon: 'Star', showInClient: false, showInAdmin: true },
  religion_importance: { id: 'religion_importance', label: 'Religion Importance', icon: 'Star', showInClient: false, showInAdmin: true },
  appearance_importance: { id: 'appearance_importance', label: 'Looks Importance', icon: 'Star', showInClient: false, showInAdmin: true },
  age_importance: { id: 'age_importance', label: 'Age Importance', icon: 'Star', showInClient: false, showInAdmin: true },
  income_importance: { id: 'income_importance', label: 'Income Importance', icon: 'Star', showInClient: false, showInAdmin: true },
};

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

/**
 * CARD-BASED CONFIGURATION HELPERS
 */

/**
 * Gets the configuration for a specific question
 */
export function getQuestionConfig(questionId: string): QuestionConfig | undefined {
  return QUESTION_CONFIGS[questionId];
}

/**
 * Checks if a question should be displayed in a specific context
 */
export function shouldShowInContext(questionId: string, context: ViewContext): boolean {
  const config = QUESTION_CONFIGS[questionId];
  if (!config) return false;

  return context === 'client' ? config.showInClient : config.showInAdmin;
}

/**
 * Gets profile cards for client view, filtered by visibility
 */
export function getClientProfileCards(
  allQuestions: QuestionnaireQuestion[],
  profileAnswers: Record<string, any>,
  context: { isMutualMatch?: boolean } = {}
): Array<{ card: ProfileCardConfig; questions: Array<{ question: QuestionnaireQuestion; answer: any }> }> {
  return CLIENT_PROFILE_CARDS.map(card => {
    const questions = card.questionIds
      .map(qId => {
        const question = allQuestions.find(q => q.id === qId);
        if (!question) return null;

        // Check display rules
        if (!shouldDisplayQuestion(question, context)) return null;

        // Check if question should be shown in client context
        if (!shouldShowInContext(qId, 'client')) return null;

        const answer = profileAnswers[qId];

        // Only include if there's an answer (unless it's a special case)
        if (!answer && answer !== 0 && answer !== false) return null;

        return { question, answer };
      })
      .filter((item): item is { question: QuestionnaireQuestion; answer: any } => item !== null);

    return { card, questions };
  }).filter(item => item.questions.length > 0);
}

/**
 * Gets admin view sections with all questions
 */
export function getAdminViewSections(
  allQuestions: QuestionnaireQuestion[],
  profileAnswers: Record<string, any>
): Array<{ section: AdminViewSection; questions: Array<{ question: QuestionnaireQuestion; answer: any }> }> {
  return ADMIN_VIEW_SECTIONS.map(section => {
    const questions = section.questionIds
      .map(qId => {
        const question = allQuestions.find(q => q.id === qId);
        if (!question) return null;

        // Check if question should be shown in admin context
        if (!shouldShowInContext(qId, 'admin')) return null;

        const answer = profileAnswers[qId];

        // Include even without answer if alwaysShow is true
        if (!answer && answer !== 0 && answer !== false && !section.alwaysShow) return null;

        return { question, answer };
      })
      .filter((item): item is { question: QuestionnaireQuestion; answer: any } => item !== null);

    return { section, questions };
  }).filter(item => item.questions.length > 0);
}
