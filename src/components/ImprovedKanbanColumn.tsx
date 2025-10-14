import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import CompactMatchCard from "./CompactMatchCard";

interface ImprovedKanbanColumnProps {
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
  isDropTarget?: boolean;
}

const ImprovedKanbanColumn = ({
  title,
  emoji,
  status,
  matches,
  onMatchClick,
  isDropTarget
}: ImprovedKanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Debug log for droppable status
  useEffect(() => {
    console.log(`Column ${status} isOver:`, isOver);
  }, [isOver, status]);

  return (
    <motion.div
      layout
      className="flex flex-col h-full"
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-2xl">{emoji}</span>
        <h3 className="font-semibold text-lg">{title}</h3>
        <motion.span
          className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full"
          initial={{ scale: 1 }}
          animate={{
            scale: isOver ? 1.1 : 1,
            backgroundColor: isOver ? "rgba(var(--primary), 0.1)" : "rgba(var(--muted))"
          }}
          transition={{ duration: 0.2 }}
        >
          {matches.length}
        </motion.span>
      </div>

      {/* Drop Zone */}
      <motion.div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 p-4",
          "min-h-[120px] sm:min-h-[140px]",
          isOver || isDropTarget
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-background/50 hover:bg-background/70"
        )}
        animate={{
          backgroundColor: isOver || isDropTarget
            ? "rgba(var(--primary), 0.05)"
            : "rgba(var(--background), 0.5)",
          scale: isOver || isDropTarget ? 1.02 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.2
        }}
      >
        {/* Matches Grid - More compact */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 min-h-[80px]">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: index * 0.05
              }}
            >
              <CompactMatchCard
                id={match.id}
                name={match.name}
                photoUrl={match.photoUrl}
                initials={match.initials}
                onClick={() => onMatchClick(match.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {matches.length === 0 && (
          <motion.div
            className="flex items-center justify-center h-20 text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{
                scale: isOver ? 1.1 : 1,
                opacity: isOver ? 0.8 : 0.5
              }}
              transition={{ duration: 0.2 }}
            >
              {isOver ? "Drop here" : "No matches yet"}
            </motion.div>
          </motion.div>
        )}

        {/* Drop indicator */}
        {isOver && (
          <motion.div
            className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default ImprovedKanbanColumn;