import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ProfilePhoto {
  id: string;
  photo_url: string;
  order_index: number;
  is_primary: boolean | null;
}

interface SubmitProfileResult {
  success: boolean;
  message?: string;
  error?: unknown;
}

export const useProfileQuestionnaireData = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPhotosForProfile = useCallback(async (profileId: string) => {
    const { data, error } = await supabase
      .from("profile_photos")
      .select("*")
      .eq("profile_id", profileId)
      .order("order_index");

    if (error) throw error;
    setPhotos((data as ProfilePhoto[]) || []);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    setProfile(data);
    await loadPhotosForProfile(data.id);
  }, [user?.id, loadPhotosForProfile]);

  const loadSavedAnswers = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("profile_answers")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    if (data) {
      const savedAnswers = data.reduce((acc: Record<string, any>, curr: any) => ({
        ...acc,
        [curr.question_id]: curr.answer,
      }), {});
      setAnswers(savedAnswers);
    } else {
      setAnswers({});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchAll = async () => {
      try {
        await Promise.all([loadProfile(), loadSavedAnswers()]);
      } catch (error) {
        console.error("Error loading questionnaire data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user?.id, loadProfile, loadSavedAnswers]);

  const refreshPhotos = useCallback(async () => {
    if (!profile?.id) return;
    try {
      await loadPhotosForProfile(profile.id);
    } catch (error) {
      console.error("Error refreshing photos:", error);
    }
  }, [profile?.id, loadPhotosForProfile]);

  const saveAnswer = useCallback(async (questionId: string, answer: any) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("profile_answers")
        .upsert({
          user_id: user.id,
          question_id: questionId,
          answer,
        }, {
          onConflict: "user_id,question_id",
        });

      if (error) throw error;

      setAnswers(prev => ({
        ...prev,
        [questionId]: answer,
      }));

      const { data: completionData } = await supabase
        .rpc("calculate_questionnaire_completion", { p_user_id: user.id });

      if (completionData !== null) {
        await supabase
          .from("profiles")
          .update({ completion_percentage: completionData })
          .eq("user_id", user.id);
      }
    } catch (error: any) {
      console.error("Error saving answer:", error);
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  const submitProfileForReview = useCallback(async (): Promise<SubmitProfileResult> => {
    if (!user?.id) {
      return { success: false };
    }

    try {
      const { data, error } = await supabase
        .rpc("submit_profile_for_review", { p_user_id: user.id });

      if (error) throw error;

      return (data as SubmitProfileResult) ?? { success: false };
    } catch (error) {
      console.error("Submit profile error:", error);
      toast({
        title: "Error",
        description: "Failed to submit profile. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [user?.id, toast]);

  return {
    user,
    profile,
    photos,
    answers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    loading,
    saveAnswer,
    refreshPhotos,
    submitProfileForReview,
    setAnswers,
  };
};
