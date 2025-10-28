/**
 * Simplified Export System - Restored from 10/10/2025 working version
 * Reliable PDF, Excel, and CSV exports without dynamic import issues
 */

// Simple interfaces for export data
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
  assignedTo?: { fullName: string };
  submittedBy?: { fullName: string };
  citizenName?: string;
  contactPhone?: string;
  contactEmail?: string;
  location?: string;
  landmark?: string;
}

interface ExportData {
  summary: {
    total: number;
    resolved: number;
    pending: number;
    overdue: number;
    closed: number;
    reopened: number;
    inProgress: number;
  };
  complaints: ComplaintData[];
  categories?: any[];
  wards?: any[];
  trends?: any[];
  filters: any;
  metadata: any;
}

interface ExportOptions {
  systemConfig: {
    appName: string;
    appLogoUrl?: string;
    complaintIdPrefix: string;
  };
  userRole: string;
  userWard?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  maxRecords?: number;
  filters?: any;
  metadata?: any;
}

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
export const validateAnalyticsData = (data: ExportData): { isValid: boolean; message?: string } => {
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
 * Simple CSV export using native browser APIs
 */
export const exportAnalyticsToCSV = async (data: ExportData, options: ExportOptions): Promise<void> => {
  try {
    const complaints = data.complaints || [];
    
    if (complaints.length === 0) {
      throw new Error('No complaint data available for CSV export');
    }

    // Create CSV headers
    const headers = [
      'Complaint ID',
      'Type',
      'Description',
      'Status',
      'Priority',
      'Ward',
      'Submitted On',
      'Resolved On',
      'Assigned To',
      'Citizen Name',
      'Contact Phone',
      'Contact Email',
      'Location',
      'Landmark'
    ];

    // Create CSV rows
    const rows = complaints.map(complaint => [
      complaint.complaintId || complaint.id || '',
      complaint.type || '',
      (complaint.description || '').replace(/"/g, '""').substring(0, 100),
      complaint.status || '',
      complaint.priority || '',
      complaint.ward?.name || '',
      complaint.submittedOn || '',
      complaint.resolvedOn || '',
      complaint.assignedTo?.fullName || '',
      complaint.citizenName || complaint.submittedBy?.fullName || '',
      complaint.contactPhone || '',
      complaint.contactEmail || '',
      complaint.location || '',
      complaint.landmark || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Add BOM for Excel compatibility
    const csvWithBOM = '\uFEFF' + csvContent;

    // Create and download file
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${options.systemConfig.appName}_Complaints_${new Date().toISOString().split('T')[0]}.csv`);
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
 * Simple Excel export using SheetJS
 */
export const exportAnalyticsToExcel = async (data: ExportData, options: ExportOptions): Promise<void> => {
  try {
    // Import XLSX dynamically but with better error handling
    const xlsxModule = await import('xlsx' as any);
    const XLSX = xlsxModule.default || xlsxModule;
    
    const complaints = data.complaints || [];
    
    if (complaints.length === 0) {
      throw new Error('No complaint data available for Excel export');
    }

    // Prepare data for Excel
    const excelData = complaints.map(complaint => ({
      'Complaint ID': complaint.complaintId || complaint.id || '',
      'Type': complaint.type || '',
      'Description': (complaint.description || '').substring(0, 100),
      'Status': complaint.status || '',
      'Priority': complaint.priority || '',
      'Ward': complaint.ward?.name || '',
      'Submitted On': complaint.submittedOn || '',
      'Resolved On': complaint.resolvedOn || '',
      'Assigned To': complaint.assignedTo?.fullName || '',
      'Citizen Name': complaint.citizenName || complaint.submittedBy?.fullName || '',
      'Contact Phone': complaint.contactPhone || '',
      'Contact Email': complaint.contactEmail || '',
      'Location': complaint.location || '',
      'Landmark': complaint.landmark || ''
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Complaint ID
      { wch: 20 }, // Type
      { wch: 40 }, // Description
      { wch: 12 }, // Status
      { wch: 10 }, // Priority
      { wch: 15 }, // Ward
      { wch: 12 }, // Submitted On
      { wch: 12 }, // Resolved On
      { wch: 20 }, // Assigned To
      { wch: 20 }, // Citizen Name
      { wch: 15 }, // Contact Phone
      { wch: 25 }, // Contact Email
      { wch: 20 }, // Location
      { wch: 20 }  // Landmark
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');

    // Add summary sheet if we have summary data
    if (data.summary) {
      const summaryData = [
        ['Summary', 'Count'],
        ['Total Complaints', data.summary.total],
        ['Resolved', data.summary.resolved],
        ['Pending', data.summary.pending],
        ['In Progress', data.summary.inProgress],
        ['Overdue', data.summary.overdue],
        ['Closed', data.summary.closed],
        ['Reopened', data.summary.reopened]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Generate filename and download
    const filename = `${options.systemConfig.appName}_Complaints_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Excel export failed. Please try again or use CSV export.');
  }
};

/**
 * Simple PDF export using jsPDF
 */
export const exportAnalyticsToPDF = async (data: ExportData, options: ExportOptions): Promise<void> => {
  try {
    // Import jsPDF dynamically but with better error handling
    const { default: jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Add title
    doc.setFontSize(20);
    doc.text(options.systemConfig.appName || 'Smart CMS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(16);
    doc.text('Complaints Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Add summary information
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total Complaints: ${data.summary?.total || 0}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Resolved: ${data.summary?.resolved || 0}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Pending: ${data.summary?.pending || 0}`, margin, yPosition);
    yPosition += 15;

    // Add complaints data (limited to fit in PDF)
    const complaints = (data.complaints || []).slice(0, 20); // Limit to first 20 complaints
    
    if (complaints.length > 0) {
      doc.setFontSize(14);
      doc.text('Recent Complaints:', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      complaints.forEach((complaint, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        const complaintId = complaint.complaintId || complaint.id || `#${index + 1}`;
        const type = complaint.type || 'Unknown';
        const status = complaint.status || 'Unknown';
        const description = (complaint.description || '').substring(0, 60) + '...';

        doc.text(`${complaintId} - ${type}`, margin, yPosition);
        yPosition += 6;
        doc.text(`Status: ${status}`, margin + 10, yPosition);
        yPosition += 6;
        doc.text(`Description: ${description}`, margin + 10, yPosition);
        yPosition += 10;
      });

      if (data.complaints.length > 20) {
        yPosition += 5;
        doc.text(`... and ${data.complaints.length - 20} more complaints`, margin, yPosition);
      }
    }

    // Add footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      doc.text(`Generated by ${options.systemConfig.appName}`, margin, pageHeight - 10);
    }

    // Save the PDF
    const filename = `${options.systemConfig.appName}_Complaints_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('PDF export failed. Please try again or use CSV export.');
  }
};

/**
 * Check if export dependencies are available
 */
export const checkExportDependencies = async (): Promise<{ 
  pdf: boolean; 
  excel: boolean; 
  csv: boolean;
  errors: string[];
}> => {
  const result = { pdf: false, excel: false, csv: true, errors: [] as string[] };

  // CSV is always available (uses native browser APIs)
  result.csv = true;

  // Check PDF dependencies
  try {
    await import('jspdf');
    result.pdf = true;
  } catch (error) {
    result.errors.push(`PDF export unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Check Excel dependencies
  try {
    await import('xlsx' as any);
    result.excel = true;
  } catch (error) {
    result.errors.push(`Excel export unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
};

/**
 * Get available export formats based on dependencies
 */
export const getAvailableExportFormats = async (): Promise<Array<{
  format: 'pdf' | 'excel' | 'csv';
  label: string;
  available: boolean;
  reason?: string;
}>> => {
  const dependencies = await checkExportDependencies();
  
  return [
    {
      format: 'csv',
      label: 'CSV',
      available: dependencies.csv,
      ...(dependencies.csv ? {} : { reason: 'CSV export not available' })
    },
    {
      format: 'excel',
      label: 'Excel (XLSX)',
      available: dependencies.excel,
      ...(dependencies.excel ? {} : { reason: 'Excel library not available' })
    },
    {
      format: 'pdf',
      label: 'PDF',
      available: dependencies.pdf,
      ...(dependencies.pdf ? {} : { reason: 'PDF library not available' })
    }
  ];
};/**
 
* Export complaints data - wrapper function for backward compatibility
 */
export const exportComplaints = async (
  complaints: ComplaintData[], 
  format: 'pdf' | 'excel' | 'csv' = 'pdf',
  options: Partial<ExportOptions> = {}
): Promise<void> => {
  // Create default export data structure
  const exportData: ExportData = {
    summary: {
      total: complaints.length,
      resolved: complaints.filter(c => c.status === 'RESOLVED').length,
      pending: complaints.filter(c => c.status === 'PENDING').length,
      overdue: complaints.filter(c => c.status === 'OVERDUE').length,
      closed: complaints.filter(c => c.status === 'CLOSED').length,
      reopened: complaints.filter(c => c.status === 'REOPENED').length,
      inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    },
    complaints,
    filters: {},
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'System',
      totalRecords: complaints.length,
    }
  };

  // Default export options
  const defaultOptions: ExportOptions = {
    systemConfig: {
      appName: 'NLC-CMS',
      complaintIdPrefix: 'CMP',
    },
    userRole: 'ADMINISTRATOR',
    includeCharts: false,
    includeMetadata: true,
    ...options
  };

  // Call the appropriate export function based on format
  switch (format) {
    case 'pdf':
      return await exportAnalyticsToPDF(exportData, defaultOptions);
    case 'excel':
      return await exportAnalyticsToExcel(exportData, defaultOptions);
    case 'csv':
      return await exportAnalyticsToCSV(exportData, defaultOptions);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};