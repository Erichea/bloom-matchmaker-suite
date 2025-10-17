import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { mbtiToAxes, calculateMBTIMatch, getRecommendedMBTITypes, axisDescriptions, type MBTIAxes } from "@/lib/mbtiUtils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
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
  // Initialize axes from user's MBTI type, or default to center
  const initialAxes = userMBTI ? mbtiToAxes(userMBTI) : { ei: 50, sn: 50, tf: 50, jp: 50 };
  const [axes, setAxes] = useState<MBTIAxes>(initialAxes);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(value || []));

  // Calculate match percentages for all types
  const typesWithMatches = useMemo(() => {
    return mbtiData.map(mbtiType => ({
      ...mbtiType,
      match: calculateMBTIMatch(axes, mbtiType.type),
    }));
  }, [axes]);

  // Update selections based on slider changes (auto-recommend high matches)
  useEffect(() => {
    const recommended = getRecommendedMBTITypes(axes, 50); // 50% threshold
    const newSelections = new Set(selectedTypes);

    // Auto-select types with match >= 70%
    typesWithMatches.forEach(item => {
      if (item.match >= 70 && !newSelections.has(item.type)) {
        newSelections.add(item.type);
      }
    });

    // Update if selections changed
    if (newSelections.size !== selectedTypes.size) {
      setSelectedTypes(newSelections);
      onChange(Array.from(newSelections));
    }
  }, [axes]);

  const handleAxisChange = (axis: keyof MBTIAxes, value: number[]) => {
    setAxes(prev => ({ ...prev, [axis]: value[0] }));
  };

  const toggleType = (type: string) => {
    const newSelections = new Set(selectedTypes);
    if (newSelections.has(type)) {
      newSelections.delete(type);
    } else {
      newSelections.add(type);
    }
    setSelectedTypes(newSelections);
    onChange(Array.from(newSelections));
  };

  const selectAll = () => {
    const allTypes = mbtiData.map(t => t.type);
    setSelectedTypes(new Set(allTypes));
    onChange(allTypes);
  };

  const deselectAll = () => {
    setSelectedTypes(new Set());
    onChange([]);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Slider Controls Section */}
      <div className="w-full p-6 bg-muted/30 rounded-3xl">
        <h3 className="text-base font-semibold mb-4 text-foreground">Personality Preferences</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Adjust the sliders to discover MBTI types that match your preferences
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* E/I Axis */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-help text-foreground">
                      {axisDescriptions.ei.left.label} ↔ {axisDescriptions.ei.right.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-semibold mb-1">{axisDescriptions.ei.title}</p>
                    <p className="text-xs mb-2 italic">{axisDescriptions.ei.question}</p>
                    <p className="text-xs">{axes.ei < 50 ? axisDescriptions.ei.left.description : axisDescriptions.ei.right.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground">{Math.round(axes.ei)}%</span>
            </div>
            <Slider
              value={[axes.ei]}
              onValueChange={(val) => handleAxisChange('ei', val)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>I</span>
              <span>E</span>
            </div>
          </div>

          {/* S/N Axis */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-help text-foreground">
                      {axisDescriptions.sn.left.label} ↔ {axisDescriptions.sn.right.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-semibold mb-1">{axisDescriptions.sn.title}</p>
                    <p className="text-xs mb-2 italic">{axisDescriptions.sn.question}</p>
                    <p className="text-xs">{axes.sn < 50 ? axisDescriptions.sn.left.description : axisDescriptions.sn.right.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground">{Math.round(axes.sn)}%</span>
            </div>
            <Slider
              value={[axes.sn]}
              onValueChange={(val) => handleAxisChange('sn', val)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>S</span>
              <span>N</span>
            </div>
          </div>

          {/* T/F Axis */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-help text-foreground">
                      {axisDescriptions.tf.left.label} ↔ {axisDescriptions.tf.right.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-semibold mb-1">{axisDescriptions.tf.title}</p>
                    <p className="text-xs mb-2 italic">{axisDescriptions.tf.question}</p>
                    <p className="text-xs">{axes.tf < 50 ? axisDescriptions.tf.left.description : axisDescriptions.tf.right.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground">{Math.round(axes.tf)}%</span>
            </div>
            <Slider
              value={[axes.tf]}
              onValueChange={(val) => handleAxisChange('tf', val)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>T</span>
              <span>F</span>
            </div>
          </div>

          {/* J/P Axis */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-help text-foreground">
                      {axisDescriptions.jp.left.label} ↔ {axisDescriptions.jp.right.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-semibold mb-1">{axisDescriptions.jp.title}</p>
                    <p className="text-xs mb-2 italic">{axisDescriptions.jp.question}</p>
                    <p className="text-xs">{axes.jp < 50 ? axisDescriptions.jp.left.description : axisDescriptions.jp.right.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground">{Math.round(axes.jp)}%</span>
            </div>
            <Slider
              value={[axes.jp]}
              onValueChange={(val) => handleAxisChange('jp', val)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>J</span>
              <span>P</span>
            </div>
          </div>
        </div>
      </div>

      {/* MBTI Types Grid (4x4 - Always visible) */}
      <div className="w-full p-6 bg-muted/30 rounded-3xl">
        <h3 className="text-base font-semibold mb-4 text-foreground">Select Compatible Types</h3>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {typesWithMatches.map((mbtiType) => {
            const isSelected = selectedTypes.has(mbtiType.type);
            const matchLevel = mbtiType.match >= 70 ? 'high' : mbtiType.match >= 50 ? 'medium' : 'low';

            return (
              <div
                key={mbtiType.type}
                onClick={() => toggleType(mbtiType.type)}
                className={cn(
                  "flex flex-col items-center cursor-pointer transition-all duration-300 p-3 rounded-2xl relative group",
                  "hover:scale-105 active:scale-95",
                  isSelected
                    ? "bg-primary/10 ring-2 ring-primary"
                    : matchLevel === 'high'
                    ? "bg-green-50 dark:bg-green-900/20"
                    : matchLevel === 'medium'
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-muted/50"
                )}
              >
                {/* Match percentage badge */}
                <div className={cn(
                  "absolute top-1 right-1 text-[10px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                  matchLevel === 'high' ? "bg-green-500 text-white" :
                  matchLevel === 'medium' ? "bg-blue-500 text-white" :
                  "bg-gray-500 text-white"
                )}>
                  {mbtiType.match}%
                </div>

                {/* Label */}
                <p className="text-xs font-medium mb-2 text-center text-foreground">
                  {mbtiType.label}
                </p>

                {/* Character Circle */}
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <mbtiType.icon className="w-10 h-10 object-contain" />
                  </div>
                </div>

                {/* Type Tag */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300 shadow-sm",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300",
                      isSelected ? "bg-primary-foreground" : "bg-muted"
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
                  <span>{mbtiType.type}</span>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                    {mbtiType.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="text-xs font-medium"
          >
            SELECT ALL
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={deselectAll}
            className="text-xs font-medium"
          >
            DESELECT ALL
          </Button>
        </div>
      </div>

      {/* Selected Types Summary */}
      {selectedTypes.size > 0 && (
        <div className="w-full p-6 bg-muted/30 rounded-3xl">
          <h3 className="text-base font-semibold mb-3 text-foreground">Your Selections ({selectedTypes.size})</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedTypes).map(type => {
              const mbtiType = mbtiData.find(t => t.type === type);
              const match = typesWithMatches.find(t => t.type === type)?.match || 0;
              return (
                <div
                  key={type}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground"
                >
                  <span>{type}</span>
                  {match >= 50 && (
                    <span className="text-xs opacity-75">
                      {match}%
                    </span>
                  )}
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
