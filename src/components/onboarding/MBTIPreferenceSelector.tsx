import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { mbtiToAxes, calculateMBTIMatch, axisDescriptions, type MBTIAxes } from "@/lib/mbtiUtils";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface MBTIPreferenceSelectorProps {
  value: string[]; // Array of MBTI types (e.g., ["ENFP", "ENFJ"])
  onChange: (value: string[]) => void;
  userMBTI?: string; // User's own MBTI type (optional, to initialize sliders)
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

const MBTIPreferenceSelector: React.FC<MBTIPreferenceSelectorProps> = ({ value, onChange, userMBTI }) => {
  // Initialize axes from user's MBTI type (not centered at 50%)
  const initialAxes = userMBTI ? mbtiToAxes(userMBTI) : { ei: 50, sn: 50, tf: 50, jp: 50 };
  const [axes, setAxes] = useState<MBTIAxes>(initialAxes);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  // Calculate match percentages for all types
  const typesWithMatches = useMemo(() => {
    return mbtiData.map(mbtiType => ({
      ...mbtiType,
      match: calculateMBTIMatch(axes, mbtiType.type),
    }));
  }, [axes]);

  // Auto-select types with match >= 70% whenever axes change
  useEffect(() => {
    const autoSelectedTypes = typesWithMatches
      .filter(t => t.match >= 70)
      .map(t => t.type);

    // Only update if the selection actually changed
    const currentSet = new Set(value);
    const newSet = new Set(autoSelectedTypes);

    if (currentSet.size !== newSet.size ||
        !autoSelectedTypes.every(type => currentSet.has(type))) {
      onChange(autoSelectedTypes);
    }
  }, [typesWithMatches, onChange]);

  // Create a Set for faster lookups
  const selectedTypesSet = useMemo(() => new Set(value || []), [value]);

  const handleAxisChange = (axis: keyof MBTIAxes, newValue: number[]) => {
    setAxes(prev => ({ ...prev, [axis]: newValue[0] }));
  };

  const toggleType = (type: string) => {
    // Allow manual toggle
    const newSelections = new Set(selectedTypesSet);
    if (newSelections.has(type)) {
      newSelections.delete(type);
    } else {
      newSelections.add(type);
    }
    onChange(Array.from(newSelections));
  };

  return (
    <div className="space-y-4 w-full">
      {/* User's MBTI Indicator */}
      {userMBTI && (
        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-2xl">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-sm">
            {(() => {
              const userType = mbtiData.find(t => t.type === userMBTI);
              return userType ? <userType.icon className="w-8 h-8 object-contain" /> : null;
            })()}
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Your personality type</p>
            <p className="text-sm font-semibold">{userMBTI}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current sliders</p>
            <p className="text-xs font-mono font-medium">{Math.round(axes.ei)}/{Math.round(axes.sn)}/{Math.round(axes.tf)}/{Math.round(axes.jp)}</p>
          </div>
        </div>
      )}

      {/* Slider Controls Section - Compact 2x2 Grid */}
      <div className="w-full p-4 bg-muted/30 rounded-2xl">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Adjust Personality Preferences</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* E/I Axis */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-foreground">I ↔ E</span>
              <span className="text-xs text-muted-foreground font-mono">{Math.round(axes.ei)}%</span>
            </div>
            <Slider
              value={[axes.ei]}
              onValueChange={(val) => handleAxisChange('ei', val)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* S/N Axis */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-foreground">S ↔ N</span>
              <span className="text-xs text-muted-foreground font-mono">{Math.round(axes.sn)}%</span>
            </div>
            <Slider
              value={[axes.sn]}
              onValueChange={(val) => handleAxisChange('sn', val)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* T/F Axis */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-foreground">T ↔ F</span>
              <span className="text-xs text-muted-foreground font-mono">{Math.round(axes.tf)}%</span>
            </div>
            <Slider
              value={[axes.tf]}
              onValueChange={(val) => handleAxisChange('tf', val)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* J/P Axis */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-foreground">J ↔ P</span>
              <span className="text-xs text-muted-foreground font-mono">{Math.round(axes.jp)}%</span>
            </div>
            <Slider
              value={[axes.jp]}
              onValueChange={(val) => handleAxisChange('jp', val)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* MBTI Types Grid (4x4) - Compact */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Select Compatible Types</h3>
          <p className="text-xs text-muted-foreground">
            ≥70% auto-selected
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {typesWithMatches.map((mbtiType) => {
            const isSelected = selectedTypesSet.has(mbtiType.type);
            const isHovered = hoveredType === mbtiType.type;
            const matchLevel = mbtiType.match >= 70 ? 'high' : mbtiType.match >= 50 ? 'medium' : 'low';

            return (
              <div
                key={mbtiType.type}
                onClick={() => toggleType(mbtiType.type)}
                onMouseEnter={() => setHoveredType(mbtiType.type)}
                onMouseLeave={() => setHoveredType(null)}
                className={cn(
                  "flex flex-col items-center cursor-pointer transition-all duration-300 p-2 rounded-xl relative",
                  "hover:scale-105 active:scale-95",
                  isSelected
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg"
                    : "bg-gradient-to-br from-muted/30 to-muted/10 opacity-40 grayscale"
                )}
              >
                {/* MBTI Type Label */}
                <p className={cn(
                  "text-xs font-medium mb-1.5 text-center",
                  !isSelected && "text-muted-foreground"
                )}>
                  {mbtiType.label}
                </p>

                {/* Character Circle with SVG */}
                <div className="relative mb-1">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all duration-300",
                      "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
                    )}
                  >
                    {/* SVG Character */}
                    <mbtiType.icon className="w-10 h-10 object-contain" />
                  </div>
                </div>

                {/* Match percentage - between character and tag */}
                <div className={cn(
                  "text-xs font-bold mb-1 transition-colors",
                  matchLevel === 'high' ? "text-green-600 dark:text-green-500" :
                  matchLevel === 'medium' ? "text-blue-600 dark:text-blue-500" :
                  "text-gray-500 dark:text-gray-400"
                )}>
                  {mbtiType.match}%
                </div>

                {/* Type Tag */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-primary/20"
                  )}
                >
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all duration-300",
                      isSelected ? "bg-primary-foreground" : "bg-background"
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="w-2 h-2 text-primary"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[10px]">{mbtiType.type}</span>
                </div>

                {/* Description on hover */}
                {isHovered && (
                  <div className="text-[10px] text-center text-muted-foreground mt-1 px-1">
                    {mbtiType.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Types Summary - Compact */}
      {value.length > 0 && (
        <div className="w-full p-3 bg-muted/30 rounded-xl">
          <h3 className="text-xs font-semibold mb-2 text-foreground">Selected ({value.length})</h3>
          <div className="flex flex-wrap gap-1.5">
            {value.map(type => {
              const match = typesWithMatches.find(t => t.type === type)?.match || 0;
              return (
                <div
                  key={type}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                >
                  <span>{type}</span>
                  <span className="text-[10px] opacity-75">
                    {match}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MBTIPreferenceSelector;
