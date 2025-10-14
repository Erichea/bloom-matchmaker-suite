import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface CompactMatchCardProps {
  id: string;
  name: string;
  photoUrl?: string;
  initials: string;
  onClick?: () => void;
  isDragging?: boolean;
}

const CompactMatchCard = ({ id, name, photoUrl, initials, onClick, isDragging }: CompactMatchCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const firstName = name.split(' ')[0];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.03, y: -1 }} // Reduced scale and movement for better performance
      whileTap={{ scale: 0.97 }} // Reduced scale for better responsiveness
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer touch-manipulation",
        "select-none no-context-menu will-change-transform" // Performance optimizations
      )}
    >
      {/* Instagram story-sized card: compact circular photo + name */}
      <div className="flex flex-col items-center space-y-2 p-2">
        {/* Circular photo - Instagram story head size */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16">
          {photoUrl ? (
            <div
              className="w-full h-full rounded-full overflow-hidden ring-2 ring-background/10 hover:ring-primary/30 transition-all duration-200"
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={photoUrl}
                alt={firstName}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
                style={{
                  WebkitUserSelect: 'none',
                  WebkitUserDrag: 'none',
                  userSelect: 'none',
                  userDrag: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center ring-2 ring-background/10 hover:ring-primary/30 transition-all duration-200">
              <span className="text-sm font-semibold text-muted-foreground">
                {initials.slice(0, 2)}
              </span>
            </div>
          )}

          {/* Subtle status indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        {/* Name below photo */}
        <div className="text-center">
          <h3 className="text-xs font-medium text-foreground truncate max-w-[70px] sm:max-w-[80px]">
            {firstName}
          </h3>
        </div>
      </div>

      {/* Drag feedback overlay */}
      {isDragging && (
        <motion.div
          className="absolute inset-0 bg-primary/10 rounded-xl border-2 border-primary/30 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};

export default CompactMatchCard;