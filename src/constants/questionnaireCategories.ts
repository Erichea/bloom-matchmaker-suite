// Categories for organizing questionnaire questions in the admin view
export const questionnaireCategories = [
  {
    name: "Basic Information",
    questionIds: ["name", "date_of_birth", "gender", "city"] as string[]
  },
  {
    name: "Dating & Relationship Goals",
    questionIds: ["dating_preference", "marriage", "marriage_timeline", "relationship_values", "relationship_keys"] as string[]
  },
  {
    name: "Physical & Appearance",
    questionIds: ["height", "height_preference", "appearance_importance"] as string[]
  },
  {
    name: "Background & Culture",
    questionIds: ["ethnicity", "ethnicity_importance", "religion", "religion_importance"] as string[]
  },
  {
    name: "Education & Income",
    questionIds: ["education_level", "education_importance", "income_importance"] as string[]
  },
  {
    name: "Lifestyle",
    questionIds: ["alcohol", "smoking", "interests"] as string[]
  },
  {
    name: "Compatibility Preferences",
    questionIds: ["age_importance", "mbti"] as string[]
  }
];

export type QuestionnaireCategoryName = typeof questionnaireCategories[number]["name"];
