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
        "relative overflow-hidden border-border/40 bg-card shadow-md backdrop-blur-sm",
        "transition-all duration-500 hover:-translate-y-2 hover:shadow-xl",
        highlight && "ring-2 ring-accent/30 shadow-lg",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-5 p-8">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20 border-2 border-border/30 shadow-sm ring-2 ring-background">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-secondary text-foreground font-serif text-xl">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-serif font-light leading-tight text-foreground">
                {name}
              </h3>
              {age && <span className="text-sm font-sans text-muted-foreground">{age}</span>}
            </div>
            {location && (
              <p className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </p>
            )}
            {headline && <p className="text-sm leading-relaxed text-muted-foreground">{headline}</p>}
          </div>
        </div>

        {bio && (
          <p className="text-sm leading-relaxed text-muted-foreground/90">{bio}</p>
        )}

        {interests?.length ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="rounded-full border-0 bg-secondary px-3.5 py-1.5 text-[0.7rem] font-medium tracking-wide text-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors"
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
