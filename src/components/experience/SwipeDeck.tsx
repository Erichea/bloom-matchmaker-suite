import { motion } from "framer-motion";
import { useMemo } from "react";
import { ProfileCard } from "./ProfileCard";

interface SwipeDeckProfile {
  id: string;
  name: string;
  age?: number;
  location?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  interests?: string[];
}

interface SwipeDeckProps {
  profiles: SwipeDeckProfile[];
  className?: string;
}

export function SwipeDeck({ profiles, className }: SwipeDeckProps) {
  const layeredProfiles = useMemo(() => profiles.slice(0, 3), [profiles]);

  return (
    <div className={className}>
      <div className="relative h-[340px] w-full max-w-sm">
        {layeredProfiles.map((profile, index) => {
          const offset = index * 12;
          const scale = 1 - index * 0.05;
          const zIndex = layeredProfiles.length - index;

          return (
            <motion.div
              key={profile.id}
              className="absolute inset-0"
              style={{ zIndex }}
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: -offset, opacity: 1, scale }}
              transition={{ duration: 0.4 + index * 0.1, ease: "easeOut" }}
            >
              <ProfileCard
                {...profile}
                highlight={index === 0}
                className="h-full w-full backdrop-blur supports-[backdrop-filter]:bg-white/60"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
