/**
 * Role-based page mapping system for UI localization audit
 */

export type UserRole = 'CITIZEN' | 'WARD_OFFICER' | 'MAINTENANCE_TEAM' | 'ADMINISTRATOR' | 'GUEST';

export interface RouteMapping {
  path: string;
  component: string;
  accessibleRoles: UserRole[];
  textElements: TextElement[];
}

export interface TextElement {
  type: 'button' | 'label' | 'heading' | 'message' | 'tooltip' | 'notification' | 'text';
  content: string;
  location: string;
  isTranslated: boolean;
  translationKey?: string;
}

export interface RoleComponentMapping {
  role: UserRole;
  accessibleRoutes: RouteMapping[];
  components: string[];
}

export interface RoleAuditMatrix {
  [role: string]: {
    pages: string[];
    components: string[];
    translationCoverage: number;
    untranslatedElements: number;
  };
}

/**
 * Maps routes to their accessible roles based on App.tsx routing configuration
 */
export const ROUTE_ROLE_MAPPING: Record<string, UserRole[]> = {
  // Public routes
  '/': ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR', 'GUEST'],
  '/login': ['GUEST'],
  '/register': ['GUEST'],
  '/forgot-password': ['GUEST'],
  '/set-password': ['GUEST'],
  '/set-password/:token': ['GUEST'],
  '/guest/track': ['GUEST'],
  '/guest/dashboard': ['GUEST'],
  '/unauthorized': ['GUEST'],

  // Dashboard routes
  '/dashboard': ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR'],

  // Complaint routes
  '/complaints': ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR'],
  '/complaints/:id': ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR'],
  '/complaint/:id': ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR'],

  // Ward Officer specific routes
  '/tasks': ['WARD_OFFICER'],
  '/ward': ['WARD_OFFICER'],

  // Maintenance Team specific routes
  '/maintenance': ['MAINTENANCE_TEAM'],
  '/tasks/:id': ['MAINTENANCE_TEAM'],

  // Reports (multiple roles)
  '/reports': ['WARD_OFFICER', 'ADMINISTRATOR', 'MAINTENANCE_TEAM'],

  // Admin specific routes
  '/admin/users': ['ADMINISTRATOR'],
  '/admin/config': ['ADMINISTRATOR'],
  '/admin/languages': ['ADMINISTRATOR'],

  // Profile and Settings (all authenticated users)
  '/profile': ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR'],
};

/**
 * Maps page components to their file paths
 */
export const PAGE_COMPONENT_MAPPING: Record<string, string> = {
  'Index': 'client/pages/Index.tsx',
  'Login': 'client/pages/Login.tsx',
  'Register': 'client/pages/Register.tsx',
  'ForgotPassword': 'client/pages/ForgotPassword.tsx',
  'SetPassword': 'client/pages/SetPassword.tsx',
  'Profile': 'client/pages/Profile.tsx',
  'Unauthorized': 'client/pages/Unauthorized.tsx',
  'ComplaintsList': 'client/pages/ComplaintsList.tsx',
  'ComplaintDetails': 'client/pages/ComplaintDetails.tsx',
  'GuestTrackComplaint': 'client/pages/GuestTrackComplaint.tsx',
  'GuestDashboard': 'client/pages/GuestDashboard.tsx',
  'WardTasks': 'client/pages/WardTasks.tsx',
  'WardManagement': 'client/pages/WardManagement.tsx',
  'MaintenanceTasks': 'client/pages/MaintenanceTasks.tsx',
  'TaskDetails': 'client/pages/TaskDetails.tsx',
  'AdminUsers': 'client/pages/AdminUsers.tsx',
  'UnifiedReports': 'client/pages/UnifiedReports.tsx',
  'AdminConfig': 'client/pages/AdminConfig.tsx',
  'AdminLanguages': 'client/pages/AdminLanguages.tsx',
  'Messages': 'client/pages/Messages.tsx',
  'RoleBasedDashboard': 'client/components/RoleBasedDashboard.tsx',
};

/**
 * Role-based page mapper class
 */
export class RoleBasedPageMapper {
  /**
   * Get all routes accessible to a specific role
   */
  mapAccessibleRoutes(role: UserRole): RouteMapping[] {
    const accessibleRoutes: RouteMapping[] = [];

    for (const [path, roles] of Object.entries(ROUTE_ROLE_MAPPING)) {
      if (roles.includes(role)) {
        accessibleRoutes.push({
          path,
          component: this.getComponentForRoute(path),
          accessibleRoles: roles,
          textElements: [], // Will be populated by component scanner
        });
      }
    }

    return accessibleRoutes;
  }

  /**
   * Identify role-specific components and their mappings
   */
  identifyRoleSpecificComponents(): RoleComponentMapping[] {
    const roleMappings: RoleComponentMapping[] = [];
    const roles: UserRole[] = ['CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR', 'GUEST'];

    for (const role of roles) {
      const accessibleRoutes = this.mapAccessibleRoutes(role);
      const components = accessibleRoutes.map(route => route.component);

      roleMappings.push({
        role,
        accessibleRoutes,
        components: [...new Set(components)], // Remove duplicates
      });
    }

    return roleMappings;
  }

  /**
   * Generate role audit matrix for translation coverage analysis
   */
  generateRoleAuditMatrix(): RoleAuditMatrix {
    const matrix: RoleAuditMatrix = {};
    const roleMappings = this.identifyRoleSpecificComponents();

    for (const mapping of roleMappings) {
      matrix[mapping.role] = {
        pages: mapping.accessibleRoutes.map(route => route.path),
        components: mapping.components,
        translationCoverage: 0, // Will be calculated by audit engine
        untranslatedElements: 0, // Will be calculated by audit engine
      };
    }

    return matrix;
  }

  /**
   * Get component name for a given route path
   */
  private getComponentForRoute(path: string): string {
    // Map specific routes to their components
    const routeComponentMap: Record<string, string> = {
      '/': 'Index',
      '/login': 'Login',
      '/register': 'Register',
      '/forgot-password': 'ForgotPassword',
      '/set-password': 'SetPassword',
      '/set-password/:token': 'SetPassword',
      '/profile': 'Profile',
      '/unauthorized': 'Unauthorized',
      '/dashboard': 'RoleBasedDashboard',
      '/complaints': 'ComplaintsList',
      '/complaints/:id': 'ComplaintDetails',
      '/complaint/:id': 'ComplaintDetails',
      '/guest/track': 'GuestTrackComplaint',
      '/guest/dashboard': 'GuestDashboard',
      '/tasks': 'WardTasks',
      '/ward': 'WardManagement',
      '/maintenance': 'MaintenanceTasks',
      '/tasks/:id': 'TaskDetails',
      '/reports': 'UnifiedReports',
      '/admin/users': 'AdminUsers',
      '/admin/config': 'AdminConfig',
      '/admin/languages': 'AdminLanguages',
    };

    return routeComponentMap[path] || 'Unknown';
  }

  /**
   * Get all unique page components across all roles
   */
  getAllPageComponents(): string[] {
    const allComponents = new Set<string>();
    
    for (const componentPath of Object.values(PAGE_COMPONENT_MAPPING)) {
      allComponents.add(componentPath);
    }

    return Array.from(allComponents);
  }

  /**
   * Get role-specific dashboard components
   */
  getRoleSpecificDashboards(): Record<UserRole, string[]> {
    return {
      CITIZEN: ['client/pages/CitizenDashboard.tsx'],
      WARD_OFFICER: ['client/pages/WardOfficerDashboard.tsx'],
      MAINTENANCE_TEAM: ['client/pages/MaintenanceDashboard.tsx'],
      ADMINISTRATOR: ['client/pages/AdminDashboard.tsx'],
      GUEST: ['client/pages/GuestDashboard.tsx'],
    };
  }
}