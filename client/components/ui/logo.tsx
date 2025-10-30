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
import { useConfigManager } from "../../hooks/useConfigManager";

interface ExtendedLogoProps extends LogoProps {
  to?: string;
  onClick?: () => void;
  responsive?: boolean;
}

/**
 * Reusable Logo component that adapts to system configuration
 */
export const Logo: React.FC<ExtendedLogoProps> = ({
  logoUrl,
  appName,
  size = "medium",
  context = "nav",
  className,
  showText = true,
  fallbackIcon: FallbackIcon = Shield,
  to,
  onClick,
  responsive = false,
}) => {
  const classes = responsive
    ? getResponsiveLogoClasses(size)
    : getLogoClasses(size, context);

  // Check if we have a custom uploaded logo or fallback to default
  const hasCustomLogo = logoUrl && logoUrl !== "/logo.png";
  const [logoError, setLogoError] = React.useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = React.useState(logoUrl);

  // Check for uploaded logo on mount and when logoUrl changes
  React.useEffect(() => {
    const checkUploadedLogo = async () => {
      try {
        // First try the configured logo URL
        if (logoUrl && logoUrl !== "/logo.png") {
          const response = await fetch(logoUrl, { method: 'HEAD' });
          if (response.ok) {
            setCurrentLogoUrl(logoUrl);
            setLogoError(false);
            return;
          }
        }
        
        // Then try the uploaded logo
        const uploadedLogoResponse = await fetch('/uploads/logo.png', { method: 'HEAD' });
        if (uploadedLogoResponse.ok) {
          setCurrentLogoUrl('/uploads/logo.png');
          setLogoError(false);
          return;
        }
        
        // Fallback to default
        setCurrentLogoUrl('/logo.png');
        setLogoError(false);
      } catch (error) {
        // If all fails, use fallback icon
        setLogoError(true);
        setCurrentLogoUrl(undefined);
      }
    };

    checkUploadedLogo();
  }, [logoUrl]);

  const shouldShowImage = currentLogoUrl && !logoError;

  const content = (
    <div className={cn(classes.container, className)}>
      {/* Logo Image or Fallback Icon */}
      {shouldShowImage ? (
        <img
          src={currentLogoUrl}
          alt={appName}
          className={cn(classes.image, "object-contain")}
          onError={(e) => {
            // Fallback to icon if image fails to load
            setLogoError(true);
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = "block";
            }
          }}
        />
      ) : null}

      {/* Fallback Icon */}
      <FallbackIcon
        className={cn(
          classes.fallback,
          "text-primary",
          shouldShowImage ? "hidden" : "block",
        )}
      />

      {/* App Name Text */}
      {showText && (
        <>
          {/* Full name on larger screens */}
          <span
            className={cn(
              getTextLogoClasses(size, false),
              "text-gray-900 hidden sm:inline",
            )}
          >
            {appName}
          </span>

          {/* Abbreviated name on mobile */}
          <span
            className={cn(
              getTextLogoClasses(size, true),
              "text-gray-900 sm:hidden",
            )}
          >
            {appName
              .split(" ")
              .map((word) => word[0])
              .join("")}
          </span>
        </>
      )}
    </div>
  );

  // Wrap in Link if 'to' prop is provided
  if (to) {
    return (
      <Link to={to} className="flex items-center" onClick={onClick}>
        {content}
      </Link>
    );
  }

  // Wrap in button if onClick is provided
  if (onClick) {
    return (
      <button onClick={onClick} className="flex items-center">
        {content}
      </button>
    );
  }

  return content;
};

/**
 * App Logo component with system configuration
 */
interface AppLogoProps {
  context?: "nav" | "auth" | "footer" | "mobile";
  className?: string;
  showText?: boolean;
  to?: string;
  onClick?: () => void;
  responsive?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = (props) => {
  // Import the hook at the top of the file
  const { getAppName, getBrandingConfig } = useConfigManager();
  const brandingConfig = getBrandingConfig();
  const appName = getAppName();
  const appLogoUrl = brandingConfig.logoUrl;
  const appLogoSize = brandingConfig.logoSize;

  return (
    <Logo
      appName={appName}
      logoUrl={appLogoUrl}
      size={appLogoSize}
      {...props}
    />
  );
};

export default Logo;
