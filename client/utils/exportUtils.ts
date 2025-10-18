/**
 * Unified Export System
 * Supports PDF, Excel, and CSV exports with complete complaint details
 * Frontend-only implementation with RBAC integration
 */

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
  assignedTo?: { fullName: string };
  submittedBy?: { fullName: string };
  citizenName?: string;
  contactPhone?: string;
  contactEmail?: string;
  location?: string;
  landmark?: string;
  deadline?: string;
  complaintType?: { name: string };
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

// Format complaint data for export
const formatComplaintForExport = (complaint: ComplaintData, options: ExportOptions) => {
  const complaintId = complaint.complaintId || 
    formatComplaintId(complaint.id, options.systemConfig.complaintIdPrefix);
  
  const slaStatus = calculateSLAStatus(complaint);
  
  return {
    'Complaint ID': complaintId,
    'Complaint Type': complaint.complaintType?.name || complaint.type || 'N/A',
    'Ward / Subzone': complaint.ward?.name || 'N/A',
    'Citizen Name': options.userRole === 'CITIZEN' ? 'Hidden' : 
      (complaint.submittedBy?.fullName || complaint.citizenName || 'Anonymous'),
    'Description': complaint.description || 'N/A',
    'Status': complaint.status || 'N/A',
    'Priority': complaint.priority || 'N/A',
    'Assigned Department / Officer': complaint.assignedTo?.fullName || 'Unassigned',
    'Date of Creation': complaint.submittedOn ? 
      new Date(complaint.submittedOn).toLocaleDateString() : 'N/A',
    'Last Updated': complaint.resolvedOn ? 
      new Date(complaint.resolvedOn).toLocaleDateString() : 'In Progress',
    'Resolution / Remarks': complaint.status === 'RESOLVED' || complaint.status === 'CLOSED' ? 
      'Resolved' : 'Pending Resolution',
    'Contact Phone': options.userRole === 'CITIZEN' ? 'Hidden' : 
      (complaint.contactPhone || 'N/A'),
    'Contact Email': options.userRole === 'CITIZEN' ? 'Hidden' : 
      (complaint.contactEmail || 'N/A'),
    'Location': complaint.location || 'N/A',
    'Landmark': complaint.landmark || 'N/A',
    'SLA Status': slaStatus,
    'Attachments Count': '0' // Placeholder - can be enhanced later
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
    const marginRight = 20;
    
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
        formattedData['Complaint Type'].substring(0, 20),
        formattedData['Status'].substring(0, 12),
        formattedData['Ward / Subzone'].substring(0, 18),
        formattedData['Date of Creation'].substring(0, 12),
        formattedData['Assigned Department / Officer'].substring(0, 20)
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
    throw new Error('PDF export failed. Please try again.');
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
    throw new Error('Excel export failed. Please try again.');
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