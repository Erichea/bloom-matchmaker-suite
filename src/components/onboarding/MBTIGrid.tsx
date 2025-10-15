import React, { useState } from "react";
import { cn } from "@/lib/utils";
import ENFJ from "@/images/mbti/ENFJ.svg?react";
import ENFP from "@/images/mbti/ENFP.svg?react";
import ENTJ from "@/images/mbti/ENTJ.svg?react";
import ENTP from "@/images/mbti/ENTP.svg?react";
import ESFJ from "@/images/mbti/ESFJ.svg?react";
import ESFP from "@/images/mbti/ESFP.svg?react";
import ESTJ from "@/images/mbti/ESTJ.svg?react";
import ESTP from "@/images/mbti/ESTP.svg?react";
import INFJ from "@/images/mbti/INFJ.svg?react";
import INFP from "@/images/mbti/INFP.svg?react";
import INTJ from "@/images/mbti/INTJ.svg?react";
import INTP from "@/images/mbti/INTP.svg?react";
import ISFJ from "@/images/mbti/ISFJ.svg?react";
import ISFP from "@/images/mbti/ISFP.svg?react";
import ISTJ from "@/images/mbti/ISTJ.svg?react";
import ISTP from "@/images/mbti/ISTP.svg?react";

interface MBTIGridProps {
  value: string;
  onChange: (value: string) => void;
}

interface MBTIType {
  type: string;
  label: string;
  color: string;
  description: string;
  icon: React.ComponentType<any>;
}

const mbtiData: MBTIType[] = [
  { type: 'ESFJ', label: 'Ambassador', color: '#10b981', description: 'Warm, conscientious, dedicated', icon: ESFJ },
  { type: 'ESFP', label: 'Performer', color: '#10b981', description: 'Spontaneous, energetic, enthusiastic', icon: ESFP },
  { type: 'ESTP', label: 'Rebel', color: '#10b981', description: 'Smart, energetic, perceptive', icon: ESTP },
  { type: 'ENTJ', label: 'Commander', color: '#60a5fa', description: 'Bold, strategic, leader', icon: ENTJ },
  { type: 'ENFJ', label: 'Hero', color: '#60a5fa', description: 'Charismatic, inspiring, leader', icon: ENFJ },
  { type: 'ENFP', label: 'Crusader', color: '#60a5fa', description: 'Enthusiastic, creative, sociable', icon: ENFP },
  { type: 'ISFP', label: 'Artist', color: '#60a5fa', description: 'Exploratory, artistic, sensitive', icon: ISFP },
  { type: 'ESTJ', label: 'Executive', color: '#60a5fa', description: 'Dedicated, organized, decisive', icon: ESTJ },
  { type: 'ISTJ', label: 'Realist', color: '#fb923c', description: 'Practical, fact-minded, reliable', icon: ISTJ },
  { type: 'ISTP', label: 'Artisan', color: '#fb923c', description: 'Bold, practical, experimenter', icon: ISTP },
  { type: 'INFJ', label: 'Guardian', color: '#fb923c', description: 'Insightful, principled, passionate', icon: INFJ },
  { type: 'INTJ', label: 'Mastermind', color: '#fb923c', description: 'Imaginative, strategic, planner', icon: INTJ },
  { type: 'ENTP', label: 'Challenger', color: '#fb923c', description: 'Smart, curious, witty', icon: ENTP },
  { type: 'INFP', label: 'Peacemaker', color: '#fb923c', description: 'Poetic, kind, altruistic', icon: INFP },
  { type: 'INTP', label: 'Genius', color: '#fb923c', description: 'Innovative, logical, abstract', icon: INTP },
  { type: 'ISFJ', label: 'Protector', color: '#fb923c', description: 'Warm, conscientious, dedicated', icon: ISFJ }
];

const MBTIGrid: React.FC<MBTIGridProps> = ({ value, onChange }) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  // Debug logging to track issues
  console.log('MBTIGrid Debug:', {
    value,
    onChange,
    mbtiData: mbtiData,
    mbtiDataIsArray: Array.isArray(mbtiData)
  });

  const handleTypeClick = (type: string) => {
    onChange(type);
  };

  // Ensure mbtiData is an array
  if (!Array.isArray(mbtiData)) {
    console.error('MBTIGrid: mbtiData is not an array', mbtiData);
    return <div>Error: Invalid MBTI data</div>;
  }

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
                  ? "bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary shadow-lg"
                  : "bg-gradient-to-br from-muted/30 to-muted/10 border-2 border-border hover:border-primary/50"
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
                  {/* SVG Character */}
                  <mbtiType.icon className="w-12 h-12 md:w-14 md:h-14 object-contain" />
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
                      className="w-2.5 h-2.5"
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