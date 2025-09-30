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
        "relative overflow-hidden border-none bg-[hsl(var(--surface))] shadow-none",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_80px_-40px_rgba(12,12,12,0.45)]",
        highlight && "ring-2 ring-[hsl(var(--brand-primary))]/40",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-[hsl(var(--brand-secondary))]/20 shadow-sm">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} />
            ) : (
              <AvatarFallback className="bg-[hsl(var(--brand-secondary))] text-[hsl(var(--brand-secondary-foreground))]">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-1">
            <p className="text-lg font-semibold leading-none text-[hsl(var(--brand-secondary))]">
              {name}
              {age ? <span className="ml-2 text-sm font-normal text-muted-foreground">{age}</span> : null}
            </p>
            {location ? (
              <p className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {location}
              </p>
            ) : null}
            {headline ? <p className="text-sm text-muted-foreground">{headline}</p> : null}
          </div>
        </div>

        {bio ? (
          <p className="text-sm leading-6 text-muted-foreground">{bio}</p>
        ) : null}

        {interests?.length ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="rounded-full border border-transparent bg-[hsl(var(--brand-secondary))]/10 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground"
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
