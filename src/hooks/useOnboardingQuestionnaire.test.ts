import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOnboardingQuestionnaire, QuestionnaireQuestion } from "./useOnboardingQuestionnaire";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Mock modules
vi.mock("@/integrations/supabase/client");
vi.mock("@/hooks/use-toast");

const mockQuestions: QuestionnaireQuestion[] = [
  { id: "name", question_text_en: "What is your name?", question_order: 1, version: 1, question_type: 'text', options: {}, validation_rules: {}, is_required: true, conditional_on: null, conditional_value: null, profile_field_mapping: 'first_name,last_name', icon_name: null, help_text_en: null, help_text_fr: null, question_text_fr: null, subtitle_en: null, subtitle_fr: null },
  { id: "q2", question_text_en: "Are you a smoker?", question_order: 2, version: 1, question_type: 'choice', options: ['Yes', 'No'], validation_rules: {}, is_required: true, conditional_on: null, conditional_value: null, profile_field_mapping: null, icon_name: null, help_text_en: null, help_text_fr: null, question_text_fr: null, subtitle_en: null, subtitle_fr: null },
  { id: "q3", question_text_en: "How many cigarettes do you smoke a day?", question_order: 3, version: 1, question_type: 'number', options: {}, validation_rules: {}, is_required: true, conditional_on: 'q2', conditional_value: 'Yes', profile_field_mapping: null, icon_name: null, help_text_en: null, help_text_fr: null, question_text_fr: null, subtitle_en: null, subtitle_fr: null },
];

const mockProfile = { user_id: "123", first_name: "John", last_name: "Doe" };
const mockAnswers = [{ user_id: "123", question_id: "q2", answer: "Yes" }];

describe("useOnboardingQuestionnaire", () => {
  let toast: vi.Mock;
  let from: vi.Mock;
  let update: vi.Mock;
  let eqUpdate: vi.Mock;
  let upsert: vi.Mock;
  let del: vi.Mock;
  let eqDel: vi.Mock;
  let eqDel2: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    toast = vi.fn();
    vi.mocked(useToast).mockReturnValue({ toast });

    eqUpdate = vi.fn().mockResolvedValue({ error: null });
    update = vi.fn(() => ({ eq: eqUpdate }));
    upsert = vi.fn().mockResolvedValue({ error: null });
    eqDel2 = vi.fn().mockResolvedValue({ error: null });
    eqDel = vi.fn(() => ({ eq: eqDel2 }));
    del = vi.fn(() => ({ eq: eqDel }));

    from = vi.fn();
    vi.mocked(supabase.from).mockImplementation(from);

    from.mockImplementation((tableName) => {
        if (tableName === 'questionnaire_questions') {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null })
            };
        }
        if (tableName === 'profiles') {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [mockProfile], error: null }),
                update
            };
        }
        if (tableName === 'profile_answers') {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: mockAnswers, error: null }),
                upsert,
                delete: del
            };
        }
        return {} as any;
    });
  });

  it("should load questions and progress on init, pre-filling name", async () => {
    const { result } = renderHook(() => useOnboardingQuestionnaire("123"));
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    expect(result.current.answers).toEqual({
        q2: "Yes",
        name: ["John", "Doe"]
    });
  });

  it("should save an answer and update profile", async () => {
    const { result } = renderHook(() => useOnboardingQuestionnaire("123"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveAnswer("name", ["Jane", "Smith"]);
    });

    expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ question_id: "name", answer: ["Jane", "Smith"] }),
        expect.any(Object)
    );
    expect(update).toHaveBeenCalledWith({ first_name: "Jane", last_name: "Smith" });
    expect(eqUpdate).toHaveBeenCalledWith("user_id", "123");
  });

  it("should show/hide conditional questions and delete answers", async () => {
    const { result } = renderHook(() => useOnboardingQuestionnaire("123"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.questions.find(q => q.id === 'q3')).toBeDefined();

    await act(async () => {
      await result.current.saveAnswer("q2", "No");
    });

    expect(result.current.questions.find(q => q.id === 'q3')).toBeUndefined();
    expect(del).toHaveBeenCalled();
    expect(eqDel).toHaveBeenCalledWith("user_id", "123");
    expect(eqDel2).toHaveBeenCalledWith("question_id", "q3");
  });

  it("should handle errors during loading", async () => {
    from.mockImplementation(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve(({ error: { message: "Load error" } })))
            }))
        }))
    } as any));

    const { result } = renderHook(() => useOnboardingQuestionnaire("123"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error loading questionnaire",
        variant: "destructive"
    }));
  });
});