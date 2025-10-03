// Categories for organizing questionnaire questions in the admin view
export const questionnaireCategories = [
  {
    name: "Basic Information",
    questionIds: ["name", "date_of_birth", "gender", "city"]
  },
  {
    name: "Dating & Relationship Goals",
    questionIds: ["dating_preference", "marriage", "marriage_timeline", "relationship_values", "relationship_keys"]
  },
  {
    name: "Physical & Appearance",
    questionIds: ["height", "height_preference", "appearance_importance"]
  },
  {
    name: "Background & Culture",
    questionIds: ["ethnicity", "ethnicity_importance", "religion", "religion_importance"]
  },
  {
    name: "Education & Income",
    questionIds: ["education_level", "education_importance", "income_importance"]
  },
  {
    name: "Lifestyle",
    questionIds: ["alcohol", "smoking", "interests"]
  },
  {
    name: "Compatibility Preferences",
    questionIds: ["age_importance", "mbti"]
  }
] as const;

export type QuestionnaireCategoryName = typeof questionnaireCategories[number]["name"];
