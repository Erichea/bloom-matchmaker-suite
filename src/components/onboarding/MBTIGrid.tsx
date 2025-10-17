import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface MBTIGridProps {
  value: string;
  onChange: (value: string) => void;
}

interface MBTIType {
  type: string;
  label: string;
  color: string;
  description: string;
}

const mbtiData: MBTIType[] = [
  { type: 'ESFJ', label: 'Ambassador', color: '#10b981', description: 'Warm, conscientious, dedicated' },
  { type: 'ESFP', label: 'Performer', color: '#10b981', description: 'Spontaneous, energetic, enthusiastic' },
  { type: 'ESTP', label: 'Rebel', color: '#10b981', description: 'Smart, energetic, perceptive' },
  { type: 'ENTJ', label: 'Commander', color: '#60a5fa', description: 'Bold, strategic, leader' },
  { type: 'ENFJ', label: 'Hero', color: '#60a5fa', description: 'Charismatic, inspiring, leader' },
  { type: 'ENFP', label: 'Crusader', color: '#60a5fa', description: 'Enthusiastic, creative, sociable' },
  { type: 'ISFP', label: 'Artist', color: '#60a5fa', description: 'Exploratory, artistic, sensitive' },
  { type: 'ESTJ', label: 'Executive', color: '#60a5fa', description: 'Dedicated, organized, decisive' },
  { type: 'ISTJ', label: 'Realist', color: '#fb923c', description: 'Practical, fact-minded, reliable' },
  { type: 'ISTP', label: 'Artisan', color: '#fb923c', description: 'Bold, practical, experimenter' },
  { type: 'INFJ', label: 'Guardian', color: '#fb923c', description: 'Insightful, principled, passionate' },
  { type: 'INTJ', label: 'Mastermind', color: '#fb923c', description: 'Imaginative, strategic, planner' },
  { type: 'ENTP', label: 'Challenger', color: '#fb923c', description: 'Smart, curious, witty' },
  { type: 'INFP', label: 'Peacemaker', color: '#fb923c', description: 'Poetic, kind, altruistic' },
  { type: 'INTP', label: 'Genius', color: '#fb923c', description: 'Innovative, logical, abstract' },
  { type: 'ISFJ', label: 'Protector', color: '#fb923c', description: 'Warm, conscientious, dedicated' }
];

const MBTIGrid: React.FC<MBTIGridProps> = ({ value, onChange }) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleTypeClick = (type: string) => {
    onChange(type);
  };

  return (
    <div className="space-y-6">
      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-4 md:gap-6">
        {mbtiData.map((mbtiType) => {
          const isSelected = value === mbtiType.type;
          const isHovered = hoveredType === mbtiType.type;

          return (
            <div
              key={mbtiType.type}
              onClick={() => handleTypeClick(mbtiType.type)}
              onMouseEnter={() => setHoveredType(mbtiType.type)}
              onMouseLeave={() => setHoveredType(null)}
              className={cn(
                "flex flex-col items-center cursor-pointer transition-all duration-300 p-4 rounded-2xl",
                "hover:scale-105 active:scale-95",
                isSelected
                  ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg"
                  : "bg-gradient-to-br from-muted/30 to-muted/10"
              )}
            >
              {/* MBTI Type Label */}
              <p className="text-sm font-medium mb-3 text-center">
                {mbtiType.label}
              </p>

              {/* Character Circle */}
              <div className="relative mb-3">
                <div
                  className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-300",
                    "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
                  )}
                >
                  {/* Character placeholder */}
                  <div className="text-2xl font-bold">{mbtiType.type.charAt(0)}</div>
                </div>
              </div>

              {/* Type Tag */}
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-primary/20"
                )}
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300",
                    isSelected ? "bg-primary-foreground" : "bg-background"
                  )}
                >
                  {isSelected && (
                    <svg
                      className="w-2.5 h-2.5 text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  )}
                </div>
                <span>{mbtiType.type}</span>
              </div>

              {/* Description on hover */}
              {isHovered && (
                <div className="text-xs text-center text-muted-foreground mt-2 px-2">
                  {mbtiType.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MBTIGrid;