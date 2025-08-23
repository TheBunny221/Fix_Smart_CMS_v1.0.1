import React from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import {
  Loader2,
  Search,
  FileX,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter,
  Download,
  Upload,
  Inbox,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// Loading Skeleton Components
export const CardSkeleton: React.FC = ({
  className,
}) => (
  
    
      
      
    
    
      
      
      
    
  
);

export const TableSkeleton: React.FC = ({ rows = 5, columns = 4, className }) => ({/* Header */}
    
      {Array.from({ length).map((_, i) => (
        
      ))}
    

    {/* Rows */}
    {Array.from({ length).map((_, rowIndex) => ({Array.from({ length).map((_, colIndex) => (
          
        ))}
      
    ))}
  
);

export const ListSkeleton: React.FC = ({ items = 3, showAvatar = false, className }) => ({Array.from({ length).map((_, i) => (
      
        {showAvatar && }
        
          
          
        
      
    ))}
  
);

export const FormSkeleton: React.FC = ({ fields = 4, className }) => ({Array.from({ length).map((_, i) => (
      
        
        
      
    ))}
    
      
      
    
  
);

export const DashboardSkeleton: React.FC = ({
  className,
}) => ({/* Stats Cards */}
    
      {Array.from({ length).map((_, i) => (
        
          
            
              
              
            
            
          
        
      ))}
    

    {/* Chart Area */}
    
      
        
        
      
    

    {/* Recent Activity */}
    
      
        
        
      
    
  
);

// Loading States


export const LoadingSpinner: React.FC = ({
  size = "md",
  text,
  className,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    
      
      {text && {text}}
    
  );
};



export const LoadingOverlay: React.FC = ({
  isLoading,
  text = "Loading...",
  children,
  className,
}) => (
  
    {children}
    {isLoading && (
      
        
      
    )}
  
);

// Empty States
;
  className?;
}

export const EmptyState: React.FC = ({
  icon,
  title,
  description,
  action,
  className,
}) => ({icon && (
      
        {React.cloneElement(icon.ReactElement, {
          className,
        })}
      
    )}
    {title}
    {description}
    {action && (
      
        {action.label}
      
    )}
  
);

// Specific Empty States
export const NoDataEmpty: React.FC void;
  className?;
}> = ({ entityName, onAdd, className }) => (
  }
    title={`No ${entityName} Found`}
    description={`You haven't created any ${entityName.toLowerCase()} yet. Get started by creating your first one.`}
    action={
      onAdd
        ? {
            label: `Create ${entityName}`,
            onClick,
          }
        : undefined
    }
    className={className}
  />
);

export const NoSearchResultsEmpty: React.FC void;
  className?;
}> = ({ searchTerm, onClear, className }) => (}
    title="No Results Found"
    description={`No results found for "${searchTerm}". Try adjusting your search terms or filters.`}
    action={{
      label,
      onClick,
      variant: "outline",
    }}
    className={className}
  />
);

export const ErrorEmpty: React.FC void;
  className?;
}> = ({
  title = "Something went wrong",
  description = "We encountered an error while loading this data. Please try again.",
  onRetry,
  className,
}) => (}
    title={title}
    description={description}
    action={
      onRetry
        ? {
            label,
            onClick,
            variant: "outline",
          }
        : undefined
    }
    className={className}
  />
);

export const NoPermissionEmpty: React.FC = ({
  className,
}) => (
  }
    title="Access Denied"
    description="You don't have permission to view this content. Contact your administrator if you believe this is an error."
    className={className}
  />
);

// Status Indicators


export const StatusIndicator: React.FC = ({
  status,
  text,
  size = "md",
  showIcon = true,
  className,
}) => {
  const configs = {
    success: {
      icon,
      className: "bg-green-100 text-green-800 border-green-200",
      iconClassName: "text-green-500",
    },
    error: {
      icon,
      className: "bg-red-100 text-red-800 border-red-200",
      iconClassName: "text-red-500",
    },
    warning: {
      icon,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      iconClassName: "text-yellow-500",
    },
    info: {
      icon,
      className: "bg-blue-100 text-blue-800 border-blue-200",
      iconClassName: "text-blue-500",
    },
    pending: {
      icon,
      className: "bg-gray-100 text-gray-800 border-gray-200",
      iconClassName: "text-gray-500",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    
      {showIcon && (
        
      )}
      {text}
    
  );
};

// Progress States
>;
  className?;
}

export const ProgressStepper: React.FC = ({
  steps,
  className,
}) => (
  
    {steps.map((step, index) => (
      
        
          
            {step.status === "completed" ? (
              
            ) : step.status === "error" ? (
              
            ) : (
              index + 1
            )}
          
          {index 
          )}
        
        
          
            {step.title}
          
          {step.description && (
            {step.description}
          )}
        
      
    ))}
  
);

// Data Display Components


export const DataDisplay: React.FC = ({
  label,
  value,
  icon,
  className,
}) => (
  
    
      {icon && {icon}}
      {label}
    
    {value}
  
);

// Quick Action Buttons


export const QuickActionButton: React.FC = ({
  icon,
  label,
  onClick,
  variant = "outline",
  size = "md",
  className,
}) => ({React.cloneElement(icon.ReactElement, { className)}
    {label}
  
);

// File Upload Dropzone


export const FileDropzone: React.FC = ({
  onDrop,
  accept,
  multiple = false,
  maxSize,
  className,
  children,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onDrop(files);
    }
  };

  return ({children || (
        
          
          
            
              Drop files here or click to upload
            
            
              {accept && `Supported formats)}
    
  );
};

export {
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton,
  LoadingSpinner,
  LoadingOverlay,
  EmptyState,
  NoDataEmpty,
  NoSearchResultsEmpty,
  ErrorEmpty,
  NoPermissionEmpty,
  StatusIndicator,
  ProgressStepper,
  DataDisplay,
  QuickActionButton,
  FileDropzone,
};
