import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { QuestionnaireQuestion } from "@/hooks/useOnboardingQuestionnaire";
import MBTIGrid from "./MBTIGrid";

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
  const [dateError, setDateError] = useState<string>("");

  // Date input states
  const [dayValue, setDayValue] = useState("");
  const [monthValue, setMonthValue] = useState("");
  const [yearValue, setYearValue] = useState("");
  const [focusedField, setFocusedField] = useState<'day' | 'month' | 'year' | null>(null);

  // Refs for date inputs
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalAnswer(answer);

    // Parse date for date question (DD/MM/YYYY format)
    if (question.question_type === "date" && answer && answer !== '') {
      try {
        const date = new Date(answer);
        if (!isNaN(date.getTime())) {
          setDayValue(String(date.getDate()).padStart(2, '0'));
          setMonthValue(String(date.getMonth() + 1).padStart(2, '0'));
          setYearValue(String(date.getFullYear()));
        }
      } catch (e) {
        // Invalid date, keep empty
        setDayValue("");
        setMonthValue("");
        setYearValue("");
      }
    } else if (question.question_type === "date") {
      setDayValue("");
      setMonthValue("");
      setYearValue("");
    }
  }, [answer, question.id, question.question_type]);

  useEffect(() => {
    // Validate answer
    if (question.question_type === "multiple_choice") {
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
        return (
          <Input
            value={localAnswer || ""}
            onChange={(e) => setLocalAnswer(e.target.value)}
            className="text-lg"
            placeholder="Type your answer..."
            autoFocus
          />
        );

      case "autocomplete": {
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
            <PopoverContent className="w-full p-0" align="start" side="bottom">
              <Command>
                <CommandInput placeholder="Search city..." className="h-12" autoFocus={false} />
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
      }

      case "date": {
        const handleDateFieldChange = (field: 'day' | 'month' | 'year', value: string) => {
          // Only allow numbers
          const numericValue = value.replace(/\D/g, '');

          // Limit input lengths
          if (field === 'day' && numericValue.length > 2) return;
          if (field === 'month' && numericValue.length > 2) return;
          if (field === 'year' && numericValue.length > 4) return;

          // Update the field
          if (field === 'day') setDayValue(numericValue);
          if (field === 'month') setMonthValue(numericValue);
          if (field === 'year') setYearValue(numericValue);

          // Auto-advance to next field (DD -> MM -> YYYY)
          if (field === 'day' && numericValue.length === 2) {
            monthRef.current?.focus();
          } else if (field === 'month' && numericValue.length === 2) {
            yearRef.current?.focus();
          }

          // Get the new values
          const newMonth = field === 'month' ? numericValue : monthValue;
          const newDay = field === 'day' ? numericValue : dayValue;
          const newYear = field === 'year' ? numericValue : yearValue;

          // Try to create a valid date
          if (newMonth && newDay && newYear && newYear.length === 4) {
            const month = parseInt(newMonth);
            const day = parseInt(newDay);
            const year = parseInt(newYear);

            // Validate ranges
            if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
              setDateError("Enter a valid date of birth.");
              setLocalAnswer(null);
              return;
            }

            // Create date (month is 0-indexed in JS Date)
            const testDate = new Date(year, month - 1, day);

            // Check if date is valid
            if (
              testDate.getDate() !== day ||
              testDate.getMonth() !== month - 1 ||
              testDate.getFullYear() !== year
            ) {
              setDateError("Enter a valid date of birth.");
              setLocalAnswer(null);
              return;
            }

            // Check age (must be at least 18)
            const age = (new Date().getTime() - testDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
            if (age < 18) {
              setDateError("You must be at least 18 years old.");
              setLocalAnswer(null);
              return;
            }

            if (age > 100) {
              setDateError("Enter a valid date of birth.");
              setLocalAnswer(null);
              return;
            }

            // Valid date - format as YYYY-MM-DD for PostgreSQL DATE column
            setDateError("");
            const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            setLocalAnswer(formattedDate);
          } else {
            setDateError("");
            setLocalAnswer(null);
          }
        };

        return (
          <div className="space-y-6 relative">
            {/* Date input fields with individual character placeholders - DD/MM/YYYY */}
            <div className="flex items-end gap-6">
              {/* Day */}
              <div
                className="flex gap-1 cursor-pointer"
                onClick={() => dayRef.current?.focus()}
              >
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-4xl mb-1 font-light",
                    dayValue[0] ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {dayValue[0] || 'D'}
                  </span>
                  <div className={cn(
                    "w-8 border-b-2 transition-colors",
                    focusedField === 'day' ? "border-primary" : "border-foreground/20"
                  )} />
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-4xl mb-1 font-light",
                    dayValue[1] ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {dayValue[1] || 'D'}
                  </span>
                  <div className={cn(
                    "w-8 border-b-2 transition-colors",
                    focusedField === 'day' ? "border-primary" : "border-foreground/20"
                  )} />
                </div>
              </div>

              {/* Month */}
              <div
                className="flex gap-1 cursor-pointer"
                onClick={() => monthRef.current?.focus()}
              >
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-4xl mb-1 font-light",
                    monthValue[0] ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {monthValue[0] || 'M'}
                  </span>
                  <div className={cn(
                    "w-8 border-b-2 transition-colors",
                    focusedField === 'month' ? "border-primary" : "border-foreground/20"
                  )} />
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-4xl mb-1 font-light",
                    monthValue[1] ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {monthValue[1] || 'M'}
                  </span>
                  <div className={cn(
                    "w-8 border-b-2 transition-colors",
                    focusedField === 'month' ? "border-primary" : "border-foreground/20"
                  )} />
                </div>
              </div>

              {/* Year */}
              <div
                className="flex gap-1 cursor-pointer"
                onClick={() => yearRef.current?.focus()}
              >
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-4xl mb-1 font-light",
                    yearValue[0] ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {yearValue[0] || 'Y'}
                  </span>
                  <div className={cn(
                    "w-8 border-b-2 transition-colors",
                    focusedField === 'year' ? "border-primary" : "border-foreground/20"
                  )} />
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-4xl mb-1 font-light",
                    yearValue[1] ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {yearValue[1] || 'Y'}
                  </span>
                  <div className={cn(
                    "w-8 border-b-2 transition-colors",
                    focusedField === 'year' ? "border-primary" : "border-foreground/20"
                  )} />
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-4xl mb-1 font-light",
                    yearValue[2] ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {yearValue[2] || 'Y'}
                  </span>
                  <div className={cn(
                    "w-8 border-b-2 transition-colors",
                    focusedField === 'year' ? "border-primary" : "border-foreground/20"
                  )} />
                </div>
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-4xl mb-1 font-light",
                    yearValue[3] ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    {yearValue[3] || 'Y'}
                  </span>
                  <div className={cn(
                    "w-8 border-b-2 transition-colors",
                    focusedField === 'year' ? "border-primary" : "border-foreground/20"
                  )} />
                </div>
              </div>
            </div>

            {/* Hidden inputs for actual data entry - completely hidden to prevent cursor */}
            <div className="absolute -left-[9999px] -top-[9999px] opacity-0 pointer-events-none">
              <Input
                ref={dayRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={dayValue}
                onChange={(e) => handleDateFieldChange('day', e.target.value)}
                onFocus={() => setFocusedField('day')}
                onBlur={() => setFocusedField(null)}
                maxLength={2}
                autoFocus
              />
              <Input
                ref={monthRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={monthValue}
                onChange={(e) => handleDateFieldChange('month', e.target.value)}
                onFocus={() => setFocusedField('month')}
                onBlur={() => setFocusedField(null)}
                maxLength={2}
              />
              <Input
                ref={yearRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={yearValue}
                onChange={(e) => handleDateFieldChange('year', e.target.value)}
                onFocus={() => setFocusedField('year')}
                onBlur={() => setFocusedField(null)}
                maxLength={4}
              />
            </div>

            {/* Error message */}
            {dateError && (
              <p className="text-sm text-destructive">{dateError}</p>
            )}
          </div>
        );
      }

      case "number": {
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
      }

      case "single_choice": {
        const options = Array.isArray(question.options) ? question.options : [];
        // Ensure value is always a string to avoid controlled/uncontrolled switch
        const radioValue = localAnswer || "";

        // Special handling for MBTI question
        if (question.id === "mbti") {
          return (
            <div className="space-y-6">
              <MBTIGrid value={localAnswer || ""} onChange={setLocalAnswer} />

              {/* Don't know option */}
              <div className="mt-6">
                {options
                  .filter((opt) => opt.includes("Don't know") || opt.includes("Prefer not"))
                  .map((option) => {
                    const isSelected = localAnswer === option;
                    return (
                      <div
                        key={option}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer",
                          isSelected ? "border-primary" : "border-border hover:border-muted-foreground/50"
                        )}
                        onClick={() => setLocalAnswer(option)}
                      >
                        <RadioGroupItem value={option} id={option} className="pointer-events-none" />
                        <Label htmlFor={option} className="flex-1 cursor-pointer text-base pointer-events-none">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        }

        // Default single choice rendering
        return (
          <RadioGroup value={radioValue} onValueChange={setLocalAnswer} className="space-y-3">
            {options.map((option: string) => {
              const isSelected = localAnswer === option;
              return (
                <div
                  key={option}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer",
                    isSelected ? "border-primary" : "border-border hover:border-muted-foreground/50"
                  )}
                  onClick={() => setLocalAnswer(option)}
                >
                  <RadioGroupItem value={option} id={option} className="pointer-events-none" />
                  <Label htmlFor={option} className="flex-1 cursor-pointer text-base pointer-events-none">
                    {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        );
      }

      case "multiple_choice": {
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
                    "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer",
                    isDisabled ? "opacity-50" : "",
                    isChecked ? "border-primary" : "border-border hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    if (isDisabled) return;
                    if (isChecked) {
                      setLocalAnswer(currentSelections.filter((o: string) => o !== option));
                    } else {
                      setLocalAnswer([...currentSelections, option]);
                    }
                    // Remove focus after selection
                    (document.activeElement as HTMLElement)?.blur();
                  }}
                >
                  <Checkbox
                    id={option}
                    checked={isChecked}
                    disabled={isDisabled}
                    className="pointer-events-none"
                  />
                  <Label htmlFor={option} className="flex-1 cursor-pointer text-base pointer-events-none">
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
      }

      case "scale": {
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
      }

      case "textarea": {
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
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-8 pb-24">
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
              {question.id === "mbti" ? (
                <>
                  Don't know your type?{" "}
                  <a
                    href="https://www.16personalities.com/free-personality-test"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Take the test
                  </a>
                </>
              ) : (
                question.help_text_en
              )}
            </p>
          )}
        </div>

        {/* Answer Input */}
        <div className="flex-1 min-h-0">{renderInput()}</div>
      </div>

      {/* Fixed Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="max-w-2xl mx-auto w-full px-6 py-4">
          <div className="flex items-center justify-between">
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
    </div>
  );
};
