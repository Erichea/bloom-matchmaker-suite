import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  name: string;
  age?: number;
  location?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  interests?: string[];
  highlight?: boolean;
  className?: string;
  variant?: "light" | "dark";
}

export function ProfileCard({
  name,
  age,
  location,
  headline,
  bio,
  avatarUrl,
  interests,
  highlight,
  className,
  variant = "light",
}: ProfileCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-none shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_80px_-40px_rgba(12,12,12,0.45)]",
        variant === "dark"
          ? "border-white/10 bg-white/10 backdrop-blur"
          : "bg-[hsl(var(--surface))]",
        highlight && "ring-2 ring-[hsl(var(--brand-primary))]/40",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar
            className={cn(
              "h-16 w-16 border shadow-sm",
              variant === "dark"
                ? "border-white/10 bg-white/10"
                : "border-[hsl(var(--brand-secondary))]/20",
            )}
          >
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} />
            ) : (
              <AvatarFallback
                className={cn(
                  variant === "dark"
                    ? "bg-white/20 text-white"
                    : "bg-[hsl(var(--brand-secondary))] text-[hsl(var(--brand-secondary-foreground))]",
                )}
              >
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-1">
            <p
              className={cn(
                "text-lg font-semibold leading-none",
                variant === "dark"
                  ? "text-white"
                  : "text-[hsl(var(--brand-secondary))]",
              )}
            >
              {name}
              {age ? <span className="ml-2 text-sm font-normal text-muted-foreground">{age}</span> : null}
            </p>
            {location ? (
              <p
                className={cn(
                  "flex items-center gap-1 text-xs uppercase tracking-[0.2em]",
                  variant === "dark" ? "text-white/60" : "text-muted-foreground",
                )}
              >
                <MapPin className="h-3 w-3" />
                {location}
              </p>
            ) : null}
            {headline ? (
              <p className={cn("text-sm", variant === "dark" ? "text-white/70" : "text-muted-foreground")}>{headline}</p>
            ) : null}
          </div>
        </div>

        {bio ? (
          <p className={cn("text-sm leading-6", variant === "dark" ? "text-white/70" : "text-muted-foreground")}>{bio}</p>
        ) : null}

        {interests?.length ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className={cn(
                  "rounded-full border border-transparent px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.2em]",
                  variant === "dark"
                    ? "bg-white/10 text-white/70"
                    : "bg-[hsl(var(--brand-secondary))]/10 text-muted-foreground",
                )}
              >
                {interest}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
