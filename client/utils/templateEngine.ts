/**
 * Lightweight template engine for report generation
 * Supports Mustache-like syntax with {{variable}} and {{#section}} blocks
 */

export interface TemplateData {
  [key: string]: any;
}

export interface TemplateOptions {
  escapeHtml?: boolean;
  allowUnsafeHtml?: boolean;
}

/**
 * Simple template engine with Mustache-like syntax
 */
export class TemplateEngine {
  private static instance: TemplateEngine;
  private templateCache: Map<string, string> = new Map();

  static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine();
    }
    return TemplateEngine.instance;
  }

  /**
   * Load template from file path or URL
   */
  async loadTemplate(templatePath: string): Promise<string> {
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    try {
      // Try multiple paths for template loading
      const possiblePaths = [
        templatePath,
        templatePath.startsWith('/') ? templatePath : `/${templatePath}`,
        templatePath.startsWith('/public') ? templatePath : `/public${templatePath}`,
        templatePath.replace('/templates/', '/public/templates/')
      ];

      let template: string | null = null;
      let lastError: Error | null = null;

      for (const path of possiblePaths) {
        try {
          console.log(`🔍 Attempting to load template from: ${path}`);
          const response = await fetch(path);
          if (response.ok) {
            template = await response.text();
            console.log(`✅ Successfully loaded template from: ${path}`);
            break;
          } else {
            console.warn(`❌ Failed to load from ${path}: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          lastError = fetchError as Error;
          console.warn(`❌ Fetch error for ${path}:`, fetchError);
        }
      }

      if (!template) {
        throw new Error(`Template not found at any of the attempted paths: ${possiblePaths.join(', ')}. Last error: ${lastError?.message}`);
      }
      
      this.templateCache.set(templatePath, template);
      return template;
    } catch (error) {
      console.error(`Error loading template ${templatePath}:`, error);
      throw new Error(`Template not found: ${templatePath}`);
    }
  }

  /**
   * Render template with data
   */
  render(template: string, data: TemplateData, options: TemplateOptions = {}): string {
    const { escapeHtml = true } = options;
    
    let rendered = template;

    // Handle conditional sections {{#key}}...{{/key}}
    rendered = this.renderSections(rendered, data);

    // Handle simple variable substitution {{key}}
    rendered = this.renderVariables(rendered, data, escapeHtml);

    return rendered;
  }

  /**
   * Render conditional sections
   */
  private renderSections(template: string, data: TemplateData): string {
    const sectionRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    
    return template.replace(sectionRegex, (match, key, content) => {
      const value = this.getNestedValue(data, key);
      
      if (!value) {
        return '';
      }
      
      if (Array.isArray(value)) {
        return value.map(item => this.render(content, { ...data, ...item })).join('');
      }
      
      if (typeof value === 'object') {
        return this.render(content, { ...data, ...value });
      }
      
      // Truthy value, render content once
      return value ? this.render(content, data) : '';
    });
  }

  /**
   * Render simple variables
   */
  private renderVariables(template: string, data: TemplateData, escapeHtml: boolean): string {
    const variableRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    
    return template.replace(variableRegex, (match, key) => {
      const value = this.getNestedValue(data, key);
      
      if (value === null || value === undefined) {
        return '';
      }
      
      const stringValue = String(value);
      return escapeHtml ? this.escapeHtml(stringValue) : stringValue;
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Preload templates for better performance
   */
  async preloadTemplates(templatePaths: string[]): Promise<void> {
    const loadPromises = templatePaths.map(path => this.loadTemplate(path));
    await Promise.all(loadPromises);
  }
}

/**
 * Template registry for managing available templates
 */
export class TemplateRegistry {
  private static templates: Map<string, { name: string; path: string; description: string }> = new Map();

  static registerTemplate(id: string, name: string, path: string, description: string): void {
    this.templates.set(id, { name, path, description });
  }

  static getTemplate(id: string): { name: string; path: string; description: string } | undefined {
    return this.templates.get(id);
  }

  static getAllTemplates(): Array<{ id: string; name: string; path: string; description: string }> {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      ...template
    }));
  }

  static getTemplatePath(id: string): string | undefined {
    const template = this.templates.get(id);
    return template?.path;
  }
}

// Register default templates with correct paths
TemplateRegistry.registerTemplate(
  'unified',
  'Unified Report',
  '/templates/export/unifiedReport.html',
  'Comprehensive analytics and performance report with summary cards, trends, and detailed breakdowns'
);

TemplateRegistry.registerTemplate(
  'analytics',
  'Analytics Report',
  '/templates/export/analyticsReport.html',
  'Advanced analytics report focusing on performance metrics, trends analysis, and period comparisons'
);

TemplateRegistry.registerTemplate(
  'complaints-list',
  'Complaints List',
  '/templates/export/complaintsListReport.html',
  'Detailed listing of complaints with filters, status information, and summary statistics'
);

/**
 * Utility functions for template data preparation
 */
export const TemplateUtils = {
  /**
   * Format date for template display
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Format datetime for template display
   */
  formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Convert status to CSS class name
   */
  statusToClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  },

  /**
   * Convert priority to CSS class name
   */
  priorityToClass(priority: string): string {
    return priority.toLowerCase();
  },

  /**
   * Prepare complaint data for template
   */
  prepareComplaintData(complaint: any): any {
    return {
      ...complaint,
      submittedOnFormatted: complaint.submittedOn ? this.formatDate(complaint.submittedOn) : 'N/A',
      resolvedOnFormatted: complaint.resolvedOn ? this.formatDate(complaint.resolvedOn) : 'N/A',
      statusClass: this.statusToClass(complaint.status || ''),
      priorityClass: this.priorityToClass(complaint.priority || 'medium'),
      citizenName: complaint.submittedBy?.fullName || complaint.citizenName || 'Anonymous',
      typeName: complaint.complaintType?.name || complaint.type || 'General'
    };
  },

  /**
   * Calculate summary statistics from complaints data
   */
  calculateSummary(complaints: any[]): any {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const pending = complaints.filter(c => ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
    const overdue = complaints.filter(c => c.deadline && new Date() > new Date(c.deadline)).length;
    
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    // Calculate average resolution time
    const resolvedComplaints = complaints.filter(c => c.resolvedOn && c.submittedOn);
    const avgResolutionTime = resolvedComplaints.length > 0 
      ? Math.round(resolvedComplaints.reduce((sum, c) => {
          const days = Math.ceil((new Date(c.resolvedOn).getTime() - new Date(c.submittedOn).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / resolvedComplaints.length)
      : 0;

    return {
      total,
      resolved,
      pending,
      overdue,
      resolutionRate,
      avgResolutionTime
    };
  }
};