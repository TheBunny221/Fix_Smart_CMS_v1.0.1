import React from "react";
import { Link } from "react-router-dom";
import {
  LogoImage,
  LogoText,
  LogoContainer,
  getLogoProps,
} from "../../lib/logoUtils.jsx";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

/**
 * Reusable Logo component that adapts to system configuration
 * Displays app name/logo with optional link and responsive behavior
 */
const Logo = ({
  size = "md",
  variant = "full",
  theme = "auto",
  className = "",
  showText = true,
  to,
  onClick,
  responsive = true,
}) => {
  const { appName, appLogo } = useSystemConfig();
  
  const logoProps = getLogoProps({
    size,
    variant,
    theme,
    responsive,
  });

  const logoContent = (
    <LogoContainer className={`${logoProps.container} ${className}`}>
      {appLogo && variant !== "text" && (
        <LogoImage
          src={appLogo}
          alt={`${appName} Logo`}
          className={logoProps.image}
        />
      )}
      {showText && variant !== "image" && (
        <LogoText className={logoProps.text}>
          {appName}
        </LogoText>
      )}
    </LogoContainer>
  );

  // If 'to' prop is provided, wrap in Link
  if (to) {
    return (
      <Link to={to} onClick={onClick} className="inline-block">
        {logoContent}
      </Link>
    );
  }

  // If onClick is provided, wrap in button
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="inline-block bg-transparent border-none cursor-pointer p-0"
        type="button"
      >
        {logoContent}
      </button>
    );
  }

  // Default: just return the logo content
  return logoContent;
};

export default Logo;
