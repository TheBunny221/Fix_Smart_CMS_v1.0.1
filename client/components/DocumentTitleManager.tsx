/**
 * Document Title Manager Component
 * 
 * This component manages document titles and meta tags using SystemConfig values.
 * It ensures that the browser title and meta information reflect the configured
 * application name instead of hardcoded values.
 * 
 * Requirements: 6.2
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useConfigManager } from '../hooks/useConfigManager';
import { setDocumentTitle, updateMetaTags } from '../utils/documentTitle';

interface DocumentTitleManagerProps {
  children?: React.ReactNode;
}

// Page title mapping for different routes
const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/login': 'Login',
  '/register': 'Register',
  '/forgot-password': 'Forgot Password',
  '/complaints': 'Complaints',
  '/profile': 'Profile',
  '/admin/users': 'User Management',
  '/admin/config': 'System Configuration',
  '/admin/languages': 'Language Settings',
  '/reports': 'Reports',
  '/tasks': 'Tasks',
  '/ward': 'Ward Management',
  '/maintenance': 'Maintenance Tasks',
  '/guest/track': 'Track Complaint',
  '/guest/dashboard': 'Guest Dashboard',
  '/unauthorized': 'Unauthorized Access'
};

/**
 * Document Title Manager Component
 * 
 * Automatically updates document title based on current route and SystemConfig
 */
export const DocumentTitleManager: React.FC<DocumentTitleManagerProps> = ({ children }) => {
  const location = useLocation();
  const { getAppName, isInitialized } = useConfigManager();

  // Update document title when route changes or config is loaded
  useEffect(() => {
    if (!isInitialized) {
      return; // Wait for configuration to load
    }

    const currentPath = location.pathname;
    const pageTitle = PAGE_TITLES[currentPath];
    
    // Set document title using SystemConfig app name
    if (pageTitle) {
      setDocumentTitle(pageTitle);
    } else {
      // For dynamic routes, try to extract a meaningful title
      if (currentPath.startsWith('/complaints/')) {
        setDocumentTitle('Complaint Details');
      } else if (currentPath.startsWith('/tasks/')) {
        setDocumentTitle('Task Details');
      } else if (currentPath.startsWith('/admin/')) {
        setDocumentTitle('Administration');
      } else {
        // Fallback to app name only
        setDocumentTitle();
      }
    }

    // Update meta tags with SystemConfig values
    updateMetaTags();
  }, [location.pathname, isInitialized, getAppName]);

  // Initial meta tags update when configuration loads
  useEffect(() => {
    if (isInitialized) {
      updateMetaTags();
    }
  }, [isInitialized]);

  return <>{children}</>;
};

export default DocumentTitleManager;