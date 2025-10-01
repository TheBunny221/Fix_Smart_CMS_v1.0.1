import { useContext } from 'react';
/**
 * Safe context hook that provides fallback values and better error handling
 */
export function useSafeContext(context, contextName, fallbackValue) {
    const contextValue = useContext(context);
    if (contextValue === undefined || contextValue === null) {
        if (fallbackValue !== undefined) {
            console.warn(`${contextName} context is not available, using fallback value`);
            return fallbackValue;
        }
        throw new Error(`${contextName} must be used within its corresponding Provider. ` +
            `Make sure the component is wrapped with the ${contextName}Provider.`);
    }
    return contextValue;
}
/**
 * Safe context hook with optional chaining support
 */
export function useSafeOptionalContext(context, contextName, fallbackValue) {
    const contextValue = useContext(context);
    if (contextValue === undefined || contextValue === null) {
        console.warn(`${contextName} context is not available, using fallback value`);
        return fallbackValue;
    }
    return contextValue;
}
/**
 * Hook to check if a context is available
 */
export function useIsContextAvailable(context) {
    const contextValue = useContext(context);
    return contextValue !== undefined && contextValue !== null;
}
