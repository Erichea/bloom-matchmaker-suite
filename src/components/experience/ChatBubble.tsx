import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  author: "self" | "match";
  message: string;
  timestamp?: string;
  className?: string;
}

export function ChatBubble({ author, message, timestamp, className }: ChatBubbleProps) {
  const isSelf = author === "self";

  return (
    <div className={cn("flex w-full", isSelf ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
          isSelf
            ? "bg-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary-foreground))]"
            : "bg-[hsl(var(--surface))] text-[hsl(var(--brand-secondary))]",
          className,
        )}
      >
        <p className="whitespace-pre-line">{message}</p>
        {timestamp ? (
          <p className="mt-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            {timestamp}
          </p>
        ) : null}
      </div>
    </div>
  );
}
