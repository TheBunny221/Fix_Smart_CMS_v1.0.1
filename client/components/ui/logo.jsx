import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  getLogoClasses,
  getResponsiveLogoClasses,
  getTextLogoClasses,
  LogoProps,
} from "../../lib/logoUtils";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

interface ExtendedLogoProps extends LogoProps {
  to?;
  onClick: () => void;
  responsive?;
}

/**
 * Reusable Logo component that adapts to system configuration
 */
export const Logo: React.FC = ({
  logoUrl,
  appName,
  size = "medium",
  context = "nav",
  className,
  showText = true,
  fallbackIcon = Shield,
  to,
  onClick,
  responsive = false,
}) => {
  const classes = responsive
    ? getResponsiveLogoClasses(size)
    : getLogoClasses(size, context);

  const hasCustomLogo = logoUrl && logoUrl == "/logo.png";

  const content = (
    
      {/* Logo Image or Fallback Icon */}
      {hasCustomLogo ? (
         {
            // Fallback to icon if image fails to load
            const target = e.target;
            target.style.display = "none";
            const fallback = target.nextElementSibling;
            if (fallback) {
              fallback.style.display = "block";
            }
          }}
        />
      ) : null}

      {/* Fallback Icon */}
      

      {/* App Name Text */}
      {showText && (
        
          {/* Full name on larger screens */}
          
            {appName}
          

          {/* Abbreviated name on mobile */}
          
            {appName
              .split(" ")
              .map((word) => word[0])
              .join("")}
          
        
      )}
    
  );

  // Wrap in Link if 'to' prop is provided
  if (to) {
    return (
      
        {content}
      
    );
  }

  // Wrap in button if onClick is provided
  if (onClick) {
    return (
      
        {content}
      
    );
  }

  return content;
};

/**
 * App Logo component with system configuration
 */


export const AppLogo: React.FC = (props) => {
  // Import the hook at the top of the file
  const { appName, appLogoUrl, appLogoSize } = useSystemConfig();

  return (
    
  );
};

export default Logo;
