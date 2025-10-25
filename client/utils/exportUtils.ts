/**
 * Unified Export System
 * Supports PDF, Excel, and CSV exports with complete complaint details
 * Frontend-only implementation with RBAC integration
 */

import { showViteCacheInstructions, handleViteCacheError } from './viteCacheHelper';

// Export data interface
interface ComplaintData {
  id: string;
  complaintId?: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  ward?: { name: string };
  submittedOn: string;
  resolvedOn?: string;
  assignedOn?: string;
  closedOn?: string;
  assignedTo?: { fullName: string };
  submittedBy?: { fullName: string };
  citizenName?: string;
  contactPhone?: string;
  contactEmail?: string;
  location?: string;
  landmark?: string;
  deadline?: string;
  complaintType?: { name: string };
  feedback?: {
    rating?: number;
    comment?: string;
  };
  attachments?: Array<{ name: string; url: string }>;
}

// Enhanced analytics data interface
interface EnhancedAnalyticsData {
  summary: {
    total: number;
    resolved: number;
    pending: number;
    overdue: number;
    closed: number;
    reopened: number;
    inProgress: number;
  };
  sla: {
    compliance: number;
    avgResolutionTime: number;
    target: number;
    onTimeResolutions: number;
    breachedSLA: number;
  };
  performance: {
    userSatisfaction: number;
    escalationRate: number;
    firstCallResolution: number;
    repeatComplaints: number;
  };
  priorities: Array<{ name: string; count: number; percentage: number }>;
  categories: Array<{ name: string; count: number; avgTime: number }>;
  wards: Array<{ name: string; complaints: number; resolved: number; avgTime: number; slaScore: number }>;
  trends: Array<{ date: string; complaints: number; resolved: number; slaCompliance: number }>;
  complaints?: ComplaintData[];
  filters: any;
  metadata: {
    generatedAt: string;
    generatedBy: string;
    userRole: string;
    reportType: string;
  };
}

interface SystemConfig {
  appName: string;
  appLogoUrl?: string;
  complaintIdPrefix: string;
}

interface ExportOptions {
  systemConfig: SystemConfig;
  userRole: string;
  userWard?: string;
  filters?: any;
}

// Utility function to format complaint ID
const formatComplaintId = (id: string, prefix: string = "CMS"): string => {
  if (!id) return `${prefix}-000000`;

  let numericId: number;
  if (typeof id === "string") {
    const match = id.match(/\d+/);
    numericId = match ? parseInt(match[0]) : 0;
  } else {
    numericId = id;
  }

  return `${prefix}-${numericId.toString().padStart(6, "0")}`;
};

// Calculate SLA status
const calculateSLAStatus = (complaint: ComplaintData): string => {
  if (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') {
    if (complaint.deadline && complaint.resolvedOn) {
      return new Date(complaint.resolvedOn) <= new Date(complaint.deadline) ? 'Met' : 'Breached';
    }
    return 'Completed';
  }

  if (complaint.deadline && new Date() > new Date(complaint.deadline)) {
    return 'Overdue';
  }

  return 'Active';
};

// Format complaint data for export with enhanced details
const formatComplaintForExport = (complaint: ComplaintData, options: ExportOptions) => {
  const complaintId = complaint.complaintId ||
    formatComplaintId(complaint.id, options.systemConfig.complaintIdPrefix);

  const slaStatus = calculateSLAStatus(complaint);

  // Format dates with time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Calculate resolution time in hours
  const calculateResolutionTime = () => {
    if (!complaint.submittedOn || !complaint.resolvedOn) return 'N/A';
    const submitted = new Date(complaint.submittedOn);
    const resolved = new Date(complaint.resolvedOn);
    const diffHours = Math.round((resolved.getTime() - submitted.getTime()) / (1000 * 60 * 60));
    return `${diffHours} hours`;
  };

  return {
    'Complaint ID': complaintId,
    'Title / Type': complaint.complaintType?.name || complaint.type || 'N/A',
    'Description': complaint.description || 'N/A',
    'Status': complaint.status || 'N/A',
    'Priority': complaint.priority || 'N/A',
    'Category': complaint.complaintType?.name || complaint.type || 'N/A',
    'Ward / Subzone': complaint.ward?.name || 'N/A',
    'Submitted On': formatDateTime(complaint.submittedOn),
    'Assigned On': formatDateTime(complaint.assignedOn),
    'Resolved On': formatDateTime(complaint.resolvedOn),
    'Closed On': formatDateTime(complaint.closedOn),
    'Submitted By': options.userRole === 'CITIZEN' ? 'Hidden' :
      (complaint.submittedBy?.fullName || complaint.citizenName || 'Anonymous'),
    'Assigned To': complaint.assignedTo?.fullName || 'Unassigned',
    'Contact Phone': options.userRole === 'CITIZEN' ? 'Hidden' :
      (complaint.contactPhone || 'N/A'),
    'Contact Email': options.userRole === 'CITIZEN' ? 'Hidden' :
      (complaint.contactEmail || 'N/A'),
    'Location': complaint.location || 'N/A',
    'Landmark': complaint.landmark || 'N/A',
    'SLA Status': slaStatus,
    'Resolution Time': calculateResolutionTime(),
    'Citizen Rating': complaint.feedback?.rating ? `${complaint.feedback.rating}/5` : 'N/A',
    'Citizen Feedback': complaint.feedback?.comment || 'N/A',
    'Attachments Count': complaint.attachments?.length || 0,
    'Resolution Remarks': complaint.status === 'RESOLVED' || complaint.status === 'CLOSED' ?
      'Resolved' : 'Pending Resolution'
  };
};

// Calculate comprehensive statistics from complaints data
const calculateStatistics = (complaints: ComplaintData[]) => {
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;
  const closed = complaints.filter(c => c.status === 'CLOSED').length;
  const pending = complaints.filter(c => ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
  const reopened = complaints.filter(c => c.status === 'REOPENED').length;

  // Calculate SLA compliance
  const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');
  const onTimeResolutions = resolvedComplaints.filter(c => {
    if (!c.deadline || !c.resolvedOn) return false;
    return new Date(c.resolvedOn) <= new Date(c.deadline);
  }).length;

  const slaCompliance = resolvedComplaints.length > 0 ?
    Math.round((onTimeResolutions / resolvedComplaints.length) * 100) : 0;

  // Calculate average resolution time
  const avgResolutionTime = resolvedComplaints.length > 0 ?
    Math.round(resolvedComplaints.reduce((acc, c) => {
      if (!c.submittedOn || !c.resolvedOn) return acc;
      const hours = (new Date(c.resolvedOn).getTime() - new Date(c.submittedOn).getTime()) / (1000 * 60 * 60);
      return acc + hours;
    }, 0) / resolvedComplaints.length) : 0;

  // Priority breakdown
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(priority => ({
    name: priority,
    count: complaints.filter(c => c.priority === priority).length,
    percentage: total > 0 ? Math.round((complaints.filter(c => c.priority === priority).length / total) * 100) : 0
  }));

  // Category breakdown
  const categoryMap = new Map();
  complaints.forEach(c => {
    const category = c.complaintType?.name || c.type || 'Unknown';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { count: 0, totalTime: 0 });
    }
    const data = categoryMap.get(category);
    data.count++;

    if (c.submittedOn && c.resolvedOn) {
      const hours = (new Date(c.resolvedOn).getTime() - new Date(c.submittedOn).getTime()) / (1000 * 60 * 60);
      data.totalTime += hours;
    }
  });

  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    avgTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0
  }));

  // Ward breakdown
  const wardMap = new Map();
  complaints.forEach(c => {
    const ward = c.ward?.name || 'Unknown';
    if (!wardMap.has(ward)) {
      wardMap.set(ward, { complaints: 0, resolved: 0, totalTime: 0 });
    }
    const data = wardMap.get(ward);
    data.complaints++;

    if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
      data.resolved++;
      if (c.submittedOn && c.resolvedOn) {
        const hours = (new Date(c.resolvedOn).getTime() - new Date(c.submittedOn).getTime()) / (1000 * 60 * 60);
        data.totalTime += hours;
      }
    }
  });

  const wards = Array.from(wardMap.entries()).map(([name, data]) => ({
    name,
    complaints: data.complaints,
    resolved: data.resolved,
    avgTime: data.resolved > 0 ? Math.round(data.totalTime / data.resolved) : 0,
    slaScore: data.complaints > 0 ? Math.round((data.resolved / data.complaints) * 100) : 0
  }));

  return {
    summary: {
      total,
      resolved,
      closed,
      pending,
      reopened,
      inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
      overdue: complaints.filter(c => {
        if (!c.deadline) return false;
        return new Date() > new Date(c.deadline) && !['RESOLVED', 'CLOSED'].includes(c.status);
      }).length
    },
    sla: {
      compliance: slaCompliance,
      avgResolutionTime,
      target: 48, // Default SLA target
      onTimeResolutions,
      breachedSLA: resolvedComplaints.length - onTimeResolutions
    },
    priorities,
    categories,
    wards
  };
};

/**
 * Export to PDF using jsPDF
 */
export const exportToPDF = async (
  complaints: ComplaintData[],
  options: ExportOptions
): Promise<void> => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;
    const marginLeft = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(options.systemConfig.appName, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    doc.setFontSize(14);
    doc.text('Complaints Report', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginLeft, yPosition);
    doc.text(`Total Records: ${complaints.length}`, marginLeft, yPosition + 5);
    doc.text(`User Role: ${options.userRole}`, marginLeft, yPosition + 10);

    yPosition += 25;

    // Table headers
    const headers = ['ID', 'Type', 'Status', 'Ward', 'Created', 'Assigned'];
    const columnWidths = [25, 35, 20, 30, 25, 35];
    let xPosition = marginLeft;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += columnWidths[index] || 0;
    });

    yPosition += 8;
    doc.setFont('helvetica', 'normal');

    // Table data
    const maxRecords = Math.min(complaints.length, 50); // Limit for PDF readability

    for (let i = 0; i < maxRecords; i++) {
      const complaint = complaints[i];
      if (!complaint) continue;

      const formattedData = formatComplaintForExport(complaint, options);

      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = marginLeft;
      const rowData = [
        formattedData['Complaint ID'].substring(0, 12),
        formattedData['Title / Type'].substring(0, 20),
        formattedData['Status'].substring(0, 12),
        formattedData['Ward / Subzone'].substring(0, 18),
        formattedData['Submitted On'].substring(0, 12),
        formattedData['Assigned To'].substring(0, 20)
      ];

      rowData.forEach((cell, index) => {
        doc.text(cell, xPosition, yPosition);
        xPosition += columnWidths[index] || 0;
      });

      yPosition += 6;
    }

    if (complaints.length > maxRecords) {
      yPosition += 10;
      doc.text(`... and ${complaints.length - maxRecords} more records. Use Excel/CSV for complete data.`,
        marginLeft, yPosition);
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Complaints_Report_${timestamp}.pdf`;

    doc.save(filename);

  } catch (error) {
    console.error('PDF export failed:', error);
    showViteCacheInstructions();
    throw handleViteCacheError(error as Error, 'PDF export');
  }
};

/**
 * Export to Excel using SheetJS
 */
export const exportToExcel = async (
  complaints: ComplaintData[],
  options: ExportOptions
): Promise<void> => {
  try {
    const XLSX = await import('xlsx');

    // Format data for Excel
    const excelData = complaints.map(complaint =>
      formatComplaintForExport(complaint, options)
    );

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create main data sheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Complaint ID
      { wch: 25 }, // Complaint Type
      { wch: 20 }, // Ward / Subzone
      { wch: 20 }, // Citizen Name
      { wch: 40 }, // Description
      { wch: 12 }, // Status
      { wch: 12 }, // Priority
      { wch: 25 }, // Assigned Department / Officer
      { wch: 15 }, // Date of Creation
      { wch: 15 }, // Last Updated
      { wch: 20 }, // Resolution / Remarks
      { wch: 15 }, // Contact Phone
      { wch: 25 }, // Contact Email
      { wch: 30 }, // Location
      { wch: 20 }, // Landmark
      { wch: 12 }, // SLA Status
      { wch: 12 }  // Attachments Count
    ];

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints Report');

    // Create summary sheet
    const summaryData = [
      [options.systemConfig.appName],
      ['Complaints Report Summary'],
      [''],
      ['Generated:', new Date().toLocaleString()],
      ['Total Records:', complaints.length],
      ['User Role:', options.userRole],
      [''],
      ['Status Summary:'],
      ['Registered:', complaints.filter(c => c.status === 'REGISTERED').length],
      ['Assigned:', complaints.filter(c => c.status === 'ASSIGNED').length],
      ['In Progress:', complaints.filter(c => c.status === 'IN_PROGRESS').length],
      ['Resolved:', complaints.filter(c => c.status === 'RESOLVED').length],
      ['Closed:', complaints.filter(c => c.status === 'CLOSED').length]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Complaints_Report_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Excel export failed:', error);
    showViteCacheInstructions();
    throw handleViteCacheError(error as Error, 'Excel export');
  }
};

/**
 * Export to CSV using Blob
 */
export const exportToCSV = async (
  complaints: ComplaintData[],
  options: ExportOptions
): Promise<void> => {
  try {
    // Format data for CSV
    const csvData = complaints.map(complaint =>
      formatComplaintForExport(complaint, options)
    );

    if (csvData.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first row
    const firstRow = csvData[0];
    if (!firstRow) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(firstRow);

    // Create CSV content
    const csvRows = [
      headers.join(','), // Header row
      ...csvData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          // Escape quotes and wrap in quotes if contains comma or quote
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const csvWithBOM = '\uFEFF' + csvContent;

    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Complaints_Report_${timestamp}.csv`;

    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('CSV export failed. Please try again.');
  }
};

/**
 * Validate export permissions based on user role
 */
export const validateExportPermissions = (userRole: string): boolean => {
  const allowedRoles = ['ADMINISTRATOR', 'WARD_OFFICER'];
  return allowedRoles.includes(userRole);
};

/**
 * Validate analytics data for export
 */
export const validateAnalyticsData = (data: EnhancedAnalyticsData): { isValid: boolean; message?: string } => {
  if (!data) {
    return { isValid: false, message: 'No data available for export' };
  }

  // Check if we have any meaningful data to export
  const hasComplaintData = data.complaints && data.complaints.length > 0;
  const hasSummaryData = data.summary && data.summary.total > 0;
  const hasAnalyticsData = (data.categories && data.categories.length > 0) ||
    (data.wards && data.wards.length > 0) ||
    (data.trends && data.trends.length > 0);

  if (!hasComplaintData && !hasSummaryData && !hasAnalyticsData) {
    return {
      isValid: false,
      message: 'No meaningful data to export. Please adjust your filters or date range to include data.'
    };
  }

  return { isValid: true };
};

/**
 * Filter complaints based on user role and permissions
 */
export const filterComplaintsForExport = (
  complaints: ComplaintData[],
  userRole: string,
  userWardId?: string
): ComplaintData[] => {
  if (userRole === 'ADMINISTRATOR') {
    return complaints; // Admin can export all
  }

  if (userRole === 'WARD_OFFICER' && userWardId) {
    return complaints.filter(complaint =>
      complaint.ward?.name === userWardId ||
      !complaint.ward // Include complaints without ward assignment
    );
  }

  return []; // No access for other roles
};

/**
 * Enhanced PDF export with comprehensive complaint details and statistics
 */
export const exportAnalyticsToPDF = async (
  data: EnhancedAnalyticsData,
  options: ExportOptions
): Promise<void> => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;
    const marginLeft = 20;
    const marginRight = 20;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number = 30) => {
      if (yPosition > pageHeight - requiredSpace) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Header with branding
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(options.systemConfig.appName, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 12;
    doc.setFontSize(16);
    doc.text('Comprehensive Complaints Report', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginLeft, yPosition);
    doc.text(`Generated By: ${data.metadata?.generatedBy || 'System'}`, marginLeft, yPosition + 5);
    doc.text(`User Role: ${options.userRole}`, marginLeft, yPosition + 10);
    doc.text(`Report Period: ${data.filters?.dateRange?.from || 'N/A'} to ${data.filters?.dateRange?.to || 'N/A'}`, marginLeft, yPosition + 15);

    yPosition += 30;

    // Executive Summary Box
    checkNewPage(60);
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.rect(marginLeft, yPosition - 5, pageWidth - marginLeft - marginRight, 50);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', marginLeft + 5, yPosition + 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Complaints: ${data.summary?.total || 0}`, marginLeft + 5, yPosition + 15);
    doc.text(`Resolved: ${data.summary?.resolved || 0} (${data.summary?.total > 0 ? Math.round((data.summary.resolved / data.summary.total) * 100) : 0}%)`, marginLeft + 5, yPosition + 22);
    doc.text(`Pending: ${data.summary?.pending || 0}`, marginLeft + 5, yPosition + 29);
    doc.text(`Overdue: ${data.summary?.overdue || 0}`, marginLeft + 5, yPosition + 36);

    doc.text(`SLA Compliance: ${data.sla?.compliance || 0}%`, marginLeft + 100, yPosition + 15);
    doc.text(`Avg Resolution: ${data.sla?.avgResolutionTime || 0} hours`, marginLeft + 100, yPosition + 22);
    doc.text(`Reopened: ${data.summary?.reopened || 0}`, marginLeft + 100, yPosition + 29);
    doc.text(`In Progress: ${data.summary?.inProgress || 0}`, marginLeft + 100, yPosition + 36);

    yPosition += 65;

    // Priority Breakdown
    checkNewPage(40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Priority Breakdown', marginLeft, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (data.priorities && data.priorities.length > 0) {
      data.priorities.forEach((priority: any) => {
        doc.text(`${priority.name}: ${priority.count} complaints (${priority.percentage}%)`, marginLeft, yPosition);
        yPosition += 5;
      });
    }
    yPosition += 10;

    // SLA Performance Details
    checkNewPage(40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SLA Performance', marginLeft, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`SLA Target: ${data.sla?.target || 48} hours`, marginLeft, yPosition);
    doc.text(`On-time Resolutions: ${data.sla?.onTimeResolutions || 0}`, marginLeft, yPosition + 5);
    doc.text(`SLA Breached: ${data.sla?.breachedSLA || 0}`, marginLeft, yPosition + 10);
    doc.text(`Average Resolution Time: ${data.sla?.avgResolutionTime || 0} hours`, marginLeft, yPosition + 15);
    yPosition += 30;

    // Categories Section
    if (data.categories && data.categories.length > 0) {
      checkNewPage(40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Complaint Categories', marginLeft, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      data.categories.slice(0, 15).forEach((category: any) => {
        checkNewPage();
        doc.text(`${category.name}: ${category.count} complaints (Avg: ${category.avgTime}h)`, marginLeft, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Ward Performance
    if (data.wards && data.wards.length > 0) {
      checkNewPage(40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Ward Performance', marginLeft, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      data.wards.slice(0, 15).forEach((ward: any) => {
        checkNewPage();
        doc.text(`${ward.name}: ${ward.complaints} complaints, ${ward.resolved} resolved (${ward.slaScore}%)`, marginLeft, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Complaint Details Table (if complaints data is available)
    if (data.complaints && data.complaints.length > 0) {
      checkNewPage(60);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Complaints Details', marginLeft, yPosition);
      yPosition += 15;

      // Table headers
      const headers = ['ID', 'Type', 'Status', 'Priority', 'Ward', 'Submitted', 'SLA'];
      const columnWidths = [20, 25, 18, 15, 25, 20, 15];
      let xPosition = marginLeft;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += columnWidths[index] || 0;
      });

      yPosition += 8;
      doc.setFont('helvetica', 'normal');

      // Show first 20 complaints for PDF readability
      const maxRecords = Math.min(data.complaints.length, 20);

      for (let i = 0; i < maxRecords; i++) {
        const complaint = data.complaints[i];
        if (!complaint) continue;

        checkNewPage();

        const formattedData = formatComplaintForExport(complaint, options);
        xPosition = marginLeft;

        const rowData = [
          formattedData['Complaint ID'].substring(0, 15),
          formattedData['Title / Type'].substring(0, 20),
          formattedData['Status'].substring(0, 12),
          formattedData['Priority'].substring(0, 10),
          formattedData['Ward / Subzone'].substring(0, 18),
          formattedData['Submitted On'].substring(0, 16),
          formattedData['SLA Status'].substring(0, 10)
        ];

        rowData.forEach((cell, index) => {
          doc.text(cell, xPosition, yPosition);
          xPosition += columnWidths[index] || 0;
        });

        yPosition += 6;
      }

      if (data.complaints.length > maxRecords) {
        yPosition += 10;
        doc.text(`... and ${data.complaints.length - maxRecords} more complaints. Use Excel export for complete data.`,
          marginLeft, yPosition);
      }
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, marginLeft, pageHeight - 10);
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Comprehensive_Report_${timestamp}.pdf`;

    doc.save(filename);

  } catch (error) {
    console.error('PDF export failed:', error);
    showViteCacheInstructions();
    throw handleViteCacheError(error as Error, 'PDF export');
  }
};

/**
 * Enhanced Excel export with comprehensive complaint details and multiple sheets
 */
export const exportAnalyticsToExcel = async (
  data: EnhancedAnalyticsData,
  options: ExportOptions
): Promise<void> => {
  try {
    const XLSX = await import('xlsx');

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // 1. Executive Summary Sheet
    const summaryData = [
      [options.systemConfig.appName],
      ['Comprehensive Complaints Report'],
      [''],
      ['Report Details'],
      ['Generated:', new Date().toLocaleString()],
      ['Generated By:', data.metadata?.generatedBy || 'System'],
      ['User Role:', options.userRole],
      ['Report Period:', `${data.filters?.dateRange?.from || 'N/A'} to ${data.filters?.dateRange?.to || 'N/A'}`],
      [''],
      ['Executive Summary'],
      ['Metric', 'Value', 'Percentage'],
      ['Total Complaints', data.summary?.total || 0, '100%'],
      ['Resolved', data.summary?.resolved || 0, data.summary?.total > 0 ? `${Math.round((data.summary.resolved / data.summary.total) * 100)}%` : '0%'],
      ['Closed', data.summary?.closed || 0, data.summary?.total > 0 ? `${Math.round((data.summary.closed / data.summary.total) * 100)}%` : '0%'],
      ['Pending', data.summary?.pending || 0, data.summary?.total > 0 ? `${Math.round((data.summary.pending / data.summary.total) * 100)}%` : '0%'],
      ['In Progress', data.summary?.inProgress || 0, data.summary?.total > 0 ? `${Math.round((data.summary.inProgress / data.summary.total) * 100)}%` : '0%'],
      ['Overdue', data.summary?.overdue || 0, data.summary?.total > 0 ? `${Math.round((data.summary.overdue / data.summary.total) * 100)}%` : '0%'],
      ['Reopened', data.summary?.reopened || 0, data.summary?.total > 0 ? `${Math.round((data.summary.reopened / data.summary.total) * 100)}%` : '0%'],
      [''],
      ['SLA Performance'],
      ['SLA Compliance Rate', `${data.sla?.compliance || 0}%`, ''],
      ['Average Resolution Time', `${data.sla?.avgResolutionTime || 0} hours`, ''],
      ['SLA Target', `${data.sla?.target || 48} hours`, ''],
      ['On-time Resolutions', data.sla?.onTimeResolutions || 0, ''],
      ['SLA Breached', data.sla?.breachedSLA || 0, '']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    // 2. Detailed Complaints Sheet (if complaints data is available)
    if (data.complaints && data.complaints.length > 0) {
      const complaintsData = data.complaints.map(complaint =>
        formatComplaintForExport(complaint, options)
      );

      const complaintsSheet = XLSX.utils.json_to_sheet(complaintsData);

      // Set column widths for better readability
      complaintsSheet['!cols'] = [
        { wch: 15 }, // Complaint ID
        { wch: 25 }, // Title / Type
        { wch: 40 }, // Description
        { wch: 12 }, // Status
        { wch: 12 }, // Priority
        { wch: 20 }, // Category
        { wch: 20 }, // Ward / Subzone
        { wch: 20 }, // Submitted On
        { wch: 20 }, // Assigned On
        { wch: 20 }, // Resolved On
        { wch: 20 }, // Closed On
        { wch: 25 }, // Submitted By
        { wch: 25 }, // Assigned To
        { wch: 15 }, // Contact Phone
        { wch: 25 }, // Contact Email
        { wch: 30 }, // Location
        { wch: 20 }, // Landmark
        { wch: 12 }, // SLA Status
        { wch: 15 }, // Resolution Time
        { wch: 12 }, // Citizen Rating
        { wch: 30 }, // Citizen Feedback
        { wch: 12 }, // Attachments Count
        { wch: 25 }  // Resolution Remarks
      ];

      XLSX.utils.book_append_sheet(workbook, complaintsSheet, 'All Complaints');
    }

    // 3. Priority Breakdown Sheet
    if (data.priorities && data.priorities.length > 0) {
      const priorityData = [
        ['Priority Level', 'Count', 'Percentage', 'Description'],
        ...data.priorities.map((priority: any) => [
          priority.name,
          priority.count,
          `${priority.percentage}%`,
          priority.name === 'CRITICAL' ? 'Requires immediate attention' :
            priority.name === 'HIGH' ? 'High priority issues' :
              priority.name === 'MEDIUM' ? 'Standard priority' : 'Low priority issues'
        ])
      ];

      const prioritySheet = XLSX.utils.aoa_to_sheet(priorityData);
      prioritySheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, prioritySheet, 'Priority Analysis');
    }

    // 4. Categories Sheet
    if (data.categories && data.categories.length > 0) {
      const categoriesData = [
        ['Category Name', 'Total Complaints', 'Avg Resolution Time (hours)', 'Percentage of Total'],
        ...data.categories.map((cat: any) => [
          cat.name || 'Unknown',
          cat.count || 0,
          cat.avgTime || 0,
          data.summary?.total > 0 ? `${Math.round((cat.count / data.summary.total) * 100)}%` : '0%'
        ])
      ];

      const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
      categoriesSheet['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 25 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Category Analysis');
    }

    // 5. Ward Performance Sheet
    if (data.wards && data.wards.length > 0) {
      const wardsData = [
        ['Ward Name', 'Total Complaints', 'Resolved', 'Pending', 'Efficiency %', 'Avg Resolution Time (hours)', 'SLA Score'],
        ...data.wards.map((ward: any) => [
          ward.name || 'Unknown',
          ward.complaints || 0,
          ward.resolved || 0,
          (ward.complaints || 0) - (ward.resolved || 0),
          ward.complaints > 0 ? `${Math.round((ward.resolved / ward.complaints) * 100)}%` : '0%',
          ward.avgTime || 0,
          `${ward.slaScore || 0}%`
        ])
      ];

      const wardsSheet = XLSX.utils.aoa_to_sheet(wardsData);
      wardsSheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, wardsSheet, 'Ward Performance');
    }

    // 6. Trends Sheet
    if (data.trends && data.trends.length > 0) {
      const trendsData = [
        ['Date', 'New Complaints', 'Resolved', 'Pending', 'SLA Compliance %'],
        ...data.trends.map((trend: any) => [
          trend.date || 'Unknown',
          trend.complaints || 0,
          trend.resolved || 0,
          (trend.complaints || 0) - (trend.resolved || 0),
          `${trend.slaCompliance || 0}%`
        ])
      ];

      const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
      trendsSheet['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends Analysis');
    }

    // 7. Filters Applied Sheet
    const filtersData = [
      ['Applied Filters'],
      [''],
      ['Filter Type', 'Value'],
      ['Date Range', `${data.filters?.dateRange?.from || 'N/A'} to ${data.filters?.dateRange?.to || 'N/A'}`],
      ['Ward', data.filters?.ward || 'All Wards'],
      ['Complaint Type', data.filters?.complaintType || 'All Types'],
      ['Status', data.filters?.status || 'All Statuses'],
      ['Priority', data.filters?.priority || 'All Priorities'],
      [''],
      ['Export Details'],
      ['Exported By', data.metadata?.generatedBy || 'System'],
      ['Export Date', new Date().toLocaleString()],
      ['User Role', options.userRole],
      ['Total Records Exported', data.summary?.total || 0]
    ];

    const filtersSheet = XLSX.utils.aoa_to_sheet(filtersData);
    filtersSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, filtersSheet, 'Export Details');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Comprehensive_Report_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Excel export failed:', error);
    showViteCacheInstructions();
    throw handleViteCacheError(error as Error, 'Excel export');
  }
};

/**
 * Enhanced CSV export with comprehensive complaint details
 * This function is designed to be the most reliable export option
 */
export const exportAnalyticsToCSV = async (
  data: EnhancedAnalyticsData,
  options: ExportOptions
): Promise<void> => {
  try {
    let csvContent = '';

    // If we have detailed complaint data, export it as the main content
    if (data.complaints && data.complaints.length > 0) {
      const complaintsData = data.complaints.map(complaint =>
        formatComplaintForExport(complaint, options)
      );

      if (complaintsData.length > 0 && complaintsData[0]) {
        // Get headers from first complaint
        const headers = Object.keys(complaintsData[0]);

        // Create CSV content with complaint details
        const csvRows = [
          headers, // Header row
          ...complaintsData.map(row =>
            headers.map(header => {
              const value = row[header as keyof typeof row] || '';
              const stringValue = String(value);
              // Escape quotes and wrap in quotes if contains comma or quote
              if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
          )
        ];

        csvContent = csvRows.map(row => row.join(',')).join('\n');
      }
    } else {
      // Fallback to analytics summary if no complaint data
      const csvRows = [
        // Header
        ['Report Type', 'Comprehensive Analytics Report'],
        ['Generated', new Date().toLocaleString()],
        ['Generated By', data.metadata?.generatedBy || 'Unknown'],
        ['User Role', options.userRole],
        [''],

        // Summary Statistics
        ['Summary Statistics'],
        ['Metric', 'Value'],
        ['Total Complaints', data.summary?.total || 0],
        ['Resolved', data.summary?.resolved || 0],
        ['Closed', data.summary?.closed || 0],
        ['Pending', data.summary?.pending || 0],
        ['In Progress', data.summary?.inProgress || 0],
        ['Overdue', data.summary?.overdue || 0],
        ['Reopened', data.summary?.reopened || 0],
        [''],

        // SLA Performance
        ['SLA Performance'],
        ['Metric', 'Value'],
        ['SLA Compliance (%)', data.sla?.compliance || 0],
        ['Avg Resolution Time (hours)', data.sla?.avgResolutionTime || 0],
        ['Target (hours)', data.sla?.target || 48],
        ['On-time Resolutions', data.sla?.onTimeResolutions || 0],
        ['SLA Breached', data.sla?.breachedSLA || 0],
        [''],

        // Priority Breakdown
        ['Priority Breakdown'],
        ['Priority', 'Count', 'Percentage'],
        ...(data.priorities || []).map((priority: any) => [
          priority.name,
          priority.count,
          `${priority.percentage}%`
        ]),
        [''],

        // Applied Filters
        ['Applied Filters'],
        ['Filter', 'Value'],
        ['Date Range', `${data.filters?.dateRange?.from || 'N/A'} to ${data.filters?.dateRange?.to || 'N/A'}`],
        ['Ward', data.filters?.ward || 'All Wards'],
        ['Complaint Type', data.filters?.complaintType || 'All Types'],
        ['Status', data.filters?.status || 'All Statuses'],
        ['Priority', data.filters?.priority || 'All Priorities'],
      ];

      // Add Categories section if available
      if (data.categories && data.categories.length > 0) {
        csvRows.push(
          [''],
          ['Complaint Categories'],
          ['Category Name', 'Count', 'Avg Time (hours)'],
          ...data.categories.map((cat: any) => [
            cat.name || 'Unknown',
            cat.count || 0,
            cat.avgTime || 0
          ])
        );
      }

      // Add Wards section if available
      if (data.wards && data.wards.length > 0) {
        csvRows.push(
          [''],
          ['Ward Performance'],
          ['Ward Name', 'Total Complaints', 'Resolved', 'Efficiency %', 'Avg Time (hours)', 'SLA Score'],
          ...data.wards.map((ward: any) => [
            ward.name || 'Unknown',
            ward.complaints || 0,
            ward.resolved || 0,
            ward.complaints > 0 ? Math.round((ward.resolved / ward.complaints) * 100) : 0,
            ward.avgTime || 0,
            ward.slaScore || 0
          ])
        );
      }

      // Convert to CSV format
      csvContent = csvRows.map(row =>
        row.map(cell => {
          const stringValue = String(cell || '');
          // Escape quotes and wrap in quotes if contains comma or quote
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      ).join('\n');
    }

    // Add BOM for proper UTF-8 encoding in Excel
    const csvWithBOM = '\uFEFF' + csvContent;

    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = data.complaints && data.complaints.length > 0 ?
      `Detailed_Complaints_${timestamp}.csv` :
      `Analytics_Summary_${timestamp}.csv`;

    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('CSV export failed. Please try again.');
  }
};

/**
 * Main export function that handles all formats
 */
export const exportComplaints = async (
  complaints: ComplaintData[],
  format: 'pdf' | 'excel' | 'csv',
  options: ExportOptions
): Promise<void> => {
  // Validate permissions
  if (!validateExportPermissions(options.userRole)) {
    throw new Error('You do not have permission to export data');
  }

  // Filter complaints based on role
  const filteredComplaints = filterComplaintsForExport(
    complaints,
    options.userRole,
    options.userWard
  );

  if (filteredComplaints.length === 0) {
    throw new Error('No complaints available for export');
  }

  // Export based on format
  switch (format) {
    case 'pdf':
      await exportToPDF(filteredComplaints, options);
      break;
    case 'excel':
      await exportToExcel(filteredComplaints, options);
      break;
    case 'csv':
      await exportToCSV(filteredComplaints, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};