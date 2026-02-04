import logoAD from "@/assets/logo-ad.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Fixed dimensions to prevent layout shift
const sizes = {
  sm: { width: 40, height: 40 },
  md: { width: 56, height: 56 },
  lg: { width: 64, height: 64 },
};

export const Logo = ({ size = "md", className = "" }: LogoProps) => {
  const { width, height } = sizes[size];
  
  return (
    <div 
      className={`flex-shrink-0 ${className}`}
      style={{ width, height }}
    >
      <img 
        src={logoAD} 
        alt="AD Logo" 
        width={width}
        height={height}
        className="w-full h-full object-contain rounded-2xl"
        style={{ width, height }}
      />
    </div>
  );
};
