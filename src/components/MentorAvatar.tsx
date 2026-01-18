import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import mentorPhoto from "@/assets/mentor-photo.png";

interface MentorAvatarProps {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  className?: string;
  showBorder?: boolean;
}

// Preload the image globally when module loads
const preloadedImage = new Image();
preloadedImage.src = mentorPhoto;

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
  xxl: "w-24 h-24",
};

export function MentorAvatar({ 
  size = "md", 
  className = "",
  showBorder = true 
}: MentorAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(preloadedImage.complete);

  useEffect(() => {
    if (!preloadedImage.complete) {
      preloadedImage.onload = () => setImageLoaded(true);
    }
  }, []);

  return (
    <div 
      className={`
        rounded-full overflow-hidden flex-shrink-0
        ${sizeClasses[size] || sizeClasses.md}
        ${showBorder ? "border-2 border-primary/30 shadow-lg" : ""}
        ${className}
      `}
    >
      <motion.img
        src={mentorPhoto}
        alt="Mentor Duarte"
        className="w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      {!imageLoaded && (
        <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-full" />
      )}
    </div>
  );
}

// Export preload function for eager loading
export function preloadMentorImage() {
  return new Promise<void>((resolve) => {
    if (preloadedImage.complete) {
      resolve();
    } else {
      preloadedImage.onload = () => resolve();
    }
  });
}
