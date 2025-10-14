import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MatchCardProps {
  id: string;
  name: string;
  photoUrl?: string;
  initials: string;
  onClick?: () => void;
}

const MatchCard = ({ id, name, photoUrl, initials, onClick }: MatchCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-all duration-300">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={firstName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-2xl font-semibold text-muted-foreground bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
              {initials}
            </div>
          </div>
        )}

        {/* Gradient overlay for name */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg">{firstName}</h3>
        </div>

        {/* Subtle hover indicator */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </motion.div>
  );
};

export default MatchCard;