import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QuestionnaireQuestion {
  id: string;
  version: number;
  question_order: number;
  question_type: string;
  question_text_en: string;
  question_text_fr: string | null;
  subtitle_en: string | null;
  subtitle_fr: string | null;
  help_text_en: string | null;
  help_text_fr: string | null;
  options: any;
  validation_rules: any;
  is_required: boolean;
  conditional_on: string | null;
  conditional_value: string | null;
  profile_field_mapping: string | null;
  icon_name: string | null;
}

export const useOnboardingQuestionnaire = (userId: string | undefined) => {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadQuestionsAndProgress();
    }
  }, [userId]);

  const loadQuestionsAndProgress = async () => {
    try {
      // Load questions from database
      const { data: questionsData, error: questionsError } = await supabase
        .from("questionnaire_questions")
        .select("*")
        .eq("version", 1)
        .order("question_order");

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Load user's profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      setProfile(profileData);

      // Load saved answers
      const { data: answersData } = await supabase
        .from("profile_answers")
        .select("*")
        .eq("user_id", userId);

      const savedAnswers: Record<string, any> = {};
      answersData?.forEach((item) => {
        savedAnswers[item.question_id] = item.answer;
      });

      // Pre-fill name from profile if not already answered
      if (!savedAnswers['name'] && profileData) {
        savedAnswers['name'] = [
          profileData.first_name || '',
          profileData.last_name || ''
        ];
      }

      setAnswers(savedAnswers);

      // Determine current question index based on progress
      const answeredCount = Object.keys(savedAnswers).length;
      setCurrentQuestionIndex(Math.min(answeredCount, (questionsData?.length || 1) - 1));
    } catch (error) {
      console.error("Error loading questionnaire:", error);
      toast({
        title: "Error loading questionnaire",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (questionId: string, answer: any) => {
    try {
      // Don't save null/undefined answers
      if (answer === null || answer === undefined) {
        console.warn('Skipping save for null/undefined answer');
        return;
      }

      // Save to profile_answers table
      const { error } = await supabase
        .from("profile_answers")
        .upsert({
          user_id: userId,
          question_id: questionId,
          answer,
          questionnaire_version: 1,
        }, {
          onConflict: 'user_id,question_id'
        });

      if (error) throw error;

      // Update local state
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));

      // Check if any questions depend on this question and delete their answers if condition no longer met
      const dependentQuestions = questions.filter(
        (q) => q.conditional_on === questionId && q.conditional_value !== answer
      );

      for (const dependentQ of dependentQuestions) {
        // Delete the dependent question's answer from database
        await supabase
          .from("profile_answers")
          .delete()
          .eq("user_id", userId)
          .eq("question_id", dependentQ.id);

        // Remove from local state
        setAnswers((prev) => {
          const newAnswers = { ...prev };
          delete newAnswers[dependentQ.id];
          return newAnswers;
        });
      }

      // If this question maps to a profile field, update profile too
      const question = questions.find((q) => q.id === questionId);
      if (question?.profile_field_mapping) {
        const fields = question.profile_field_mapping.split(",");
        const updateData: any = {};

        if (fields.length === 1) {
          updateData[fields[0]] = answer;
        } else {
          // Handle multi-field questions (like name)
          fields.forEach((field, index) => {
            if (Array.isArray(answer)) {
              updateData[field] = answer[index];
            }
          });
        }

        await supabase
          .from("profiles")
          .update(updateData)
          .eq("user_id", userId);
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      toast({
        title: "Error saving answer",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getVisibleQuestions = () => {
    return questions.filter((question) => {
      // Check conditional logic
      if (question.conditional_on && question.conditional_value) {
        const conditionalAnswer = answers[question.conditional_on];
        return conditionalAnswer === question.conditional_value;
      }
      return true;
    });
  };

  return {
    questions: getVisibleQuestions(),
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    saveAnswer,
    profile,
    loading,
  };
};
