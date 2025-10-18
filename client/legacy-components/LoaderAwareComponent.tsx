import React from "react";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { useAppDispatch } from "../store/hooks";

/**
 * Higher-order component that provides loader utilities to wrapped components
 */
export function withLoaderSupport<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function LoaderAwareComponent(props: P) {
    const { showLoader, hideLoader, withLoader, withDebouncedLoader } = useGlobalLoader();
    
    const enhancedProps = {
      ...props,
      showLoader,
      hideLoader,
      withLoader,
      withDebouncedLoader,
    } as P & {
      showLoader: (text?: string) => void;
      hideLoader: () => void;
      withLoader: <T>(operation: () => Promise<T>, options?: { silent?: boolean; text?: string }) => Promise<T>;
      withDebouncedLoader: <T>(operation: () => Promise<T>, options?: { silent?: boolean; text?: string; debounceMs?: number }) => Promise<T>;
    };

    return <WrappedComponent {...enhancedProps} />;
  };
}

/**
 * Hook for RTK Query components to automatically manage loading states
 */
export const useRTKQueryLoader = (
  queryResult: { isLoading?: boolean; isFetching?: boolean },
  text?: string
) => {
  const dispatch = useAppDispatch();
  
  React.useEffect(() => {
    const loading = queryResult.isLoading || queryResult.isFetching || false;
    
    if (loading && text) {
      dispatch({ type: 'ui/setLoading', payload: { isLoading: true, text } });
    } else if (!loading) {
      dispatch({ type: 'ui/setLoading', payload: { isLoading: false } });
    }
  }, [dispatch, queryResult.isLoading, queryResult.isFetching, text]);
};