import { describe, it, expect } from "vitest";
import { calculateBidirectionalCompatibility, ProfileAnswers } from "./compatibilityCalculator";

describe("calculateBidirectionalCompatibility", () => {
  it("should return 0 for all scores when there are no common keys", () => {
    const profile1Answers: ProfileAnswers = { q1: "a", q2: "b" };
    const profile2Answers: ProfileAnswers = { q3: "c", q4: "d" };
    const result = calculateBidirectionalCompatibility(profile1Answers, profile2Answers);
    expect(result).toEqual({ profile1ToProfile2: 0, profile2ToProfile1: 0, average: 0 });
  });

  it("should return 100 for all scores when all common answers match", () => {
    const profile1Answers: ProfileAnswers = { q1: "a", q2: "b" };
    const profile2Answers: ProfileAnswers = { q1: "a", q2: "b" };
    const result = calculateBidirectionalCompatibility(profile1Answers, profile2Answers);
    expect(result).toEqual({ profile1ToProfile2: 100, profile2ToProfile1: 100, average: 100 });
  });

  it("should calculate the correct score for partially matching answers", () => {
    const profile1Answers: ProfileAnswers = { q1: "a", q2: "b", q3: "c" };
    const profile2Answers: ProfileAnswers = { q1: "a", q2: "c", q3: "c" };
    const result = calculateBidirectionalCompatibility(profile1Answers, profile2Answers);
    // 2 out of 3 match, so 67%
    expect(result.average).toBe(67);
  });

  it("should handle complex data types like arrays", () => {
    const profile1Answers: ProfileAnswers = { q1: [1, 2], q2: ["a", "b"] };
    const profile2Answers: ProfileAnswers = { q1: [1, 2], q2: ["a", "c"] };
    const result = calculateBidirectionalCompatibility(profile1Answers, profile2Answers);
    // 1 out of 2 match, so 50%
    expect(result.average).toBe(50);
  });

  it("should ignore null and undefined values", () => {
    const profile1Answers: ProfileAnswers = { q1: "a", q2: null, q3: undefined };
    const profile2Answers: ProfileAnswers = { q1: "a", q2: "b", q3: "c" };
    const result = calculateBidirectionalCompatibility(profile1Answers, profile2Answers);
    // Only q1 is a common valid key, and it matches.
    expect(result.average).toBe(100);
  });

  it("should return 0 for empty profiles", () => {
    const profile1Answers: ProfileAnswers = {};
    const profile2Answers: ProfileAnswers = {};
    const result = calculateBidirectionalCompatibility(profile1Answers, profile2Answers);
    expect(result).toEqual({ profile1ToProfile2: 0, profile2ToProfile1: 0, average: 0 });
  });

  it("should handle cases where one profile is empty", () => {
    const profile1Answers: ProfileAnswers = { q1: "a" };
    const profile2Answers: ProfileAnswers = {};
    const result = calculateBidirectionalCompatibility(profile1Answers, profile2Answers);
    expect(result).toEqual({ profile1ToProfile2: 0, profile2ToProfile1: 0, average: 0 });
  });

  it("should handle different numbers of questions", () => {
    const profile1Answers: ProfileAnswers = { q1: "a", q2: "b" };
    const profile2Answers: ProfileAnswers = { q1: "a", q2: "b", q3: "c" };
    const result = calculateBidirectionalCompatibility(profile1Answers, profile2Answers);
    // Common keys are q1, q2. Both match.
    expect(result.average).toBe(100);
  });
});