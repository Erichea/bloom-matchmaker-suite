/**
 * Compatibility Calculator Utility
 * Calculates bidirectional match compatibility scores between two profiles
 */

export interface ProfileAnswers {
  [questionId: string]: any;
}

/**
 * Calculate bidirectional compatibility scores based on the number of common answers.
 */
export function calculateBidirectionalCompatibility(
  profile1Answers: ProfileAnswers,
  profile2Answers: ProfileAnswers
): { profile1ToProfile2: number; profile2ToProfile1: number; average: number } {
  const keys1 = Object.keys(profile1Answers);
  const keys2 = Object.keys(profile2Answers);
  
  const commonKeys = keys1.filter(key => 
    keys2.includes(key) && 
    profile1Answers[key] !== null && 
    profile2Answers[key] !== null && 
    profile1Answers[key] !== undefined && 
    profile2Answers[key] !== undefined
  );

  if (commonKeys.length === 0) {
    return {
      profile1ToProfile2: 0,
      profile2ToProfile1: 0,
      average: 0,
    };
  }

  let matchingAnswers = 0;
  for (const key of commonKeys) {
    const answer1 = profile1Answers[key];
    const answer2 = profile2Answers[key];

    if (JSON.stringify(answer1) === JSON.stringify(answer2)) {
      matchingAnswers++;
    }
  }

  const average = Math.round((matchingAnswers / commonKeys.length) * 100);

  return {
    profile1ToProfile2: average,
    profile2ToProfile1: average,
    average,
  };
}