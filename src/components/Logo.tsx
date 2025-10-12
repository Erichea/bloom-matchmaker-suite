import BloomLogo from "@/assets/bloom-logo.svg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <img 
      src={BloomLogo} 
      alt="BLOOM" 
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
}
