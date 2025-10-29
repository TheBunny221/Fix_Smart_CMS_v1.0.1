/**
 * I18n Audit Infrastructure
 * Comprehensive system for auditing internationalization coverage across the application
 */

const fs = require('fs');
const path = require('path');

/**
 * Role-based route and component mapping system
 * Maps user roles to accessible routes and components
 */
class RoleBasedComponentMapper {
  constructor() {
    this.roleRouteMapping = {
      ADMINISTRATOR: {
        routes: [
          '/dashboard',
          '/admin/users',
          '/admin/config', 
          '/admin/languages',
          '/reports',
          '/complaints',
          '/complaints/:id',
          '/profile'
        ],
        components: [
          'AdminDashboard',
          'AdminUsers',
          'AdminConfig',
          'AdminLanguages',
          'UnifiedReports',
          'ComplaintsList',
          'ComplaintDetails',
          'Profile'
        ],
        accessLevel: 'full'
      },
      WARD_OFFICER: {
        routes: [
          '/dashboard',
          '/tasks',
          '/ward',
          '/reports',
          '/complaints',
          '/complaints/:id',
          '/profile'
        ],
        components: [
          'WardOfficerDashboard',
          'WardTasks',
          'WardManagement',
          'UnifiedReports',
          'ComplaintsList',
          'ComplaintDetails',
          'Profile'
        ],
        accessLevel: 'ward_scoped'
      },
      MAINTENANCE_TEAM: {
        routes: [
          '/dashboard',
          '/maintenance',
          '/tasks/:id',
          '/reports',
          '/complaints',
          '/complaints/:id',
          '/profile'
        ],
        components: [
          'MaintenanceDashboard',
          'MaintenanceTasks',
          'TaskDetails',
          'UnifiedReports',
          'ComplaintsList',
          'ComplaintDetails',
          'Profile'
        ],
        accessLevel: 'task_scoped'
      },
      CITIZEN: {
        routes: [
          '/dashboard',
          '/complaints',
          '/complaints/:id',
          '/profile'
        ],
        components: [
          'CitizenDashboard',
          'ComplaintsList',
          'ComplaintDetails',
          'Profile',
          'QuickComplaintForm'
        ],
        accessLevel: 'user_scoped'
      },
      GUEST: {
        routes: [
          '/',
          '/login',
          '/register',
          '/forgot-password',
          '/set-password/:token',
          '/guest/track',
          '/guest/dashboard'
        ],
        components: [
          'Index',
          'Login',
          'Register',
          'ForgotPassword',
          'SetPassword',
          'GuestTrackComplaint',
          'GuestDashboard',
          'QuickComplaintForm',
          'QuickTrackForm'
        ],
        accessLevel: 'public'
      }
    };

    this.sharedComponents = [
      'Navigation',
      'UnifiedLayout',
      'RoleBasedRoute',
      'ComplaintsListWidget',
      'ContactInfoCard',
      'ErrorBoundary',
      'GlobalLoader',
      'GlobalMessageHandler'
    ];
  }

  /**
   * Get accessible routes for a specific role
   */
  getRoutesForRole(role) {
    return this.roleRouteMapping[role]?.routes || [];
  }

  /**
   * Get accessible components for a specific role
   */
  getComponentsForRole(role) {
    const roleComponents = this.roleRouteMapping[role]?.components || [];
    return [...roleComponents, ...this.sharedComponents];
  }

  /**
   * Get all roles that can access a specific route
   */
  getRolesForRoute(route) {
    const roles = [];
    for (const [role, config] of Object.entries(this.roleRouteMapping)) {
      if (config.routes.includes(route)) {
        roles.push(role);
      }
    }
    return roles;
  }

  /**
   * Get all roles that can access a specific component
   */
  getRolesForComponent(componentName) {
    const roles = [];
    
    // Check shared components
    if (this.sharedComponents.includes(componentName)) {
      return Object.keys(this.roleRouteMapping);
    }

    // Check role-specific components
    for (const [role, config] of Object.entries(this.roleRouteMapping)) {
      if (config.components.includes(componentName)) {
        roles.push(role);
      }
    }
    return roles;
  }

  /**
   * Generate complete role-component mapping matrix
   */
  generateRoleComponentMatrix() {
    const matrix = {};
    
    for (const role of Object.keys(this.roleRouteMapping)) {
      matrix[role] = {
        routes: this.getRoutesForRole(role),
        components: this.getComponentsForRole(role),
        accessLevel: this.roleRouteMapping[role].accessLevel
      };
    }
    
    return matrix;
  }

  /**
   * Export role mapping to JSON file
   */
  exportRoleMapping(outputPath) {
    const matrix = this.generateRoleComponentMatrix();
    const exportData = {
      timestamp: new Date().toISOString(),
      roleComponentMatrix: matrix,
      sharedComponents: this.sharedComponents,
      totalRoles: Object.keys(this.roleRouteMapping).length,
      totalUniqueComponents: new Set([
        ...Object.values(this.roleRouteMapping).flatMap(config => config.components),
        ...this.sharedComponents
      ]).size
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    return exportData;
  }
}

module.exports = {
  RoleBasedComponentMapper
};