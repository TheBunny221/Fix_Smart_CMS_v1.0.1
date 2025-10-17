/**
 * Export validation utilities
 */

export interface ExportValidationResult {
  isValid: boolean;
  message?: string;
  warnings?: string[];
}

export interface ExportPermissions {
  canExportData: boolean;
  canExportAllWards: boolean;
  canExportLargeDatasets: boolean;
  maxRecords: number;
}

/**
 * Validate export permissions based on user role and requested data
 */
export const validateExportPermissions = (
  userRole: string,
  requestedData: {
    includesOtherWards?: boolean;
    includesUnassignedComplaints?: boolean;
    recordCount?: number;
  },
): ExportValidationResult => {
  const permissions = getExportPermissions(userRole);

  if (!permissions.canExportData) {
    return {
      isValid: false,
      message: "You don't have permission to export data",
    };
  }

  if (requestedData.includesOtherWards && !permissions.canExportAllWards) {
    return {
      isValid: false,
      message: "You don't have permission to export data from other wards",
    };
  }

  if (
    requestedData.recordCount &&
    requestedData.recordCount > permissions.maxRecords
  ) {
    return {
      isValid: false,
      message: `Export size exceeds limit. Maximum ${permissions.maxRecords} records allowed for your role.`,
    };
  }

  const warnings: string[] = [];

  if (requestedData.recordCount && requestedData.recordCount > 1000) {
    warnings.push(
      "Large export detected. This may take a few moments to generate.",
    );
  }

  const result: ExportValidationResult = {
    isValid: true,
  };

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
};

/**
 * Get export permissions based on user role
 */
export const getExportPermissions = (userRole: string): ExportPermissions => {
  switch (userRole) {
    case "ADMINISTRATOR":
      return {
        canExportData: true,
        canExportAllWards: true,
        canExportLargeDatasets: true,
        maxRecords: 10000,
      };

    case "WARD_OFFICER":
      return {
        canExportData: true,
        canExportAllWards: false,
        canExportLargeDatasets: false,
        maxRecords: 2000,
      };

    case "MAINTENANCE_TEAM":
      return {
        canExportData: true,
        canExportAllWards: false,
        canExportLargeDatasets: false,
        maxRecords: 500,
      };

    case "CITIZEN":
      return {
        canExportData: false,
        canExportAllWards: false,
        canExportLargeDatasets: false,
        maxRecords: 0,
      };

    default:
      return {
        canExportData: false,
        canExportAllWards: false,
        canExportLargeDatasets: false,
        maxRecords: 0,
      };
  }
};

/**
 * Validate export filters
 */
export const validateExportFilters = (filters: {
  from?: string;
  to?: string;
  ward?: string;
  type?: string;
  status?: string;
  priority?: string;
}): ExportValidationResult => {
  const warnings: string[] = [];

  // Validate date range
  if (filters.from && filters.to) {
    const fromDate = new Date(filters.from);
    const toDate = new Date(filters.to);

    if (fromDate > toDate) {
      return {
        isValid: false,
        message: "Start date cannot be after end date",
      };
    }

    const daysDiff = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 365) {
      warnings.push(
        "Date range exceeds 1 year. Consider using smaller date ranges for better performance.",
      );
    }
  }

  // Check if any filters are applied
  const hasFilters = Object.values(filters).some(
    (value) => value && value !== "all" && value !== "",
  );

  if (!hasFilters) {
    warnings.push(
      "No filters applied. Export will include all available data.",
    );
  }

  const result: ExportValidationResult = {
    isValid: true,
  };

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
};

/**
 * Generate safe filename for exports
 */
export const generateExportFilename = (
  appName: string,
  format: string,
  filters?: {
    from?: string;
    to?: string;
    ward?: string;
    type?: string;
  },
): string => {
  const safeAppName = appName.replace(/[^a-zA-Z0-9]/g, "-");
  const timestamp = new Date().toISOString().split("T")[0];

  let filename = `${safeAppName}-Report-${timestamp}`;

  // Add filter context to filename
  if (filters?.from && filters?.to) {
    filename += `-${filters.from}-to-${filters.to}`;
  }

  if (filters?.ward && filters.ward !== "all") {
    filename += `-Ward-${filters.ward}`;
  }

  if (filters?.type && filters.type !== "all") {
    filename += `-${filters.type}`;
  }

  // Add extension
  const extensions: Record<string, string> = {
    csv: ".csv",
    pdf: ".pdf",
    excel: ".xlsx",
    json: ".json",
  };

  filename += extensions[format] || ".txt";

  return filename;
};
