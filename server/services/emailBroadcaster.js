/**
 * Centralized Complaint Status Update Email Broadcaster
 * 
 * This service handles all complaint-related email notifications with role-based
 * content filtering and modern responsive HTML templates.
 * 
 * Features:
 * - Role-based email content filtering
 * - Modern responsive HTML templates
 * - Modular and reusable design
 * - Comprehensive logging
 * - Multi-language support ready
 * 
 * @version  1.0.0
 * @author Fix_Smart_CMS Team
 */

import { getPrisma } from "../db/connection.js";
import { sendEmail } from "../utils/emailService.js";
import logger from "../utils/logger.js";
import {
  EMAIL_TEMPLATES,
  STATUS_MESSAGES,
  SUBJECT_TEMPLATES,
  STATUS_COLORS,
  PRIORITY_COLORS,
  BROADCASTER_CONFIG,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  getTemplateCustomization
} from "../config/emailBroadcasterConfig.js";
// SystemConfig cache removed - using direct database access

// Helper function to get system config value
const getSystemConfigValue = async (key, defaultValue = '') => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key, isActive: true }
    });
    return config?.value || defaultValue;
  } catch (error) {
    logger.warn(`Failed to get system config ${key}, using default`, { error: error.message });
    return defaultValue;
  }
};

// Helper function to get app config
const getAppConfig = async () => {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { in: ['APP_NAME', 'APP_LOGO_URL'] },
        isActive: true
      }
    });
    
    const configMap = {};
    configs.forEach(config => {
      configMap[config.key] = config.value;
    });
    
    return {
      appName: configMap.APP_NAME || 'Fix_Smart_CMS',
      logoUrl: configMap.APP_LOGO_URL || '/logo.png'
    };
  } catch (error) {
    logger.warn('Failed to get app config, using defaults', { error: error.message });
    return {
      appName: 'Fix_Smart_CMS',
      logoUrl: '/logo.png'
    };
  }
};

const prisma = getPrisma();

// Email templates and configurations are now imported from config file

/**
 * Main email broadcaster class
 */
class ComplaintEmailBroadcaster {
  constructor() {
    this.emailQueue = [];
    this.isProcessing = false;
  }

  /**
   * Broadcast complaint status update to all relevant recipients
   * 
   * @param {Object} params - Broadcast parameters
   * @param {string} params.complaintId - Complaint ID
   * @param {string} params.newStatus - New complaint status
   * @param {string} params.previousStatus - Previous complaint status
   * @param {string} params.comment - Optional status change comment
   * @param {string} params.updatedByUserId - ID of user who made the update
   * @param {Object} params.additionalData - Additional data for templates
   * @returns {Promise<Object>} Broadcast result
   */
  async broadcastStatusUpdate({
    complaintId,
    newStatus,
    previousStatus = null,
    comment = null,
    updatedByUserId,
    additionalData = {}
  }) {
    try {
      logger.info('Starting complaint status email broadcast', {
        complaintId,
        newStatus,
        previousStatus,
        updatedByUserId
      });

      // Fetch complaint with all related data
      const complaint = await this.getComplaintWithRelations(complaintId);
      if (!complaint) {
        throw new Error(`Complaint not found: ${complaintId}`);
      }

      // Determine recipients based on complaint and status
      const recipients = await this.determineRecipients(complaint, newStatus);
      
      if (recipients.length === 0) {
        logger.info('No recipients found for complaint status update', { complaintId, newStatus });
        return { success: true, emailsSent: 0, recipients: [] };
      }

      // Send emails to all recipients
      const emailResults = await Promise.allSettled(
        recipients.map(recipient => this.sendStatusUpdateEmail({
          complaint,
          recipient,
          newStatus,
          previousStatus,
          comment,
          updatedByUserId,
          additionalData
        }))
      );

      // Process results
      const successful = emailResults.filter(result => result.status === 'fulfilled').length;
      const failed = emailResults.filter(result => result.status === 'rejected');

      // Log failed emails
      failed.forEach((failure, index) => {
        logger.error('Failed to send status update email', {
          complaintId,
          recipient: recipients[emailResults.findIndex(r => r === failure)]?.email,
          error: failure.reason
        });
      });

      logger.info('Complaint status email broadcast completed', {
        complaintId,
        newStatus,
        totalRecipients: recipients.length,
        successful,
        failed: failed.length
      });

      return {
        success: true,
        emailsSent: successful,
        totalRecipients: recipients.length,
        failed: failed.length,
        recipients: recipients.map(r => ({ email: r.email, role: r.role }))
      };

    } catch (error) {
      logger.error('Error in complaint status email broadcast', {
        complaintId,
        newStatus,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        emailsSent: 0
      };
    }
  }

  /**
   * Get complaint with all necessary relations
   * 
   * @param {string} complaintId - Complaint ID
   * @returns {Promise<Object|null>} Complaint with relations
   */
  async getComplaintWithRelations(complaintId) {
    return await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        submittedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            language: true
          }
        },
        wardOfficer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            language: true
          }
        },
        maintenanceTeam: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            language: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            language: true
          }
        },
        ward: {
          select: {
            id: true,
            name: true,
            users: {
              where: {
                role: { in: ['WARD_OFFICER', 'ADMINISTRATOR'] },
                isActive: true
              },
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                language: true
              }
            }
          }
        },
        subZone: {
          select: {
            id: true,
            name: true
          }
        },
        statusLogs: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          }
        },
        attachments: {
          where: {
            entityType: 'MAINTENANCE_PHOTO'
          },
          select: {
            id: true,
            fileName: true,
            originalName: true,
            createdAt: true
          }
        }
      }
    });
  }

  /**
   * Determine email recipients based on complaint and status
   * 
   * @param {Object} complaint - Complaint object with relations
   * @param {string} status - New complaint status
   * @returns {Promise<Array>} Array of recipient objects
   */
  async determineRecipients(complaint, status) {
    const recipients = [];
    const addedEmails = new Set(); // Prevent duplicate emails

    // Helper function to add recipient if not already added
    const addRecipient = (user, role = null) => {
      if (!user || !user.email || addedEmails.has(user.email)) return;
      
      const userRole = role || user.role;
      const template = EMAIL_TEMPLATES[userRole];
      
      // Check if this role should receive this status update
      if (template && template.allowedStatuses.includes(status)) {
        recipients.push({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: userRole,
          language: user.language || 'en',
          template
        });
        addedEmails.add(user.email);
      }
    };

    // 1. Citizen (complaint submitter) - only for public statuses
    if (complaint.submittedBy) {
      addRecipient(complaint.submittedBy, 'CITIZEN');
    }

    // 2. Ward Officer (assigned to complaint)
    if (complaint.wardOfficer) {
      addRecipient(complaint.wardOfficer, 'WARD_OFFICER');
    }

    // 3. Maintenance Team (assigned to complaint)
    if (complaint.maintenanceTeam) {
      addRecipient(complaint.maintenanceTeam, 'MAINTENANCE_TEAM');
    }

    // 4. Legacy assigned user (for backward compatibility)
    if (complaint.assignedTo) {
      addRecipient(complaint.assignedTo);
    }

    // 5. Ward-based recipients (other ward officers and admins)
    if (complaint.ward && complaint.ward.users) {
      complaint.ward.users.forEach(user => {
        addRecipient(user);
      });
    }

    // 6. System administrators (get all updates)
    const administrators = await prisma.user.findMany({
      where: {
        role: 'ADMINISTRATOR',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        language: true
      }
    });

    administrators.forEach(admin => {
      addRecipient(admin, 'ADMINISTRATOR');
    });

    return recipients;
  }

  /**
   * Send status update email to a specific recipient
   * 
   * @param {Object} params - Email parameters
   * @returns {Promise<Object>} Email send result
   */
  async sendStatusUpdateEmail({
    complaint,
    recipient,
    newStatus,
    previousStatus,
    comment,
    updatedByUserId,
    additionalData
  }) {
    try {
      // Generate email content based on recipient role
      const emailContent = await this.generateEmailContent({
        complaint,
        recipient,
        newStatus,
        previousStatus,
        comment,
        updatedByUserId,
        additionalData
      });

      // Send email
      const result = await sendEmail({
        to: recipient.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      // Log successful email
      logger.info('Status update email sent successfully', {
        complaintId: complaint.id,
        complaintIdReadable: complaint.complaintId,
        recipientEmail: recipient.email,
        recipientRole: recipient.role,
        status: newStatus,
        messageId: result.messageId
      });

      return {
        success: true,
        recipient: recipient.email,
        messageId: result.messageId
      };

    } catch (error) {
      logger.error('Failed to send status update email', {
        complaintId: complaint.id,
        recipientEmail: recipient.email,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Generate email content based on recipient role and template
   * 
   * @param {Object} params - Content generation parameters
   * @returns {Promise<Object>} Email content object
   */
  async generateEmailContent({
    complaint,
    recipient,
    newStatus,
    previousStatus,
    comment,
    updatedByUserId,
    additionalData
  }) {
    const template = recipient.template;
    const messageType = template.templateType === 'citizen' ? 'CITIZEN' : 
                       template.templateType === 'admin' ? 'ADMIN' : 'STAFF';
    
    const language = recipient.language || BROADCASTER_CONFIG.defaultLanguage;
    const statusMessage = STATUS_MESSAGES[messageType][language]?.[newStatus] || 
                         STATUS_MESSAGES[messageType]['en']?.[newStatus] ||
                         `Complaint status has been updated to ${newStatus}.`;

    // Generate subject line
    const subject = await this.generateSubjectLine(complaint, newStatus, recipient.role, recipient.language);

    // Generate text content
    const text = this.generateTextContent({
      complaint,
      recipient,
      newStatus,
      previousStatus,
      comment,
      statusMessage,
      template
    });

    // Generate HTML content
    const html = await this.generateHTMLContent({
      complaint,
      recipient,
      newStatus,
      previousStatus,
      comment,
      statusMessage,
      template,
      additionalData
    });

    return { subject, text, html };
  }

  /**
   * Generate email subject line with dynamic app name
   * 
   * @param {Object} complaint - Complaint object
   * @param {string} status - New status
   * @param {string} role - Recipient role
   * @returns {string} Subject line
   */
  async generateSubjectLine(complaint, status, role, language = 'en') {
    const complaintId = complaint.complaintId || `#${complaint.id.slice(-6)}`;
    const appName = await getSystemConfigValue('APP_NAME', 'Fix_Smart_CMS');
    
    const template = SUBJECT_TEMPLATES[role]?.[language] || 
                    SUBJECT_TEMPLATES[role]?.['en'] ||
                    `Complaint {complaintId} - Status Updated to {status} - ${appName}`;

    return template
      .replace('{complaintId}', complaintId)
      .replace('{status}', status)
      .replace('{appName}', appName);
  }

  /**
   * Generate plain text email content
   * 
   * @param {Object} params - Text generation parameters
   * @returns {string} Plain text content
   */
  generateTextContent({
    complaint,
    recipient,
    newStatus,
    previousStatus,
    comment,
    statusMessage,
    template
  }) {
    const complaintId = complaint.complaintId || `#${complaint.id.slice(-6)}`;
    let text = `Hello ${recipient.fullName},\n\n`;
    
    text += `${statusMessage}\n\n`;
    
    text += `Complaint Details:\n`;
    text += `- ID: ${complaintId}\n`;
    text += `- Type: ${complaint.type || 'General'}\n`;
    text += `- Status: ${newStatus}\n`;
    text += `- Priority: ${complaint.priority || 'Medium'}\n`;
    text += `- Area: ${complaint.area || 'Not specified'}\n`;
    text += `- Submitted: ${new Date(complaint.submittedOn).toLocaleDateString()}\n`;

    if (previousStatus && previousStatus !== newStatus) {
      text += `- Previous Status: ${previousStatus}\n`;
    }

    if (comment && template.showInternalComments) {
      text += `\nRemarks: ${comment}\n`;
    }

    if (template.showAssignmentDetails) {
      if (complaint.wardOfficer) {
        text += `\nWard Officer: ${complaint.wardOfficer.fullName}\n`;
      }
      if (complaint.maintenanceTeam) {
        text += `Maintenance Team: ${complaint.maintenanceTeam.fullName}\n`;
      }
    }

    text += `\nThank you for using Fix_Smart_CMS.\n`;
    text += `This is an automated message. Please do not reply to this email.`;

    return text;
  }

  /**
   * Generate HTML email content with responsive design following OTP email template
   * 
   * @param {Object} params - HTML generation parameters
   * @returns {Promise<string>} HTML content
   */
  async generateHTMLContent({
    complaint,
    recipient,
    newStatus,
    previousStatus,
    comment,
    statusMessage,
    template,
    additionalData
  }) {
    const complaintId = complaint.complaintId || `#${complaint.id.slice(-6)}`;
    const statusColor = this.getStatusColor(newStatus);
    const priorityColor = this.getPriorityColor(complaint.priority);
    
    // Get dynamic configuration
    const appConfig = await getAppConfig();
    const customization = getTemplateCustomization();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complaint Status Update - ${appConfig.appName}</title>
    <style>
        /* Reset and base styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${customization.fonts.primary}; line-height: 1.6; color: #333; background-color: #f8f9fa; }
        
        /* Container - following OTP email design */
        .email-container { max-width: ${customization.layout.maxWidth}; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .email-content { background-color: white; padding: 30px; border-radius: ${customization.layout.borderRadius}; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        
        /* Header - similar to OTP email */
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: ${customization.brandColors.primary}; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: #6b7280; font-size: 16px; margin-top: 5px; }
        
        /* Greeting section - following OTP email style */
        .greeting-section { background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin-bottom: 25px; }
        .greeting { color: #1e40af; margin: 0 0 10px 0; font-size: 20px; font-weight: 600; }
        .status-message { color: #374151; line-height: 1.6; margin: 0; font-size: 16px; }
        
        /* Status highlight - similar to OTP code display */
        .status-highlight { text-align: center; margin: 30px 0; }
        .status-badge { background-color: ${statusColor}; color: white; font-size: 18px; font-weight: bold; padding: 15px 25px; border-radius: 8px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; }
        .status-note { margin: 15px 0 0 0; color: #6b7280; font-size: 14px; }
        
        /* Complaint details card */
        .complaint-card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .complaint-header { margin-bottom: 15px; }
        .complaint-id { font-size: 18px; font-weight: 700; color: #1f2937; }
        
        /* Details grid */
        .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 15px; }
        .detail-item { margin-bottom: 8px; }
        .detail-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
        .detail-value { font-size: 14px; color: #1f2937; font-weight: 500; }
        
        /* Priority badge */
        .priority-badge { background-color: ${priorityColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        
        /* Comments section - similar to OTP security note */
        .comments-section { background-color: #fef3c7; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .comments-title { font-size: 14px; font-weight: 600; color: #92400e; margin-bottom: 8px; }
        .comment-text { font-size: 14px; color: #92400e; margin: 0; }
        
        /* Assignment section */
        .assignment-section { border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px; }
        .assignment-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
        .assignment-item { display: flex; align-items: center; margin-bottom: 6px; }
        .assignment-role { font-size: 12px; color: #6b7280; font-weight: 600; margin-right: 8px; min-width: 90px; }
        .assignment-name { font-size: 14px; color: #1f2937; }
        
        /* Footer - following OTP email style */
        .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; }
        .footer p { margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; }
        .footer .brand { font-size: 14px; font-weight: 600; color: ${customization.brandColors.primary}; margin-bottom: 8px; }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container { margin: 0; padding: 10px; }
            .email-content { padding: 20px; }
            .details-grid { grid-template-columns: 1fr; }
            .assignment-item { flex-direction: column; align-items: flex-start; }
            .assignment-role { margin-bottom: 2px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            <!-- Header - following OTP email design -->
            <div class="header">
                <h1>🔔 ${appConfig.appName}</h1>
                <p>Complaint Status Update</p>
            </div>
            
            <!-- Greeting section - similar to OTP email -->
            <div class="greeting-section">
                <h2 class="greeting">Hello ${recipient.fullName},</h2>
                <p class="status-message">${statusMessage}</p>
            </div>
            
            <!-- Status highlight - similar to OTP code display -->
            <div class="status-highlight">
                <div class="status-badge">${newStatus}</div>
                <p class="status-note">Complaint ${complaintId} status updated</p>
            </div>
            
            <!-- Complaint Details Card -->
            <div class="complaint-card">
                <div class="complaint-header">
                    <div class="complaint-id">Complaint Details: ${complaintId}</div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Type</div>
                        <div class="detail-value">${complaint.type || 'General'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Priority</div>
                        <div class="detail-value">
                            <span class="priority-badge">${complaint.priority || 'Medium'}</span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Area</div>
                        <div class="detail-value">${complaint.area || 'Not specified'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Submitted</div>
                        <div class="detail-value">${new Date(complaint.submittedOn).toLocaleDateString()}</div>
                    </div>
                    ${complaint.ward ? `
                    <div class="detail-item">
                        <div class="detail-label">Ward</div>
                        <div class="detail-value">${complaint.ward.name}</div>
                    </div>
                    ` : ''}
                    ${complaint.subZone ? `
                    <div class="detail-item">
                        <div class="detail-label">Sub-Zone</div>
                        <div class="detail-value">${complaint.subZone.name}</div>
                    </div>
                    ` : ''}
                    ${previousStatus && previousStatus !== newStatus ? `
                    <div class="detail-item">
                        <div class="detail-label">Previous Status</div>
                        <div class="detail-value">${previousStatus}</div>
                    </div>
                    ` : ''}
                </div>
                
                ${comment && template.showInternalComments ? `
                <div class="comments-section">
                    <div class="comments-title">📝 Remarks</div>
                    <div class="comment-text">${comment}</div>
                </div>
                ` : ''}
                
                ${template.showAssignmentDetails && (complaint.wardOfficer || complaint.maintenanceTeam) ? `
                <div class="assignment-section">
                    <div class="assignment-title">👥 Assignment Details</div>
                    ${complaint.wardOfficer ? `
                    <div class="assignment-item">
                        <div class="assignment-role">Ward Officer:</div>
                        <div class="assignment-name">${complaint.wardOfficer.fullName}</div>
                    </div>
                    ` : ''}
                    ${complaint.maintenanceTeam ? `
                    <div class="assignment-item">
                        <div class="assignment-role">Maintenance:</div>
                        <div class="assignment-name">${complaint.maintenanceTeam.fullName}</div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
            
            ${recipient.role === 'CITIZEN' ? `
            <div style="background-color: #f0fff4; border: 1px solid #9ae6b4; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #22543d; font-size: 14px; margin: 0;">
                    💡 <strong>Track Your Complaint:</strong> You can always check the latest status of your complaint by logging into your citizen dashboard or using our public tracking system.
                </p>
            </div>
            ` : ''}
            
            <!-- Footer - following OTP email style -->
            <div class="footer">
                <div class="brand">${appConfig.appName}</div>
                <p>This is an automated message from ${appConfig.organizationName}.</p>
                <p>Please do not reply to this email.</p>
                ${customization.branding.websiteUrl ? `<p style="margin-top: 8px;"><a href="${customization.branding.websiteUrl}" style="color: ${customization.brandColors.primary};">${customization.branding.websiteUrl}</a></p>` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Get status color for styling
   * 
   * @param {string} status - Complaint status
   * @returns {string} Color code
   */
  getStatusColor(status) {
    return STATUS_COLORS[status] || STATUS_COLORS.REGISTERED;
  }

  /**
   * Get priority color for styling
   * 
   * @param {string} priority - Complaint priority
   * @returns {string} Color code
   */
  getPriorityColor(priority) {
    return PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM;
  }

  /**
   * Send complaint assignment notification
   * 
   * @param {Object} params - Assignment parameters
   * @returns {Promise<Object>} Broadcast result
   */
  async broadcastAssignmentUpdate({
    complaintId,
    assignedToUserId,
    assignedByUserId,
    assignmentType, // 'ward_officer' or 'maintenance_team'
    comment = null
  }) {
    return await this.broadcastStatusUpdate({
      complaintId,
      newStatus: 'ASSIGNED',
      comment: comment || `Complaint assigned to ${assignmentType.replace('_', ' ')}`,
      updatedByUserId: assignedByUserId,
      additionalData: {
        assignmentType,
        assignedToUserId
      }
    });
  }

  /**
   * Send complaint creation notification
   * 
   * @param {Object} params - Creation parameters
   * @returns {Promise<Object>} Broadcast result
   */
  async broadcastComplaintCreated({
    complaintId,
    createdByUserId
  }) {
    return await this.broadcastStatusUpdate({
      complaintId,
      newStatus: 'REGISTERED',
      comment: 'New complaint registered in the system',
      updatedByUserId: createdByUserId,
      additionalData: {
        isNewComplaint: true
      }
    });
  }
}

// Create singleton instance
const emailBroadcaster = new ComplaintEmailBroadcaster();

// Export both the class and singleton instance
export { ComplaintEmailBroadcaster, emailBroadcaster };
export default emailBroadcaster;