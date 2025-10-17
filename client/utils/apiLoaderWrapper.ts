import { BaseQueryFn, EndpointBuilder } from "@reduxjs/toolkit/query";
import { setLoading } from "../store/slices/uiSlice";

/**
 * Enhanced endpoint builder that automatically handles global loading states
 */
export const createEndpointWithLoader = <
  Args,
  Result,
  BaseQuery extends BaseQueryFn
>(
  build: EndpointBuilder<BaseQuery, string, string>,
  config: {
    query: (args: Args) => any;
    transformResponse?: (response: any) => Result;
    providesTags?: any;
    invalidatesTags?: any;
    onQueryStarted?: (args: Args, api: any) => Promise<void> | void;
    loadingText?: string;
    silent?: boolean;
  }
) => {
  const originalOnQueryStarted = config.onQueryStarted;
  
  return build.query<Result, Args>({
    ...config,
    async onQueryStarted(args, api) {
      // Show loader unless silent
      if (!config.silent) {
        api.dispatch(setLoading({ 
          isLoading: true, 
          text: config.loadingText 
        }));
      }

      try {
        // Call original onQueryStarted if provided
        if (originalOnQueryStarted) {
          await originalOnQueryStarted(args, api);
        }
        
        // Wait for the query to complete
        await api.queryFulfilled;
      } catch (error) {
        // Handle error if needed
        console.error("Query failed:", error);
      } finally {
        // Hide loader unless silent
        if (!config.silent) {
          api.dispatch(setLoading({ isLoading: false }));
        }
      }
    },
  });
};

/**
 * Enhanced mutation builder that automatically handles global loading states
 */
export const createMutationWithLoader = <
  Args,
  Result,
  BaseQuery extends BaseQueryFn
>(
  build: EndpointBuilder<BaseQuery, string, string>,
  config: {
    query: (args: Args) => any;
    transformResponse?: (response: any) => Result;
    invalidatesTags?: any;
    onQueryStarted?: (args: Args, api: any) => Promise<void> | void;
    loadingText?: string;
    silent?: boolean;
  }
) => {
  const originalOnQueryStarted = config.onQueryStarted;
  
  return build.mutation<Result, Args>({
    ...config,
    async onQueryStarted(args, api) {
      // Show loader unless silent
      if (!config.silent) {
        api.dispatch(setLoading({ 
          isLoading: true, 
          text: config.loadingText 
        }));
      }

      try {
        // Call original onQueryStarted if provided
        if (originalOnQueryStarted) {
          await originalOnQueryStarted(args, api);
        }
        
        // Wait for the mutation to complete
        await api.queryFulfilled;
      } catch (error) {
        // Handle error if needed
        console.error("Mutation failed:", error);
      } finally {
        // Hide loader unless silent
        if (!config.silent) {
          api.dispatch(setLoading({ isLoading: false }));
        }
      }
    },
  });
};

/**
 * Utility to wrap existing RTK Query hooks with automatic loading
 */
export const withAutoLoader = <T extends (...args: any[]) => any>(
  hook: T,
  loadingText?: string
): T => {
  return ((...args: Parameters<T>) => {
    const result = hook(...args);
    
    // For queries, we can use the built-in loading states
    if (result && typeof result === 'object' && 'isLoading' in result) {
      // The GlobalLoader will automatically show based on the centralized state
      // Individual components can still access isLoading for local UI updates
    }
    
    return result;
  }) as T;
};