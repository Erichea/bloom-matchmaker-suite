import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface MatchItem {
  id: string;
  name: string;
  status: "pending" | "mutual" | "new" | "inactive";
  compatibility?: number;
  avatarUrl?: string;
  matchDate?: string;
  currentUserResponse?: string | null;
  otherUserResponse?: string | null;
}

interface MatchListProps {
  title?: string;
  matches: MatchItem[];
  highlightNew?: boolean;
  className?: string;
  onSelect?: (matchId: string) => void;
}

type MatchCategory = "your_turn" | "their_turn" | "mutual";

export function MatchList({ title, matches, highlightNew, className, onSelect }: MatchListProps) {
  const [expandedSections, setExpandedSections] = useState<Set<MatchCategory>>(
    new Set(["your_turn", "their_turn", "mutual"])
  );

  const toggleSection = (category: MatchCategory) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Categorize matches
  const categorizedMatches = matches.reduce(
    (acc, match) => {
      const isMutual = match.status === "mutual" ||
        (match.currentUserResponse === "accepted" && match.otherUserResponse === "accepted");
      const userHasResponded = match.currentUserResponse !== null && match.currentUserResponse !== undefined;
      const otherHasResponded = match.otherUserResponse !== null && match.otherUserResponse !== undefined;

      if (isMutual) {
        acc.mutual.push(match);
      } else if (!userHasResponded) {
        acc.your_turn.push(match);
      } else if (userHasResponded && !otherHasResponded) {
        acc.their_turn.push(match);
      }
      return acc;
    },
    { your_turn: [], their_turn: [], mutual: [] } as Record<MatchCategory, MatchItem[]>
  );

  const renderMatchItem = (match: MatchItem, category: MatchCategory) => {
    const initials = match.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const formatMatchDate = (dateString?: string) => {
      if (!dateString) return "Recently";
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
      <div
        key={match.id}
        className="flex w-full items-center justify-between gap-3 py-3 border-b border-border/40 last:border-0"
      >
        <button
          type="button"
          className="flex items-center gap-3 flex-1 text-left"
          onClick={() => onSelect?.(match.id)}
        >
          <Avatar className="h-14 w-14 ring-1 ring-border/20">
            {match.avatarUrl ? (
              <AvatarImage src={match.avatarUrl} alt={match.name} />
            ) : (
              <AvatarFallback className="bg-[hsl(var(--brand-secondary))] text-[hsl(var(--brand-secondary-foreground))]">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{match.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatMatchDate(match.matchDate)}
            </p>
          </div>
        </button>
        {category === "your_turn" && (
          <Button
            size="sm"
            variant="default"
            className="rounded-full px-6 bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary))]/90"
            onClick={() => onSelect?.(match.id)}
          >
            View
          </Button>
        )}
        {category === "their_turn" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full px-4"
            disabled
          >
            Waiting
          </Button>
        )}
      </div>
    );
  };

  const renderSection = (category: MatchCategory, title: string, count: number) => {
    const isExpanded = expandedSections.has(category);
    const matchesForCategory = categorizedMatches[category];

    if (count === 0) return null;

    return (
      <div key={category} className="space-y-2">
        <button
          type="button"
          className="flex items-center justify-between w-full text-left py-2"
          onClick={() => toggleSection(category)}
        >
          <h3 className="text-base font-bold text-foreground">
            {title} ({count})
          </h3>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </button>
        {isExpanded && (
          <div className="space-y-0">
            {matchesForCategory.map((match) => renderMatchItem(match, category))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {title ? <h2 className="text-3xl font-bold text-foreground mb-4">{title}</h2> : null}
      <div className="space-y-4">
        {renderSection("your_turn", "Your turn", categorizedMatches.your_turn.length)}
        {renderSection("their_turn", "Their turn", categorizedMatches.their_turn.length)}
        {renderSection("mutual", "Mutual Matches", categorizedMatches.mutual.length)}
      </div>
    </div>
  );
}
