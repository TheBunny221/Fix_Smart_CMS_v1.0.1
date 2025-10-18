/**
 * Export utilities - revamped version
 * This file provides compatibility for imports that reference the old exportUtilsRevamped
 * The actual implementation has been moved to exportUtils.ts
 */

// Re-export from the main export utilities
export { 
  validateExportPermissions,
  exportComplaints,
  exportToPDF,
  exportToExcel,
  exportToCSV
} from './exportUtils';

// Re-export from report error handler
export { validateExportRequest } from './reportErrorHandler';