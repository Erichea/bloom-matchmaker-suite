import React, { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import type { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";

interface QuestionScreenProps {
  question: QuestionnaireQuestion;
  answer: any;
  onAnswer: (answer: any) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  iconComponent: React.ReactNode;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  answer,
  onAnswer,
  onNext,
  onBack,
  canGoBack,
  iconComponent,
}) => {
  const [localAnswer, setLocalAnswer] = useState<any>(answer);
  const [isValid, setIsValid] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  useEffect(() => {
    setLocalAnswer(answer);
  }, [answer, question.id]);

  useEffect(() => {
    // Validate answer
    if (question.id === "name" && question.options?.fields) {
      // For name question, only first name is required
      setIsValid(
        Array.isArray(localAnswer) &&
        localAnswer[0] &&
        localAnswer[0].trim().length > 0
      );
    } else if (question.question_type === "multiple_choice") {
      const maxSelections = question.validation_rules?.max_selections;
      setIsValid(
        Array.isArray(localAnswer) &&
        localAnswer.length > 0 &&
        (!maxSelections || localAnswer.length <= maxSelections)
      );
    } else if (question.question_type === "textarea" && question.options?.fields) {
      setIsValid(
        Array.isArray(localAnswer) &&
        localAnswer.length === question.options.fields &&
        localAnswer.every((v: string) => v && v.trim().length > 0)
      );
    } else {
      setIsValid(!!localAnswer && String(localAnswer).trim().length > 0);
    }
  }, [localAnswer, question]);

  const handleNext = () => {
    if (isValid) {
      onAnswer(localAnswer);
      onNext();
    }
  };

  const renderInput = () => {
    switch (question.question_type) {
      case "text":
        // Special handling for name question with two fields
        if (question.id === "name" && question.options?.fields) {
          const names = Array.isArray(localAnswer) ? localAnswer : ["", ""];
          return (
            <div className="space-y-4">
              <div>
                <Label htmlFor="first_name" className="text-base mb-2 block">First name *</Label>
                <Input
                  id="first_name"
                  value={names[0] || ""}
                  onChange={(e) => setLocalAnswer([e.target.value, names[1] || ""])}
                  className="text-lg"
                  placeholder="Your first name"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-base mb-2 block">Last name (optional)</Label>
                <Input
                  id="last_name"
                  value={names[1] || ""}
                  onChange={(e) => setLocalAnswer([names[0] || "", e.target.value])}
                  className="text-lg"
                  placeholder="Your last name"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Only shared with your matches
                </p>
              </div>
            </div>
          );
        }

        return (
          <Input
            value={localAnswer || ""}
            onChange={(e) => setLocalAnswer(e.target.value)}
            className="text-lg"
            placeholder="Type your answer..."
            autoFocus
          />
        );

      case "autocomplete":
        const autocompleteOptions = Array.isArray(question.options) ? question.options : [];

        return (
          <Popover open={autocompleteOpen} onOpenChange={setAutocompleteOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={autocompleteOpen}
                className="w-full justify-between text-lg font-normal"
              >
                {localAnswer || "Select a city..."}
                <Check className={cn("ml-2 h-5 w-5 shrink-0 opacity-50", localAnswer && "opacity-100")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search city..." className="h-12" />
                <CommandList>
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandGroup>
                    {autocompleteOptions.map((city: string) => (
                      <CommandItem
                        key={city}
                        value={city}
                        onSelect={() => {
                          setLocalAnswer(city);
                          setAutocompleteOpen(false);
                        }}
                        className="text-base py-3"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            localAnswer === city ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {city}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-lg",
                  !localAnswer && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {localAnswer ? format(new Date(localAnswer), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localAnswer ? new Date(localAnswer) : undefined}
                onSelect={(date) => setLocalAnswer(date?.toISOString())}
                initialFocus
                className="pointer-events-auto"
                disabled={(date) => {
                  const age = (new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                  return age < 18 || age > 100;
                }}
              />
            </PopoverContent>
          </Popover>
        );

      case "number":
        const { min, max, default: defaultVal } = question.options || {};
        return (
          <div className="space-y-6">
            <div className="text-center text-6xl font-bold text-primary">
              {localAnswer || defaultVal || min} cm
            </div>
            <Slider
              value={[localAnswer || defaultVal || 170]}
              onValueChange={(values) => setLocalAnswer(values[0])}
              min={min || 140}
              max={max || 220}
              step={1}
              className="w-full"
            />
          </div>
        );

      case "single_choice":
        const options = Array.isArray(question.options) ? question.options : [];
        return (
          <RadioGroup value={localAnswer} onValueChange={setLocalAnswer} className="space-y-3">
            {options.map((option: string) => (
              <div key={option} className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="flex-1 cursor-pointer text-base">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "multiple_choice":
        const multiOptions = Array.isArray(question.options) ? question.options : [];
        const currentSelections = Array.isArray(localAnswer) ? localAnswer : [];
        const maxSelections = question.validation_rules?.max_selections;

        return (
          <div className="space-y-3">
            {multiOptions.map((option: string) => {
              const isChecked = currentSelections.includes(option);
              const isDisabled = !isChecked && maxSelections && currentSelections.length >= maxSelections;

              return (
                <div
                  key={option}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border border-border p-4",
                    isDisabled ? "opacity-50" : "hover:bg-accent"
                  )}
                >
                  <Checkbox
                    id={option}
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setLocalAnswer([...currentSelections, option]);
                      } else {
                        setLocalAnswer(currentSelections.filter((o: string) => o !== option));
                      }
                    }}
                  />
                  <Label htmlFor={option} className="flex-1 cursor-pointer text-base">
                    {option}
                  </Label>
                </div>
              );
            })}
            {maxSelections && (
              <p className="text-sm text-muted-foreground text-center">
                {currentSelections.length} / {maxSelections} selected
              </p>
            )}
          </div>
        );

      case "scale":
        const { min: scaleMin, max: scaleMax, min_label, max_label } = question.options || {};
        const scaleValue = localAnswer || 3;
        
        return (
          <div className="space-y-8">
            <div className="flex justify-center gap-4">
              {Array.from({ length: (scaleMax || 5) - (scaleMin || 1) + 1 }).map((_, index) => {
                const value = (scaleMin || 1) + index;
                return (
                  <button
                    key={value}
                    onClick={() => setLocalAnswer(value)}
                    className={cn(
                      "h-16 w-16 rounded-full border-2 font-semibold text-lg transition-all",
                      scaleValue === value
                        ? "bg-primary text-primary-foreground border-primary scale-110"
                        : "border-muted hover:border-primary hover:scale-105"
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{min_label || "Not important"}</span>
              <span>{max_label || "Essential"}</span>
            </div>
          </div>
        );

      case "textarea":
        const fieldCount = question.options?.fields || 1;
        const textAnswers = Array.isArray(localAnswer) ? localAnswer : Array(fieldCount).fill("");
        
        if (fieldCount > 1) {
          return (
            <div className="space-y-4">
              {Array.from({ length: fieldCount }).map((_, index) => (
                <Textarea
                  key={index}
                  value={textAnswers[index] || ""}
                  onChange={(e) => {
                    const newAnswers = [...textAnswers];
                    newAnswers[index] = e.target.value;
                    setLocalAnswer(newAnswers);
                  }}
                  placeholder={`Element ${index + 1}`}
                  maxLength={question.options?.max_length || 200}
                  className="resize-none"
                  rows={3}
                />
              ))}
            </div>
          );
        }
        
        return (
          <Textarea
            value={localAnswer || ""}
            onChange={(e) => setLocalAnswer(e.target.value)}
            placeholder="Type your answer..."
            maxLength={question.options?.max_length || 500}
            className="min-h-[150px] text-lg resize-none"
            autoFocus
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-8">
        {/* Icon */}
        <div className="mb-6">{iconComponent}</div>

        {/* Question */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {question.question_text_en}
          </h1>
          {question.subtitle_en && (
            <p className="text-base text-muted-foreground">
              {question.subtitle_en}
            </p>
          )}
          {question.help_text_en && (
            <p className="text-sm text-muted-foreground mt-2">
              {question.help_text_en}
            </p>
          )}
        </div>

        {/* Answer Input */}
        <div className="flex-1">{renderInput()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          {canGoBack ? (
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-base"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
          ) : (
            <div />
          )}

          <Button
            onClick={handleNext}
            disabled={!isValid}
            size="lg"
            className="rounded-full h-14 w-14 p-0"
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};
