import React from "react";
import { cn } from "../lib/utils";

interface TruncatedTextWithTooltipProps {
  text: string;
  maxLength?: number;
  className?: string;
  responsive?: boolean; // New prop for responsive truncation
  maxWidth?: string; // Custom max width for responsive mode
}

const TruncatedTextWithTooltip: React.FC<TruncatedTextWithTooltipProps> = ({
  text,
  maxLength = 30,
  className = "",
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

    return (
      <span 
        className={cn(
          "inline-block cursor-default",
          className
        )}
        style={responsiveStyle}
        title={textString} // Native browser tooltip
      >
        {textString}
      </span>
    );
  }
  
  // If text is short enough, render without truncation
  if (textString.length <= maxLength) {
    return (
      <span className={cn("inline-block", className)}>
        {textString}
      </span>
    );
  }

  // Truncate text (character-based mode)
  const truncatedText = textString.slice(0, maxLength) + "...";

  return (
    <span 
      className={cn(
        "inline-block cursor-default",
        "whitespace-nowrap overflow-hidden text-ellipsis",
        className
      )}
      title={textString} // Native browser tooltip shows full text on hover
    >
      {truncatedText}
    </span>
  );
};

export default TruncatedTextWithTooltip;