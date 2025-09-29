import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ProfileQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect';
  options?: string[];
}

const questions: Question[] = [
  {
    id: 'about',
    text: 'Tell us about yourself',
    type: 'text',
  },
  {
    id: 'interests',
    text: 'What are your interests?',
    type: 'multiselect',
    options: ['Travel', 'Music', 'Sports', 'Art', 'Technology', 'Food', 'Nature', 'Reading'],
  },
  // Add more questions here
];

export function ProfileQuestionnaire({ isOpen, onClose }: ProfileQuestionnaireProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (user) {
      loadSavedAnswers();
    }
  }, [user]);

  useEffect(() => {
    // Calculate progress
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    setProgress((answeredQuestions / totalQuestions) * 100);
  }, [answers]);

  const loadSavedAnswers = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profile_answers')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const savedAnswers = data.reduce((acc, curr) => ({
          ...acc,
          [curr.question_id]: curr.answer,
        }), {});
        setAnswers(savedAnswers);
      }
    } catch (error) {
      console.error('Error loading saved answers:', error);
    }
  };

  const saveAnswer = async (questionId: string, answer: any) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profile_answers')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          answer: answer,
        }, {
          onConflict: 'user_id,question_id'
        });

      if (error) throw error;

      setAnswers(prev => ({
        ...prev,
        [questionId]: answer,
      }));

      // Update profile completion percentage
      await supabase
        .from('profiles')
        .update({ completion_percentage: progress })
        .eq('user_id', user.id);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (currentPage < questions.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const currentQuestion = questions[currentPage];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(progress)}% Complete
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">{currentQuestion.text}</h3>
            
            {currentQuestion.type === 'text' && (
              <textarea
                className="w-full p-2 border rounded-md"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                rows={4}
              />
            )}

            {currentQuestion.type === 'multiselect' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={answers[currentQuestion.id]?.includes(option)}
                      onChange={(e) => {
                        const currentAnswers = answers[currentQuestion.id] || [];
                        const newAnswers = e.target.checked
                          ? [...currentAnswers, option]
                          : currentAnswers.filter((a: string) => a !== option);
                        saveAnswer(currentQuestion.id, newAnswers);
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentPage === questions.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}