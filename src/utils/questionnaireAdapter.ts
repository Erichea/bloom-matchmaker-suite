import {
  User, Heart, MapPin, GraduationCap, Ruler, Globe, Eye, Church,
  Wine, Cigarette, Calendar, DollarSign, Star, Key, Brain, Cake
} from "lucide-react";
import { questionnaireCategories } from "@/constants/questionnaireCategories";

// Icon mapping from string names to Lucide components
const iconMap: Record<string, any> = {
  "user": User,
  "heart": Heart,
  "map-pin": MapPin,
  "graduation-cap": GraduationCap,
  "ruler": Ruler,
  "globe": Globe,
  "eye": Eye,
  "church": Church,
  "wine": Wine,
  "cigarette": Cigarette,
  "calendar": Calendar,
  "dollar-sign": DollarSign,
  "star": Star,
  "key": Key,
  "brain": Brain,
  "cake": Cake,
};

// Map question types from database format to component format
const typeMap: Record<string, string> = {
  "text": "text",
  "textarea": "textarea",
  "single_choice": "select",
  "multiple_choice": "multiselect",
  "scale": "range",
  "date": "text", // Date questions will be handled as text in the old component
  "number": "range",
};

// Get category name for a question ID
const getCategoryForQuestion = (questionId: string): string => {
  for (const category of questionnaireCategories) {
    if (category.questionIds.includes(questionId as any)) {
      return category.name;
    }
  }
  return "Other";
};

// Convert database question format to component format
export const adaptQuestionForComponent = (dbQuestion: any) => {
  return {
    id: dbQuestion.id,
    title: dbQuestion.question_text_en,
    description: dbQuestion.subtitle_en || dbQuestion.help_text_en || "",
    type: typeMap[dbQuestion.question_type] || "text",
    category: getCategoryForQuestion(dbQuestion.id),
    icon: iconMap[dbQuestion.icon_name] || User,
    options: Array.isArray(dbQuestion.options) ? dbQuestion.options : (
      typeof dbQuestion.options === 'object' && dbQuestion.options !== null
        ? Object.values(dbQuestion.options).filter(v => typeof v === 'string')
        : []
    ),
    min: dbQuestion.options?.min,
    max: dbQuestion.options?.max,
    required: dbQuestion.is_required ?? true,
  };
};

// Convert all questions and organize by category
export const adaptQuestionsForDisplay = (dbQuestions: any[]) => {
  return dbQuestions.map(adaptQuestionForComponent);
};

// Get unique categories from questions in order
export const getCategoriesFromQuestions = (dbQuestions: any[]): string[] => {
  const categoryOrder: string[] = [];
  const seen = new Set<string>();

  for (const category of questionnaireCategories) {
    const hasQuestion = dbQuestions.some(q =>
      category.questionIds.includes(q.id as any)
    );
    if (hasQuestion && !seen.has(category.name)) {
      categoryOrder.push(category.name);
      seen.add(category.name);
    }
  }

  return categoryOrder;
};
