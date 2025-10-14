import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import CompactMatchCard from "./CompactMatchCard";

interface DragOverlayProps {
  id: string;
  name: string;
  photoUrl?: string;
  initials: string;
}

const DragOverlay = ({ id, name, photoUrl, initials }: DragOverlayProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="pointer-events-none touch-none"
    >
      <motion.div
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 1.1, opacity: 0.9 }}
        className="rotate-3"
      >
        <CompactMatchCard
          id={id}
          name={name}
          photoUrl={photoUrl}
          initials={initials}
          isDragging={true}
        />
      </motion.div>
    </div>
  );
};

export default DragOverlay;