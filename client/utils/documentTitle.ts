/**
 * Document Title Management Utility
 * 
 * This utility manages document titles using SystemConfig values
 * instead of hardcoded strings, ensuring consistency across the application.
 * 
 * Requirements: 6.2
 */

import { configManager } from '../lib/ConfigManager';

/**
 * Set document title using SystemConfig app name
 */
export const setDocumentTitle = (pageTitle?: string): void => {
  const appName = configManager.getAppName();
  
  if (pageTitle) {
    document.title = `${pageTitle} - ${appName}`;
  } else {
    document.title = appName;
  }
};

/**
 * Set document title with custom format
 */
export const setCustomDocumentTitle = (title: string): void => {
  document.title = title;
};

/**
 * Get formatted title for a page
 */
export const getFormattedTitle = (pageTitle?: string): string => {
  const appName = configManager.getAppName();
  
  if (pageTitle) {
    return `${pageTitle} - ${appName}`;
  }
  
  return appName;
};

/**
 * React hook for managing document title with SystemConfig
 */
export const useDocumentTitle = (pageTitle?: string): void => {
  // This will be implemented as a React hook
  // For now, we'll use the direct function calls in components
  if (typeof document !== 'undefined') {
    setDocumentTitle(pageTitle);
  }
};

/**
 * Update meta tags with SystemConfig values
 */
export const updateMetaTags = (): void => {
  const appName = configManager.getAppName();
  
  // Update meta title
  const metaTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
  if (metaTitle) {
    metaTitle.content = appName;
  }
  
  // Update meta description with app name
  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (metaDescription && metaDescription.content.includes('Complaint Management System')) {
    metaDescription.content = metaDescription.content.replace(
      'Complaint Management System',
      appName
    );
  }
  
  // Update application name meta tag
  const metaAppName = document.querySelector('meta[name="application-name"]') as HTMLMetaElement;
  if (metaAppName) {
    metaAppName.content = appName;
  }
};

export default {
  setDocumentTitle,
  setCustomDocumentTitle,
  getFormattedTitle,
  useDocumentTitle,
  updateMetaTags
};