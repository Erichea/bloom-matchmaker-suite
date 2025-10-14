import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import MatchCard from "./MatchCard";

interface KanbanColumnProps {
  title: string;
  emoji: string;
  status: string;
  matches: Array<{
    id: string;
    name: string;
    photoUrl?: string;
    initials: string;
  }>;
  onMatchClick: (matchId: string) => void;
}

const KanbanColumn = ({ title, emoji, status, matches, onMatchClick }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-2xl">{emoji}</span>
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {matches.length}
        </span>
      </div>

      {/* Drop Zone */}
      <motion.div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isOver
            ? "border-primary bg-primary/5"
            : "border-border bg-background/50"
        }`}
        animate={{
          backgroundColor: isOver ? "rgba(var(--primary), 0.05)" : "rgba(var(--background), 0.5)",
        }}
      >
        <div className="p-4">
          {/* Matches Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 min-h-[200px]">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                id={match.id}
                name={match.name}
                photoUrl={match.photoUrl}
                initials={match.initials}
                onClick={() => onMatchClick(match.id)}
              />
            ))}
          </div>

          {/* Empty State */}
          {matches.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {isOver ? "Drop here" : "No matches yet"}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default KanbanColumn;