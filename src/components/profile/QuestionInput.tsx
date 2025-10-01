import type { Question } from "@/constants/profileQuestions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface QuestionInputProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
}

export const QuestionInput = ({ question, value, onChange }: QuestionInputProps) => {
  switch (question.type) {
    case "textarea":
      return (
        <Textarea
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Share your thoughts..."
          className="min-h-[140px]"
        />
      );

    case "text":
      return (
        <Input
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Your answer..."
        />
      );

    case "select":
      return (
        <div className="space-y-3">
          {question.options?.map((option) => (
            <label
              key={option}
              className="flex items-center space-x-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={(event) => onChange(event.target.value)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      );

    case "multiselect": {
      const currentValues = Array.isArray(value) ? value : [];

      return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {question.options?.map((option) => {
            const isSelected = currentValues.includes(option);

            return (
              <label
                key={option}
                className="flex items-center space-x-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(event) => {
                    if (event.target.checked) {
                      onChange([...currentValues, option]);
                    } else {
                      onChange(currentValues.filter((entry: string) => entry !== option));
                    }
                  }}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">{option}</span>
              </label>
            );
          })}
        </div>
      );
    }

    case "range":
      return (
        <input
          type="range"
          min={question.min ?? 0}
          max={question.max ?? 100}
          value={value ?? question.min ?? 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full"
        />
      );

    default:
      return null;
  }
};
