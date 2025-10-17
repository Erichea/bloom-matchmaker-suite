/**
 * MBTI Utility Functions
 * Handles conversion between MBTI types and personality axis values
 */

export interface MBTIAxes {
  ei: number; // Extraversion (100) <-> Introversion (0)
  sn: number; // Sensing (0) <-> Intuition (100)
  tf: number; // Thinking (0) <-> Feeling (100)
  jp: number; // Judging (0) <-> Perceiving (100)
}

/**
 * Convert an MBTI type string (e.g., "ENFP") to axis values (0-100)
 * Each axis represents a spectrum:
 * - E/I: 0 = pure I, 100 = pure E
 * - S/N: 0 = pure S, 100 = pure N
 * - T/F: 0 = pure T, 100 = pure F
 * - J/P: 0 = pure J, 100 = pure P
 */
export function mbtiToAxes(mbtiType: string): MBTIAxes {
  if (!mbtiType || mbtiType.length !== 4) {
    // Default to center if invalid
    return { ei: 50, sn: 50, tf: 50, jp: 50 };
  }

  const type = mbtiType.toUpperCase();

  return {
    ei: type[0] === 'E' ? 75 : 25,   // E = 75%, I = 25%
    sn: type[1] === 'N' ? 75 : 25,   // N = 75%, S = 25%
    tf: type[2] === 'F' ? 75 : 25,   // F = 75%, T = 25%
    jp: type[3] === 'P' ? 75 : 25,   // P = 75%, J = 25%
  };
}

/**
 * Calculate match percentage between slider values and an MBTI type
 * Returns a value between 0-100 representing compatibility
 */
export function calculateMBTIMatch(axes: MBTIAxes, mbtiType: string): number {
  const targetAxes = mbtiToAxes(mbtiType);

  // Calculate distance on each axis (0-100 scale)
  const eiDist = Math.abs(axes.ei - targetAxes.ei);
  const snDist = Math.abs(axes.sn - targetAxes.sn);
  const tfDist = Math.abs(axes.tf - targetAxes.tf);
  const jpDist = Math.abs(axes.jp - targetAxes.jp);

  // Average distance across all axes
  const avgDistance = (eiDist + snDist + tfDist + jpDist) / 4;

  // Convert distance to match percentage (closer = higher match)
  // Max distance is 100, so match = 100 - distance
  const match = 100 - avgDistance;

  return Math.round(match);
}

/**
 * Get recommended MBTI types based on slider values
 * Returns types sorted by match percentage (highest first)
 */
export function getRecommendedMBTITypes(axes: MBTIAxes, minMatch: number = 50): string[] {
  const allTypes = [
    'ESFJ', 'ESFP', 'ESTP', 'ENTJ',
    'ENFJ', 'ENFP', 'ISFP', 'ESTJ',
    'ISTJ', 'ISTP', 'INFJ', 'INTJ',
    'ENTP', 'INFP', 'INTP', 'ISFJ'
  ];

  // Calculate match for each type
  const typesWithMatch = allTypes.map(type => ({
    type,
    match: calculateMBTIMatch(axes, type)
  }));

  // Filter by minimum match and sort by match percentage
  return typesWithMatch
    .filter(item => item.match >= minMatch)
    .sort((a, b) => b.match - a.match)
    .map(item => item.type);
}

/**
 * Determine which axis value should be set based on slider position
 * Returns the letter for that position (e.g., 'E' or 'I' for ei axis)
 */
export function getAxisLetter(axis: 'ei' | 'sn' | 'tf' | 'jp', value: number): string {
  const axisMap = {
    ei: value >= 50 ? 'E' : 'I',
    sn: value >= 50 ? 'N' : 'S',
    tf: value >= 50 ? 'F' : 'T',
    jp: value >= 50 ? 'P' : 'J',
  };

  return axisMap[axis];
}

/**
 * Get descriptive info for each axis
 */
export const axisDescriptions = {
  ei: {
    title: 'Energy Style',
    question: 'Do you prefer to focus on your inner world or engage with the outer world?',
    left: { label: 'Introversion', value: 'I', description: 'Reflective, reserved, prefer solitude' },
    right: { label: 'Extraversion', value: 'E', description: 'Outgoing, energetic, prefer interaction' },
  },
  sn: {
    title: 'Information Processing',
    question: 'Do you trust concrete facts and past experiences or patterns and possibilities?',
    left: { label: 'Sensing', value: 'S', description: 'Practical, detail-oriented, present-focused' },
    right: { label: 'Intuition', value: 'N', description: 'Abstract, imaginative, future-oriented' },
  },
  tf: {
    title: 'Decision Making',
    question: 'Do you make decisions based on logic and objective analysis or on values and how they affect others?',
    left: { label: 'Thinking', value: 'T', description: 'Logical, objective, principle-focused' },
    right: { label: 'Feeling', value: 'F', description: 'Empathetic, values-oriented, harmony-focused' },
  },
  jp: {
    title: 'Lifestyle',
    question: 'Do you prefer structure and planning or spontaneity and flexibility in your life?',
    left: { label: 'Judging', value: 'J', description: 'Organized, planned, decisive' },
    right: { label: 'Perceiving', value: 'P', description: 'Flexible, spontaneous, adaptable' },
  },
};
