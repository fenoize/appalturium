import { cn } from "@/lib/utils";

// Logo del sistema - cambiar esta URL por el logo PNG/SVG de la empresa
const LOGO_URL = "https://storage.googleapis.com/gpt-engineer-file-uploads/CiEJ69xzYWd50WEVolqUpwkDQxk2/uploads/1766074409000-alturium-iso-dark@4x.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <img 
        src={LOGO_URL} 
        alt="ALTURIUM Logo" 
        className={cn(sizeClasses[size], "object-contain")}
      />
      {showText && (
        <div>
          <h1 className={cn("font-semibold text-foreground", textSizeClasses[size])}>
            ALTURIUM
          </h1>
          {size !== "sm" && (
            <p className="text-xs text-muted-foreground">Sistema Logístico</p>
          )}
        </div>
      )}
    </div>
  );
}

export { LOGO_URL };
