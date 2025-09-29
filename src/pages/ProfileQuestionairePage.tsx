import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ChevronLeft, ChevronRight, Check, User, Heart, MapPin, Briefcase, Star, Coffee, Camera, Book } from 'lucide-react';

interface Question {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'select' | 'multiselect' | 'textarea' | 'range';
  category: string;
  icon: React.ComponentType<any>;
  options?: string[];
  min?: number;
  max?: number;
  required?: boolean;
}

const questions: Question[] = [
  // Personal Information
  {
    id: 'about_me',
    title: 'Tell us about yourself',
    description: 'Share what makes you unique and what you\'re passionate about',
    type: 'textarea',
    category: 'About You',
    icon: User,
    required: true
  },
  {
    id: 'profession_details',
    title: 'What do you do for work?',
    description: 'Tell us about your career and professional interests',
    type: 'textarea',
    category: 'About You',
    icon: Briefcase,
    required: true
  },

  // Interests & Hobbies
  {
    id: 'interests',
    title: 'What are your interests and hobbies?',
    description: 'Select all that apply to you',
    type: 'multiselect',
    category: 'Interests',
    icon: Star,
    options: [
      'Travel & Adventure', 'Photography', 'Music & Concerts', 'Art & Museums',
      'Sports & Fitness', 'Cooking & Dining', 'Reading & Writing', 'Technology',
      'Nature & Hiking', 'Dancing', 'Movies & Theater', 'Fashion & Style',
      'Entrepreneurship', 'Volunteering', 'Learning Languages', 'Board Games'
    ],
    required: true
  },
  {
    id: 'favorite_activities',
    title: 'What\'s your ideal weekend activity?',
    description: 'Choose your preferred way to spend free time',
    type: 'select',
    category: 'Lifestyle',
    icon: Coffee,
    options: [
      'Exploring new restaurants or cafes',
      'Outdoor adventures and sports',
      'Cozy nights in with movies or books',
      'Social events and parties',
      'Cultural events like museums or concerts',
      'Working on personal projects or hobbies',
      'Traveling to new places'
    ],
    required: true
  },

  // Values & Personality
  {
    id: 'values',
    title: 'What values are most important to you?',
    description: 'Select your top values',
    type: 'multiselect',
    category: 'Values',
    icon: Heart,
    options: [
      'Family', 'Career Success', 'Adventure', 'Stability',
      'Creativity', 'Health & Wellness', 'Financial Security', 'Spirituality',
      'Social Impact', 'Personal Growth', 'Freedom', 'Authenticity'
    ],
    required: true
  },
  {
    id: 'personality_traits',
    title: 'How would your friends describe you?',
    description: 'Choose traits that best represent you',
    type: 'multiselect',
    category: 'Personality',
    icon: User,
    options: [
      'Outgoing & Social', 'Thoughtful & Introspective', 'Adventurous', 'Reliable',
      'Creative & Artistic', 'Analytical', 'Empathetic', 'Ambitious',
      'Funny & Witty', 'Calm & Patient', 'Spontaneous', 'Organized'
    ],
    required: true
  },

  // Lifestyle
  {
    id: 'lifestyle_preferences',
    title: 'Describe your lifestyle',
    description: 'Select what applies to you',
    type: 'multiselect',
    category: 'Lifestyle',
    icon: MapPin,
    options: [
      'Love to travel', 'Prefer staying local', 'Active and sporty', 'Enjoy quiet evenings',
      'Social butterfly', 'Small circle of close friends', 'Night owl', 'Early bird',
      'City life enthusiast', 'Nature lover', 'Foodie', 'Health conscious'
    ],
    required: true
  },

  // Relationship Goals
  {
    id: 'relationship_goals',
    title: 'What are you looking for?',
    description: 'Select your relationship goals',
    type: 'select',
    category: 'Relationship',
    icon: Heart,
    options: [
      'Long-term committed relationship',
      'Marriage and family',
      'Companionship and connection',
      'Taking it slow and seeing where it goes',
      'Someone to share adventures with'
    ],
    required: true
  },
  {
    id: 'deal_breakers',
    title: 'What are your deal breakers?',
    description: 'Select any that would be incompatible',
    type: 'multiselect',
    category: 'Preferences',
    icon: Heart,
    options: [
      'Smoking', 'Heavy drinking', 'No desire for commitment', 'Different life goals',
      'Poor communication', 'Lack of ambition', 'Dishonesty', 'Different values about family',
      'Incompatible lifestyle', 'No shared interests'
    ]
  },

  // Future & Goals
  {
    id: 'future_goals',
    title: 'What are your goals for the next few years?',
    description: 'Share your aspirations and plans',
    type: 'textarea',
    category: 'Future',
    icon: Star,
    required: true
  }
];

const categories = Array.from(new Set(questions.map(q => q.category)));

export default function ProfileQuestionnairePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadSavedAnswers();
  }, [user, navigate]);

  const loadSavedAnswers = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profile_answers')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data) {
        const savedAnswers = data.reduce((acc: Record<string, any>, curr: any) => ({
          ...acc,
          [curr.question_id]: curr.answer,
        }), {});
        setAnswers(savedAnswers);
      }
    } catch (error) {
      console.error('Error loading saved answers:', error);
    } finally {
      setLoading(false);
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

      const newAnswers = {
        ...answers,
        [questionId]: answer,
      };
      setAnswers(newAnswers);

      // Calculate completion percentage using the database function
      const { data: completionData } = await supabase
        .rpc('calculate_questionnaire_completion', { p_user_id: user.id });

      if (completionData !== null) {
        await supabase
          .from('profiles')
          .update({ completion_percentage: completionData })
          .eq('user_id', user.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCompletionPercentage = () => {
    const completedCategories = categories.filter(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      const answeredInCategory = categoryQuestions.filter(q => answers[q.id] &&
        (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : answers[q.id].toString().trim() !== ''));
      return answeredInCategory.length === categoryQuestions.length;
    });
    return Math.round((completedCategories.length / categories.length) * 100);
  };

  const handleFinish = async () => {
    if (!user?.id) return;

    const requiredQuestions = questions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => answers[q.id] &&
      (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : answers[q.id].toString().trim() !== ''));

    if (answeredRequired.length < requiredQuestions.length) {
      toast({
        title: "Please complete required questions",
        description: `${requiredQuestions.length - answeredRequired.length} required questions remaining.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the database function to submit for review
      const { data, error } = await supabase
        .rpc('submit_profile_for_review', { p_user_id: user.id });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Profile Submitted! 🎉",
          description: data.message || "Your profile has been submitted for review. You'll be notified once approved.",
        });
        navigate('/client/dashboard');
      } else {
        toast({
          title: "Unable to Submit",
          description: data?.message || "Please complete more of your profile before submitting.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: "Failed to submit profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const completionPercentage = getCompletionPercentage();
  const completedCategories = categories.filter(category => {
    const categoryQuestions = questions.filter(q => q.category === category);
    const answeredInCategory = categoryQuestions.filter(q => answers[q.id] &&
      (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : answers[q.id].toString().trim() !== ''));
    return answeredInCategory.length === categoryQuestions.length;
  });
  const currentCategory = currentQuestion.category;
  const Icon = currentQuestion.icon;

  const renderQuestionInput = () => {
    const value = answers[currentQuestion.id] || (currentQuestion.type === 'multiselect' ? [] : '');

    switch (currentQuestion.type) {
      case 'textarea':
        return (
          <textarea
            className="w-full p-4 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={value}
            onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
            rows={4}
            placeholder="Share your thoughts..."
          />
        );

      case 'text':
        return (
          <input
            type="text"
            className="w-full p-4 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={value}
            onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
            placeholder="Your answer..."
          />
        );

      case 'select':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiselect':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuestion.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentAnswers = Array.isArray(value) ? value : [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter((a: string) => a !== option);
                    saveAnswer(currentQuestion.id, newAnswers);
                  }}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[--gradient-hero] px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
              <p className="text-white/80">Help us find your perfect match</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-white/80 text-sm">
              <span>{completedCategories.length} of {categories.length} categories complete</span>
              <span>{completionPercentage}% complete</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Category Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category, index) => {
            const categoryQuestions = questions.filter(q => q.category === category);
            const answeredInCategory = categoryQuestions.filter(q => answers[q.id]).length;
            const isCurrentCategory = category === currentCategory;
            const isCompleted = answeredInCategory === categoryQuestions.length;

            // Find a question from this category to use its icon
            const categoryQuestion = questions.find(q => q.category === category);
            const CategoryIcon = categoryQuestion?.icon || Star;

            return (
              <button
                key={category}
                onClick={() => {
                  // Find the first question of this category
                  const firstQuestionIndex = questions.findIndex(q => q.category === category);
                  if (firstQuestionIndex !== -1) {
                    setCurrentQuestionIndex(firstQuestionIndex);
                  }
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                  isCurrentCategory
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : isCompleted
                    ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <CategoryIcon className="w-4 h-4" />
                <span>{category}</span>
                {isCompleted ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                )}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">{currentQuestion.category}</Badge>
                  {currentQuestion.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </div>
                <CardTitle className="text-xl mb-2">{currentQuestion.title}</CardTitle>
                <p className="text-muted-foreground text-sm">{currentQuestion.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderQuestionInput()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/client/dashboard')}
            >
              Save & Exit
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleFinish} className="btn-premium flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Complete Profile</span>
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                className="btn-premium flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}