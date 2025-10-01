import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import { getLogoClasses, getResponsiveLogoClasses, getTextLogoClasses, } from "../../lib/logoUtils";
import { useSystemConfig } from "../../contexts/SystemConfigContext";
/**
 * Reusable Logo component that adapts to system configuration
 */
export const Logo = ({ logoUrl, appName, size = "medium", context = "nav", className, showText = true, fallbackIcon: FallbackIcon = Shield, to, onClick, responsive = false, }) => {
    const classes = responsive
        ? getResponsiveLogoClasses(size)
        : getLogoClasses(size, context);
    const hasCustomLogo = logoUrl && logoUrl !== "/logo.png";
    const content = (_jsxs("div", { className: cn(classes.container, className), children: [hasCustomLogo ? (_jsx("img", { src: logoUrl, alt: appName, className: cn(classes.image, "object-contain"), onError: (e) => {
                    // Fallback to icon if image fails to load
                    const target = e.target;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling;
                    if (fallback) {
                        fallback.style.display = "block";
                    }
                } })) : null, _jsx(FallbackIcon, { className: cn(classes.fallback, "text-primary", hasCustomLogo ? "hidden" : "block") }), showText && (_jsxs(_Fragment, { children: [_jsx("span", { className: cn(getTextLogoClasses(size, false), "text-gray-900 hidden sm:inline"), children: appName }), _jsx("span", { className: cn(getTextLogoClasses(size, true), "text-gray-900 sm:hidden"), children: appName
                            .split(" ")
                            .map((word) => word[0])
                            .join("") })] }))] }));
    // Wrap in Link if 'to' prop is provided
    if (to) {
        return (_jsx(Link, { to: to, className: "flex items-center", onClick: onClick, children: content }));
    }
    // Wrap in button if onClick is provided
    if (onClick) {
        return (_jsx("button", { onClick: onClick, className: "flex items-center", children: content }));
    }
    return content;
};
export const AppLogo = (props) => {
    // Import the hook at the top of the file
    const { appName, appLogoUrl, appLogoSize } = useSystemConfig();
    return (_jsx(Logo, { appName: appName, logoUrl: appLogoUrl, size: appLogoSize, ...props }));
};
export default Logo;
