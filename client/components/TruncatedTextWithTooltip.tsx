import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "../lib/utils";

interface TruncatedTextWithTooltipProps {
  text: string;
  maxLength?: number;
  className?: string;
  tooltipClassName?: string;
  showTooltip?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  responsive?: boolean; // New prop for responsive truncation
  maxWidth?: string; // Custom max width for responsive mode
}

const TruncatedTextWithTooltip: React.FC<TruncatedTextWithTooltipProps> = ({
  text,
  maxLength = 30,
  className = "",
  tooltipClassName = "",
  showTooltip = true,
  side = "top",
  align = "center",
  responsive = false,
  maxWidth = "100%",
}) => {
  // Return empty if no text
  if (!text) {
    return <span className={className}>-</span>;
  }

  // Convert to string if not already
  const textString = String(text);
  
  // If using responsive mode, use CSS truncation
  if (responsive) {
    const responsiveStyle = {
      maxWidth,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      whiteSpace: 'nowrap' as const,
    };

    if (!showTooltip) {
      return (
        <span 
          className={cn(
            "inline-block cursor-default",
            className
          )}
          style={responsiveStyle}
          title={textString} // Fallback native tooltip
        >
          {textString}
        </span>
      );
    }

    // Render responsive with tooltip
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span 
              className={cn(
                "inline-block cursor-help",
                "hover:text-blue-600 transition-colors duration-200",
                className
              )}
              style={responsiveStyle}
              tabIndex={0}
              role="button"
              aria-label={`Truncated text: ${textString}`}
            >
              {textString}
            </span>
          </TooltipTrigger>
          <TooltipContent 
            side={side} 
            align={align}
            className={cn(
              "max-w-xs break-words z-50",
              "bg-gray-900 text-white text-sm",
              "border border-gray-700 shadow-lg",
              tooltipClassName
            )}
          >
            <p className="whitespace-pre-wrap">{textString}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // If text is short enough, render without tooltip (character-based mode)
  if (textString.length <= maxLength) {
    return (
      <span className={cn("inline-block", className)}>
        {textString}
      </span>
    );
  }

  // Truncate text (character-based mode)
  const truncatedText = textString.slice(0, maxLength) + "...";

  // If tooltips are disabled, just show truncated text
  if (!showTooltip) {
    return (
      <span 
        className={cn(
          "inline-block cursor-default",
          "whitespace-nowrap overflow-hidden text-ellipsis",
          className
        )}
        title={textString} // Fallback native tooltip
      >
        {truncatedText}
      </span>
    );
  }

  // Render with tooltip
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span 
            className={cn(
              "inline-block cursor-help",
              "whitespace-nowrap overflow-hidden text-ellipsis",
              "hover:text-blue-600 transition-colors duration-200",
              className
            )}
            tabIndex={0} // Make keyboard focusable for accessibility
            role="button"
            aria-label={`Truncated text: ${textString}`}
          >
            {truncatedText}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className={cn(
            "max-w-xs break-words z-50",
            "bg-gray-900 text-white text-sm",
            "border border-gray-700 shadow-lg",
            tooltipClassName
          )}
        >
          <p className="whitespace-pre-wrap">{textString}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TruncatedTextWithTooltip;