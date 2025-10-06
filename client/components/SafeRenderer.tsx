import React from 'react';

interface SafeRendererProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * SafeRenderer component that prevents objects from being rendered directly in JSX
 * and provides fallback rendering for invalid data types
 */
export const SafeRenderer: React.FC<SafeRendererProps> = ({ 
  children, 
  fallback = <span className="text-gray-400">—</span> 
}) => {
  try {
    // Check if children is a valid React node
    if (children === null || children === undefined) {
      return <>{fallback}</>;
    }
    
    // If children is an object (but not a React element), render fallback
    if (typeof children === 'object' && !React.isValidElement(children)) {
      console.warn('SafeRenderer: Attempted to render object directly:', children);
      return <>{fallback}</>;
    }
    
    return <>{children}</>;
  } catch (error) {
    console.error('SafeRenderer: Error rendering children:', error);
    return <>{fallback}</>;
  }
};

/**
 * Utility function to safely render any value as a string
 */
export const safeRenderValue = (value: any, fallback: string = '—'): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    // If it's an object with a name property, use that
    if (value.name && typeof value.name === 'string') {
      return value.name;
    }
    // If it's an object with a label property, use that
    if (value.label && typeof value.label === 'string') {
      return value.label;
    }
    // If it's an object with a title property, use that
    if (value.title && typeof value.title === 'string') {
      return value.title;
    }
    // Otherwise return fallback
    return fallback;
  }
  
  return String(value);
};

/**
 * Hook to safely extract string values from potentially complex objects
 */
export const useSafeValue = (value: any, fallback: string = '—') => {
  return React.useMemo(() => safeRenderValue(value, fallback), [value, fallback]);
};

export default SafeRenderer;