/**
 * Compatibility Calculator Utility
 * Calculates bidirectional match compatibility scores between two profiles
 */

export interface ProfileAnswers {
  [questionId: string]: any;
}

export interface PreferenceQuestion {
  id: string;
  profileFieldId: string; // The corresponding profile question
  weight: number; // Importance weight (0-1)
}

// Map preference questions to their corresponding profile questions
const PREFERENCE_MAPPINGS: PreferenceQuestion[] = [
  { id: 'height_preference', profileFieldId: 'height', weight: 0.15 },
  { id: 'ethnicity_importance', profileFieldId: 'ethnicity', weight: 0.2 },
  { id: 'religion_importance', profileFieldId: 'religion', weight: 0.2 },
  { id: 'education_importance', profileFieldId: 'education_level', weight: 0.15 },
  { id: 'age_importance', profileFieldId: 'date_of_birth', weight: 0.15 },
  { id: 'appearance_importance', profileFieldId: 'appearance', weight: 0.15 },
];

/**
 * Calculate how well profile B matches profile A's preferences
 */
export function calculateDirectionalCompatibility(
  profileAPreferences: ProfileAnswers,
  profileBData: ProfileAnswers
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const mapping of PREFERENCE_MAPPINGS) {
    const preference = profileAPreferences[mapping.id];
    const profileValue = profileBData[mapping.profileFieldId];

    // Skip if either value is missing
    if (!preference || !profileValue) continue;

    // Calculate match score based on question type
    const matchScore = calculateFieldMatch(
      mapping.id,
      preference,
      profileValue,
      profileAPreferences,
      profileBData
    );

    totalScore += matchScore * mapping.weight;
    totalWeight += mapping.weight;
  }

  // Normalize to 0-100 scale
  return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
}

/**
 * Calculate bidirectional compatibility scores
 */
export function calculateBidirectionalCompatibility(
  profile1Answers: ProfileAnswers,
  profile2Answers: ProfileAnswers
): { profile1ToProfile2: number; profile2ToProfile1: number; average: number } {
  const profile1ToProfile2 = calculateDirectionalCompatibility(profile1Answers, profile2Answers);
  const profile2ToProfile1 = calculateDirectionalCompatibility(profile2Answers, profile1Answers);
  const average = Math.round((profile1ToProfile2 + profile2ToProfile1) / 2);

  return {
    profile1ToProfile2,
    profile2ToProfile1,
    average,
  };
}

/**
 * Calculate match score for a specific field
 */
function calculateFieldMatch(
  preferenceId: string,
  preferenceValue: any,
  profileValue: any,
  profileAAnswers: ProfileAnswers,
  profileBAnswers: ProfileAnswers
): number {
  switch (preferenceId) {
    case 'height_preference':
      return calculateHeightMatch(preferenceValue, profileValue);

    case 'ethnicity_importance':
      return calculateEthnicityMatch(preferenceValue, profileValue, profileAAnswers);

    case 'religion_importance':
      return calculateReligionMatch(preferenceValue, profileValue, profileAAnswers);

    case 'education_importance':
      return calculateEducationMatch(preferenceValue, profileValue);

    case 'age_importance':
      return calculateAgeMatch(preferenceValue, profileBAnswers);

    case 'appearance_importance':
      // Appearance is subjective, give default score
      return 0.7;

    default:
      return 0;
  }
}

function calculateHeightMatch(preference: any, actualHeight: any): number {
  // If no strong preference, give partial credit
  if (!preference || preference === 'not_important') return 0.8;

  // Implement height matching logic based on your preference structure
  // For now, return high score if height exists
  return actualHeight ? 1.0 : 0.5;
}

function calculateEthnicityMatch(
  importance: any,
  actualEthnicity: any,
  profileAAnswers: ProfileAnswers
): number {
  // Get importance level (scale question)
  const importanceLevel = getImportanceLevel(importance);

  if (importanceLevel === 0) return 1.0; // Not important

  const preferredEthnicity = profileAAnswers['ethnicity'];
  if (!preferredEthnicity) return 0.7;

  // Check if ethnicities match
  const matches = checkArrayMatch(preferredEthnicity, actualEthnicity);

  // Weight by importance
  return matches ? 1.0 : Math.max(0, 1.0 - importanceLevel * 0.3);
}

function calculateReligionMatch(
  importance: any,
  actualReligion: any,
  profileAAnswers: ProfileAnswers
): number {
  const importanceLevel = getImportanceLevel(importance);

  if (importanceLevel === 0) return 1.0;

  const preferredReligion = profileAAnswers['religion'];
  if (!preferredReligion) return 0.7;

  const matches = checkValueMatch(preferredReligion, actualReligion);

  return matches ? 1.0 : Math.max(0, 1.0 - importanceLevel * 0.4);
}

function calculateEducationMatch(importance: any, actualEducation: any): number {
  const importanceLevel = getImportanceLevel(importance);

  if (importanceLevel === 0) return 1.0;

  // Education levels hierarchy: High School < Bachelor's < Master's < PhD
  const educationLevels: Record<string, number> = {
    'High School': 1,
    "Bachelor's Degree": 2,
    "Master's Degree": 3,
    'PhD': 4,
  };

  const level = educationLevels[actualEducation] || 0;

  // Higher education gets better scores when education is important
  return level >= 2 ? 1.0 : Math.max(0.5, 1.0 - importanceLevel * 0.2);
}

function calculateAgeMatch(importance: any, profileBAnswers: ProfileAnswers): number {
  const importanceLevel = getImportanceLevel(importance);

  if (importanceLevel === 0) return 1.0;

  // Age matching would require calculating actual age from date_of_birth
  // and checking against preferred age range
  // For now, return a default score
  return 0.8;
}

/**
 * Get importance level from scale question (0 = not important, 1 = very important)
 */
function getImportanceLevel(importanceValue: any): number {
  if (!importanceValue) return 0;

  // Handle scale values (1-5 or 1-10)
  if (typeof importanceValue === 'number') {
    return importanceValue / 10; // Normalize to 0-1
  }

  // Handle string values
  if (typeof importanceValue === 'string') {
    const lower = importanceValue.toLowerCase();
    if (lower.includes('not') || lower.includes('unimportant')) return 0;
    if (lower.includes('very') || lower.includes('essential')) return 1;
    if (lower.includes('somewhat') || lower.includes('moderately')) return 0.5;
  }

  return 0.5; // Default moderate importance
}

/**
 * Check if values match (handles arrays and single values)
 */
function checkArrayMatch(value1: any, value2: any): boolean {
  const arr1 = Array.isArray(value1) ? value1 : [value1];
  const arr2 = Array.isArray(value2) ? value2 : [value2];

  return arr1.some((v1) => arr2.some((v2) => normalizeValue(v1) === normalizeValue(v2)));
}

function checkValueMatch(value1: any, value2: any): boolean {
  return normalizeValue(value1) === normalizeValue(value2);
}

function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim();
}

/**
 * Get matching and non-matching criteria for detailed comparison
 */
export interface CriteriaComparison {
  questionId: string;
  questionText: string;
  preferenceValue: any;
  profileValue: any;
  isMatch: boolean;
  importance: string;
}

export function getDetailedComparison(
  profile1Answers: ProfileAnswers,
  profile2Answers: ProfileAnswers,
  questions: Array<{ id: string; question_text_en: string; question_type: string }>
): CriteriaComparison[] {
  const comparisons: CriteriaComparison[] = [];

  for (const mapping of PREFERENCE_MAPPINGS) {
    const preference = profile1Answers[mapping.id];
    const profileValue = profile2Answers[mapping.profileFieldId];

    if (!preference && !profileValue) continue;

    const preferenceQuestion = questions.find((q) => q.id === mapping.id);
    const profileQuestion = questions.find((q) => q.id === mapping.profileFieldId);

    if (!preferenceQuestion || !profileQuestion) continue;

    const matchScore = calculateFieldMatch(
      mapping.id,
      preference,
      profileValue,
      profile1Answers,
      profile2Answers
    );

    comparisons.push({
      questionId: mapping.profileFieldId,
      questionText: profileQuestion.question_text_en,
      preferenceValue: preference,
      profileValue: profileValue,
      isMatch: matchScore >= 0.7,
      importance: getImportanceLabel(preference),
    });
  }

  return comparisons;
}

function getImportanceLabel(value: any): string {
  const level = getImportanceLevel(value);
  if (level >= 0.8) return 'Very Important';
  if (level >= 0.5) return 'Moderately Important';
  if (level > 0) return 'Somewhat Important';
  return 'Not Important';
}
