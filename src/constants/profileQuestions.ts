import type { ComponentType } from "react";
import { Briefcase, Camera, Coffee, Heart, MapPin, Star, User } from "lucide-react";

export type QuestionType = "text" | "select" | "multiselect" | "textarea" | "range";

export interface Question {
  id: string;
  title: string;
  description: string;
  type: QuestionType;
  category: string;
  icon: ComponentType<any>;
  options?: string[];
  min?: number;
  max?: number;
  required?: boolean;
}

export const profileQuestions: Question[] = [
  {
    id: "about_me",
    title: "Tell us about yourself",
    description: "Share what makes you unique and what you're passionate about",
    type: "textarea",
    category: "About You",
    icon: User,
    required: true,
  },
  {
    id: "profession_details",
    title: "What do you do for work?",
    description: "Tell us about your career and professional interests",
    type: "textarea",
    category: "About You",
    icon: Briefcase,
    required: true,
  },
  {
    id: "interests",
    title: "What are your interests and hobbies?",
    description: "Select all that apply to you",
    type: "multiselect",
    category: "Interests",
    icon: Star,
    options: [
      "Travel & Adventure",
      "Photography",
      "Music & Concerts",
      "Art & Museums",
      "Sports & Fitness",
      "Cooking & Dining",
      "Reading & Writing",
      "Technology",
      "Nature & Hiking",
      "Dancing",
      "Movies & Theater",
      "Fashion & Style",
      "Entrepreneurship",
      "Volunteering",
      "Learning Languages",
      "Board Games",
    ],
    required: true,
  },
  {
    id: "favorite_activities",
    title: "What's your ideal weekend activity?",
    description: "Choose your preferred way to spend free time",
    type: "select",
    category: "Lifestyle",
    icon: Coffee,
    options: [
      "Exploring new restaurants or cafes",
      "Outdoor adventures and sports",
      "Cozy nights in with movies or books",
      "Social events and parties",
      "Cultural events like museums or concerts",
      "Working on personal projects or hobbies",
      "Traveling to new places",
    ],
    required: true,
  },
  {
    id: "values",
    title: "What values are most important to you?",
    description: "Select your top values",
    type: "multiselect",
    category: "Values",
    icon: Heart,
    options: [
      "Family",
      "Career Success",
      "Adventure",
      "Stability",
      "Creativity",
      "Health & Wellness",
      "Financial Security",
      "Spirituality",
      "Social Impact",
      "Personal Growth",
      "Freedom",
      "Authenticity",
    ],
    required: true,
  },
  {
    id: "personality_traits",
    title: "How would your friends describe you?",
    description: "Choose traits that best represent you",
    type: "multiselect",
    category: "Personality",
    icon: User,
    options: [
      "Outgoing & Social",
      "Thoughtful & Introspective",
      "Adventurous",
      "Reliable",
      "Creative & Artistic",
      "Analytical",
      "Empathetic",
      "Ambitious",
      "Funny & Witty",
      "Calm & Patient",
      "Spontaneous",
      "Organized",
    ],
    required: true,
  },
  {
    id: "lifestyle_preferences",
    title: "Describe your lifestyle",
    description: "Select what applies to you",
    type: "multiselect",
    category: "Lifestyle",
    icon: MapPin,
    options: [
      "Love to travel",
      "Prefer staying local",
      "Active and sporty",
      "Enjoy quiet evenings",
      "Social butterfly",
      "Small circle of close friends",
      "Night owl",
      "Early bird",
      "City life enthusiast",
      "Nature lover",
      "Foodie",
      "Health conscious",
    ],
    required: true,
  },
  {
    id: "relationship_goals",
    title: "What are you looking for?",
    description: "Select your relationship goals",
    type: "select",
    category: "Relationship",
    icon: Heart,
    options: [
      "Long-term committed relationship",
      "Marriage and family",
      "Companionship and connection",
      "Taking it slow and seeing where it goes",
      "Someone to share adventures with",
    ],
    required: true,
  },
  {
    id: "deal_breakers",
    title: "What are your deal breakers?",
    description: "Select any that would be incompatible",
    type: "multiselect",
    category: "Preferences",
    icon: Heart,
    options: [
      "Smoking",
      "Heavy drinking",
      "No desire for commitment",
      "Different life goals",
      "Poor communication",
      "Lack of ambition",
      "Dishonesty",
      "Different values about family",
      "Incompatible lifestyle",
      "No shared interests",
    ],
  },
  {
    id: "future_goals",
    title: "What are your goals for the next few years?",
    description: "Share your aspirations and plans",
    type: "textarea",
    category: "Future",
    icon: Star,
    required: true,
  },
  {
    id: "favorite_photo_moment",
    title: "Share a favorite captured moment",
    description: "Tell us the story behind a photo that represents you",
    type: "textarea",
    category: "About You",
    icon: Camera,
  },
];

export const profileQuestionCategories = Array.from(
  new Set(profileQuestions.map((question) => question.category)),
);
