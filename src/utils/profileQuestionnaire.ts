import type { Question } from "@/constants/profileQuestions";

const isNonEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
};

export const isQuestionAnswered = (answer: unknown): boolean => isNonEmptyValue(answer);

export const getCompletedCategories = (
  answers: Record<string, any>,
  questions: Question[],
  categories: string[],
): string[] => {
  return categories.filter((category) => {
    const categoryQuestions = questions.filter((question) => question.category === category);
    const answeredQuestions = categoryQuestions.filter((question) => isQuestionAnswered(answers[question.id]));
    return answeredQuestions.length === categoryQuestions.length && categoryQuestions.length > 0;
  });
};

export const calculateCompletionPercentage = (
  answers: Record<string, any>,
  questions: Question[],
  categories: string[],
): number => {
  if (!categories.length) return 0;
  const completedCategories = getCompletedCategories(answers, questions, categories);
  return Math.round((completedCategories.length / categories.length) * 100);
};
