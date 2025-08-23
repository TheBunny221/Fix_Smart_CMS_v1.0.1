/**
 * Logo utility functions for consistent logo rendering across the application
 */

/**
 * Get Tailwind CSS classes for logo based on size configuration
 * @param size - Logo size: 'small', 'medium', 'large'
 * @param context - Context where logo is used: 'nav', 'auth', 'footer'
 * @returns Object with CSS classes for container, image, and fallback icon
 */
export function getLogoClasses(size = "medium", context = "nav") {
  const sizeMap = {
    small: {
      nav: {
        container: "flex items-center space-x-1",
        image: "h-6 w-auto",
        fallback: "h-6 w-6",
      },
      "nav-mobile": {
        container: "flex items-center space-x-1",
        image: "h-5 w-auto",
        fallback: "h-5 w-5",
      },
      auth: {
        container: "flex items-center justify-center space-x-2",
        image: "h-8 w-auto",
        fallback: "h-8 w-8",
      },
      footer: {
        container: "flex items-center space-x-1",
        image: "h-5 w-auto",
        fallback: "h-5 w-5",
      },
      mobile: {
        container: "flex items-center space-x-1",
        image: "h-5 w-auto",
        fallback: "h-5 w-5",
      },
    },
    medium: {
      nav: {
        container: "flex items-center space-x-2",
        image: "h-8 w-auto",
        fallback: "h-8 w-8",
      },
      "nav-mobile": {
        container: "flex items-center space-x-1",
        image: "h-6 w-auto",
        fallback: "h-6 w-6",
      },
      auth: {
        container: "flex items-center justify-center space-x-3",
        image: "h-12 w-auto",
        fallback: "h-12 w-12",
      },
      footer: {
        container: "flex items-center space-x-2",
        image: "h-6 w-auto",
        fallback: "h-6 w-6",
      },
      mobile: {
        container: "flex items-center space-x-1",
        image: "h-6 w-auto",
        fallback: "h-6 w-6",
      },
    },
    large: {
      nav: {
        container: "flex items-center space-x-3",
        image: "h-10 w-auto",
        fallback: "h-10 w-10",
      },
      "nav-mobile": {
        container: "flex items-center space-x-2",
        image: "h-8 w-auto",
        fallback: "h-8 w-8",
      },
      auth: {
        container: "flex items-center justify-center space-x-4",
        image: "h-16 w-auto",
        fallback: "h-16 w-16",
      },
      footer: {
        container: "flex items-center space-x-2",
        image: "h-8 w-auto",
        fallback: "h-8 w-8",
      },
      mobile: {
        container: "flex items-center space-x-2",
        image: "h-8 w-auto",
        fallback: "h-8 w-8",
      },
    },
  };

  const normalizedSize = size.toLowerCase();
  const normalizedContext = context === "mobile" ? "nav-mobile" : context;

  const sizeConfig = sizeMap[normalizedSize] || sizeMap.medium;
  const contextConfig = sizeConfig[normalizedContext] || sizeConfig.nav;

  return contextConfig;
}

/**
 * Get responsive logo classes that adapt to screen size
 * @param size - Logo size configuration
 * @returns Object with responsive CSS classes
 */
export function getResponsiveLogoClasses(size = "medium") {
  const baseClasses = getLogoClasses(size, "nav");
  const mobileClasses = getLogoClasses(size, "mobile");

  return {
    container: `${baseClasses.container}`,
    image: `${mobileClasses.image} sm:${baseClasses.image}`,
    fallback: `${mobileClasses.fallback} sm:${baseClasses.fallback}`,
  };
}

/**
 * Generate text logo/app name classes based on size
 * @param size - Logo size configuration
 * @param isMobile - Whether this is for mobile display
 * @returns CSS classes for text logo
 */
export function getTextLogoClasses(size = "medium", isMobile = false) {
  const sizeMap = {
    small: isMobile ? "text-sm font-bold" : "text-lg font-bold",
    medium: isMobile ? "text-base font-bold" : "text-xl font-bold",
    large: isMobile ? "text-lg font-bold" : "text-2xl font-bold",
  };

  const normalizedSize = size.toLowerCase();
  return sizeMap[normalizedSize] || sizeMap.medium;
}

/**
 * Get logo props based on configuration
 * @param config - Logo configuration object
 * @returns Logo props object
 */
export function getLogoProps(config = {}) {
  const {
    size = "medium",
    variant = "full",
    theme = "auto",
    responsive = true,
  } = config;

  const logoClasses = responsive
    ? getResponsiveLogoClasses(size)
    : getLogoClasses(size, "nav");

  return {
    container: logoClasses.container,
    image: logoClasses.image,
    text: getTextLogoClasses(size, false),
  };
}

// React component wrappers for logo elements
export const LogoContainer = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const LogoImage = ({ src, alt, className = "", ...props }) => (
  <img src={src} alt={alt} className={className} {...props} />
);

export const LogoText = ({ children, className = "", ...props }) => (
  <span className={className} {...props}>
    {children}
  </span>
);
