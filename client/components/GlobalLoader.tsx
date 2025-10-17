import React from "react";
import { useAppSelector } from "../store/hooks";
import { selectIsLoading, selectLoadingText } from "../store/slices/uiSlice";
import { Loader2 } from "lucide-react";

interface GlobalLoaderProps {
  className?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ className = "" }) => {
  const isLoading = useAppSelector(selectIsLoading);
  const loadingText = useAppSelector(selectLoadingText);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm ${className}`}
      role="status"
      aria-live="polite"
      aria-label={loadingText || "Loading"}
    >
      <div className="flex flex-col items-center space-y-4 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {loadingText || "Loading..."}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Please wait
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;