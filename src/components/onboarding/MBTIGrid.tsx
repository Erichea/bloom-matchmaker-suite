import React, { useState } from "react";
import { cn } from "@/lib/utils";
import ENFJ from "@/images/mbti/ENFJ.svg";
import ENFP from "@/images/mbti/ENFP.svg";
import ENTJ from "@/images/mbti/ENTJ.svg";
import ENTP from "@/images/mbti/ENTP.svg";
import ESFJ from "@/images/mbti/ESFJ.svg";
import ESFP from "@/images/mbti/ESFP.svg";
import ESTJ from "@/images/mbti/ESTJ.svg";
import ESTP from "@/images/mbti/ESTP.svg";
import INFJ from "@/images/mbti/INFJ.svg";
import INFP from "@/images/mbti/INFP.svg";
import INTJ from "@/images/mbti/INTJ.svg";
import INTP from "@/images/mbti/INTP.svg";
import ISFJ from "@/images/mbti/ISFJ.svg";
import ISFP from "@/images/mbti/ISFP.svg";
import ISTJ from "@/images/mbti/ISTJ.svg";
import ISTP from "@/images/mbti/ISTP.svg";

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
  { type: 'ESFJ', label: 'Ambassadeur', color: '#10b981', description: 'Warm, conscientious, dedicated', icon: ESFJ },
  { type: 'ESFP', label: 'Amuseur', color: '#10b981', description: 'Spontaneous, energetic, enthusiastic', icon: ESFP },
  { type: 'ESTP', label: 'Rebelle', color: '#10b981', description: 'Smart, energetic, perceptive', icon: ESTP },
  { type: 'ENTJ', label: 'Commandant', color: '#60a5fa', description: 'Bold, strategic, leader', icon: ENTJ },
  { type: 'ENFJ', label: 'Héros', color: '#60a5fa', description: 'Charismatic, inspiring, leader', icon: ENFJ },
  { type: 'ENFP', label: 'Aventurier', color: '#60a5fa', description: 'Enthusiastic, creative, sociable', icon: ENFP },
  { type: 'ISFP', label: 'Artiste', color: '#60a5fa', description: 'Exploratory, artistic, sensitive', icon: ISFP },
  { type: 'ESTJ', label: 'Directeur', color: '#60a5fa', description: 'Dedicated, organized, decisive', icon: ESTJ },
  { type: 'ISTJ', label: 'Réaliste', color: '#fb923c', description: 'Practical, fact-minded, reliable', icon: ISTJ },
  { type: 'ISTP', label: 'Artisan', color: '#fb923c', description: 'Bold, practical, experimenter', icon: ISTP },
  { type: 'INFJ', label: 'Gardien', color: '#fb923c', description: 'Insightful, principled, passionate', icon: INFJ },
  { type: 'INTJ', label: 'Architecte', color: '#fb923c', description: 'Imaginative, strategic, planner', icon: INTJ },
  { type: 'ENTP', label: 'Challenger', color: '#fb923c', description: 'Smart, curious, witty', icon: ENTP },
  { type: 'INFP', label: 'Pacifiste', color: '#fb923c', description: 'Poetic, kind, altruistic', icon: INFP },
  { type: 'INTP', label: 'Inventeur', color: '#fb923c', description: 'Innovative, logical, abstract', icon: INTP },
  { type: 'ISFJ', label: 'Défenseur', color: '#fb923c', description: 'Warm, conscientious, dedicated', icon: ISFJ }
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
                  {/* SVG Character - Wrapped to isolate SVG IDs */}
                  <div className="w-12 h-12 md:w-14 md:h-14" data-mbti={mbtiType.type}>
                    <mbtiType.icon className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Match indicator on hover */}
                {isHovered && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    NEW
                  </div>
                )}
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

      {/* Selected Type Display */}
      {value && (
        <div className="text-center p-4 bg-muted/30 rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">Selected type:</p>
          <p className="text-lg font-semibold text-primary">
            {mbtiData.find(t => t.type === value)?.label} ({value})
          </p>
        </div>
      )}
    </div>
  );
};

export default MBTIGrid;