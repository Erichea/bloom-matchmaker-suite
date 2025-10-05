import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface MatchItem {
  id: string;
  name: string;
  status: "pending" | "mutual" | "new" | "inactive";
  compatibility?: number;
  avatarUrl?: string;
  subtitle?: string;
}

interface MatchListProps {
  title?: string;
  matches: MatchItem[];
  highlightNew?: boolean;
  className?: string;
  onSelect?: (matchId: string) => void;
}

const statusCopy: Record<MatchItem["status"], string> = {
  pending: "Awaiting reply",
  mutual: "Mutual match",
  new: "New today",
  inactive: "Conversation archived",
};

export function MatchList({ title, matches, highlightNew, className, onSelect }: MatchListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title ? <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</h3> : null}
      <div className="space-y-3">
        {matches.map((match) => {
          const initials = match.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <button
              key={match.id}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 text-left",
                "transition-all duration-200 hover:border-[hsl(var(--brand-primary))]/40 hover:shadow-sm",
                highlightNew && match.status === "new" && "border-[hsl(var(--brand-primary))]/50",
              )}
              onClick={() => onSelect?.(match.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  {match.avatarUrl ? (
                    <AvatarImage src={match.avatarUrl} alt={match.name} />
                  ) : (
                    <AvatarFallback className="bg-[hsl(var(--brand-secondary))] text-[hsl(var(--brand-secondary-foreground))]">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[hsl(var(--brand-secondary))]">{match.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{statusCopy[match.status]}</span>
                    {match.compatibility ? (
                      <Badge variant="outline" className="rounded-full border-transparent bg-[hsl(var(--brand-primary))]/10 text-[hsl(var(--brand-primary))]">
                        {match.compatibility}%
                      </Badge>
                    ) : null}
                  </div>
                  {match.subtitle ? (
                    <p className="text-xs text-muted-foreground/80">{match.subtitle}</p>
                  ) : null}
                </div>
              </div>
              {highlightNew && match.status === "new" ? (
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--brand-primary))]" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
