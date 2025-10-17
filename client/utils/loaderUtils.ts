import { Dispatch } from "@reduxjs/toolkit";
import { setLoading } from "../store/slices/uiSlice";

export interface LoaderOptions {
  silent?: boolean;
  text?: string;
}

/**
 * Wrapper for async operations that automatically handles global loading state
 */
export const withGlobalLoader = async <T>(
  dispatch: Dispatch,
  asyncOperation: () => Promise<T>,
  options: LoaderOptions = {}
): Promise<T> => {
  const { silent = false, text } = options;

  try {
    if (!silent) {
      dispatch(setLoading({ isLoading: true, text }));
    }
    
    const result = await asyncOperation();
    return result;
  } finally {
    if (!silent) {
      dispatch(setLoading({ isLoading: false }));
    }
  }
};

/**
 * Debounced loader to prevent flicker when multiple API calls occur rapidly
 */
let loaderTimeout: NodeJS.Timeout | null = null;

export const withDebouncedLoader = async <T>(
  dispatch: Dispatch,
  asyncOperation: () => Promise<T>,
  options: LoaderOptions & { debounceMs?: number } = {}
): Promise<T> => {
  const { silent = false, text, debounceMs = 100 } = options;

  try {
    if (!silent) {
      // Clear any existing timeout
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
      }
      
      // Set loading with debounce
      loaderTimeout = setTimeout(() => {
        dispatch(setLoading({ isLoading: true, text }));
      }, debounceMs);
    }
    
    const result = await asyncOperation();
    return result;
  } finally {
    if (!silent) {
      // Clear timeout and hide loader
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
        loaderTimeout = null;
      }
      dispatch(setLoading({ isLoading: false }));
    }
  }
};

/**
 * Higher-order function to wrap RTK Query mutations with global loader
 */
export const withMutationLoader = <TArgs, TResult>(
  mutation: (args: TArgs) => Promise<{ unwrap: () => Promise<TResult> }>,
  dispatch: Dispatch,
  options: LoaderOptions = {}
) => {
  return async (args: TArgs): Promise<TResult> => {
    return withGlobalLoader(
      dispatch,
      async () => {
        const result = await mutation(args);
        return result.unwrap();
      },
      options
    );
  };
};

/**
 * Utility to show loader for specific operations
 */
export const showLoader = (dispatch: Dispatch, text?: string) => {
  dispatch(setLoading({ isLoading: true, text }));
};

export const hideLoader = (dispatch: Dispatch) => {
  dispatch(setLoading({ isLoading: false }));
};

/**
 * Hook-like utility for components using RTK Query
 */
export const useLoaderForQuery = (
  dispatch: Dispatch,
  isLoading: boolean,
  isFetching: boolean,
  text?: string
) => {
  React.useEffect(() => {
    if (isLoading || isFetching) {
      dispatch(setLoading({ isLoading: true, text }));
    } else {
      dispatch(setLoading({ isLoading: false }));
    }
  }, [dispatch, isLoading, isFetching, text]);
};

// Import React for the hook
import React from "react";