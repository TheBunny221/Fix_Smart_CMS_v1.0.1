import React from "react";
import { Loader2 } from "lucide-react";

interface ConfigLoadingFallbackProps {
  message?: string;
  className?: string;
}

const ConfigLoadingFallback: React.FC<ConfigLoadingFallbackProps> = ({ 
  message = "Loading configuration...",
  className = "flex items-center justify-center p-4"
}) => {
  return (
    <div className={className}>
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

export default ConfigLoadingFallback;