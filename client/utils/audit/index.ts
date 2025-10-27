/**
 * Audit utilities index file
 * Exports all audit-related classes and interfaces
 */

// Role mapping exports
export {
  RoleBasedPageMapper,
  ROUTE_ROLE_MAPPING,
  PAGE_COMPONENT_MAPPING,
  type UserRole,
  type RouteMapping,
  type TextElement,
  type RoleComponentMapping,
  type RoleAuditMatrix,
} from './roleMapping';

// Component scanner exports
export {
  ComponentScanner,
  type ComponentScanResult,
  type HardcodedString,
  type TranslationKeyUsage,
  type ScanOptions,
} from './componentScanner';

// Audit engine exports
export {
  TranslationAuditEngine,
  type AuditReport,
  type AuditSummary,
  type RoleAuditResult,
  type PageAuditResult,
  type TranslationStatus,
  type Issue,
  type TranslationCoverage,
  type ConfigurationAnalysis,
  type IssueReport,
} from './auditEngine';

// Utility functions
export const createAuditEngine = () => new TranslationAuditEngine();
export const createRoleMapper = () => new RoleBasedPageMapper();
export const createComponentScanner = () => new ComponentScanner();

// Constants
export const SUPPORTED_LANGUAGES = ['en', 'hi', 'ml'] as const;
export const TRANSLATION_FILE_PATHS = {
  en: 'client/store/resources/en.json',
  hi: 'client/store/resources/hi.json',
  ml: 'client/store/resources/ml.json',
} as const;

export const USER_ROLES = [
  'CITIZEN',
  'WARD_OFFICER', 
  'MAINTENANCE_TEAM',
  'ADMINISTRATOR',
  'GUEST'
] as const;

// Audit configuration
export const DEFAULT_AUDIT_CONFIG = {
  includeComments: false,
  includeConsoleLog: false,
  minStringLength: 2,
  excludePatterns: [
    /^[a-zA-Z0-9_-]+$/, // Single words
    /^\d+$/, // Numbers only
    /^(true|false|null|undefined)$/, // Literals
  ],
} as const;