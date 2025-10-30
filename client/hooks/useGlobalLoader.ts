import { useCallback } from "react";
import { useAppDispatch } from "../store/hooks";
import { setLoading } from "../store/slices/uiSlice";
import { withGlobalLoader, withDebouncedLoader, LoaderOptions } from "../utils/loaderUtils";

/**
 * Custom hook for managing global loading state
 */
export const useGlobalLoader = () => {
  const dispatch = useAppDispatch();

  const showLoader = useCallback((text?: string) => {
    dispatch(setLoading({ isLoading: true, ...(text && { text }) }));
  }, [dispatch]);

  const hideLoader = useCallback(() => {
    dispatch(setLoading({ isLoading: false }));
  }, [dispatch]);

  const withLoader = useCallback(
    async <T>(
      asyncOperation: () => Promise<T>,
      options: LoaderOptions = {}
    ): Promise<T> => {
      return withGlobalLoader(dispatch, asyncOperation, options);
    },
    [dispatch]
  );

  const withDebouncedLoaderHook = useCallback(
    async <T>(
      asyncOperation: () => Promise<T>,
      options: LoaderOptions & { debounceMs?: number } = {}
    ): Promise<T> => {
      return withDebouncedLoader(dispatch, asyncOperation, options);
    },
    [dispatch]
  );

  return {
    showLoader,
    hideLoader,
    withLoader,
    withDebouncedLoader: withDebouncedLoaderHook,
  };
};

/**
 * Hook to automatically manage loading state for RTK Query operations
 */
export const useQueryLoader = (
  isLoading: boolean,
  isFetching?: boolean,
  text?: string
) => {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    const loading = isLoading || (isFetching ?? false);
    dispatch(setLoading({ 
      isLoading: loading, 
      ...(loading && text && { text })
    }));
  }, [dispatch, isLoading, isFetching, text]);
};

// Import React for useEffect
import React from "react";