/**
 * Vite Cache Helper - Utilities for handling Vite dependency cache issues
 */

/**
 * Safely import a module with Vite cache error handling
 */
export const safeImport = async <T = any>(moduleName: string): Promise<T> => {
  try {
    return await import(moduleName);
  } catch (error) {
    console.warn(`Failed to import ${moduleName}:`, error);
    
    // Check if it's a Vite cache issue
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`${moduleName} library failed to load due to cache issue. Please refresh the page (Ctrl+F5) and try again.`);
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Check if we're in development mode with Vite
 */
export const isViteDev = (): boolean => {
  return import.meta.env.DEV && typeof import.meta.hot !== 'undefined';
};

/**
 * Display user-friendly error message for Vite cache issues
 */
export const handleViteCacheError = (error: Error, libraryName: string): Error => {
  if (error.message.includes('Failed to fetch') || 
      error.message.includes('504') || 
      error.message.includes('Failed to resolve module specifier')) {
    return new Error(
      `${libraryName} failed to load due to development cache issue.\n\n` +
      `🔧 Quick Fix:\n` +
      `1. Refresh page (Ctrl+F5)\n` +
      `2. Or restart dev server: rm -rf node_modules/.vite && npm run dev\n` +
      `3. Or add ?__vite__force=true to URL\n\n` +
      `💡 CSV export always works as alternative!`
    );
  }
  
  return error;
};

/**
 * Show instructions for clearing Vite cache
 */
export const showViteCacheInstructions = (): void => {
  if (isViteDev()) {
    console.group('🔧 Vite Cache Issue Detected - Export Library Failed to Load');
    console.log('📋 Quick Fixes (try in order):');
    console.log('1. 🔄 Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
    console.log('2. 🌐 Force reload: Add ?__vite__force=true to your URL');
    console.log('3. 🛠️  Clear cache: Stop server → rm -rf node_modules/.vite → npm run dev');
    console.log('4. 📄 Alternative: Use CSV export (always works!)');
    console.log('');
    console.log('💡 This is a development-only issue. Production builds work fine.');
    console.groupEnd();
  }
};