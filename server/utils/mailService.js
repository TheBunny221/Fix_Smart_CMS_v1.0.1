import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global singleton transporter instance
let transporterInstance = null;
let isInitializing = false;
let initPromise = null;

// Template cache
const templateCache = new Map();

/**
 * Build production email transporter
 */
const buildProdTransport = () =>
  nodemailer.createTransporter({
    host: process.env.EMAIL_SERVICE,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

/**
 * Build development email transporter with environment variables
 */
const buildDevTransportWithEnv = () =>
  nodemailer.createTransporter({
    host: process.env.EMAIL_SERVICE || "smtp.ethereal.email",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER || process.env.ETHEREAL_USER,
      pass: process.env.EMAIL_PASS || process.env.ETHEREAL_PASS,
    },
    debug: true,
    logger: true,
  });

/**
 * Build development email transporter with Ethereal test account
 */
async function buildDevTransportWithEthereal() {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransporter({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
    debug: true,
    logger: true,
  });
}

/**
 * Initialize email transporter if needed
 */
async function initializeTransporterIfNeeded() {
  if (transporterInstance) {
    return transporterInstance;
  }

  if (isInitializing) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      const isProduction = process.env.NODE_ENV === "production";
      
      if (isProduction) {
        transporterInstance = buildProdTransport();
      } else {
        // Try environment variables first, fallback to Ethereal
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          transporterInstance = buildDevTransportWithEnv();
        } else {
          transporterInstance = await buildDevTransportWithEthereal();
        }
      }

      // Verify transporter
      await transporterInstance.verify();
      logger.info("✅ Email transporter verified and ready");
      
      return transporterInstance;
    } catch (error) {
      logger.error("❌ Email transporter initialization failed:", error);
      transporterInstance = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Load and cache email template
 */
function loadTemplate(templateName) {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  try {
    const templatePath = path.join(process.cwd(), 'template', `${templateName}.html`);
    const template = fs.readFileSync(templatePath, 'utf8');
    templateCache.set(templateName, template);
    return template;
  } catch (error) {
    logger.error(`Failed to load template ${templateName}:`, error);
    throw new Error(`Template ${templateName} not found`);
  }
}

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(template, variables) {
  let result = template;
  
  // Replace simple variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });

  // Handle conditional blocks (basic implementation)
  result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
    return variables[condition] ? content : '';
  });

  // Handle each loops (basic implementation)
  result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, itemTemplate) => {
    const array = variables[arrayName];
    if (!Array.isArray(array)) return '';
    
    return array.map(item => {
      let itemContent = itemTemplate;
      Object.keys(item).forEach(key => {
        const regex = new RegExp(`{{this\\.${key}}}`, 'g');
        itemContent = itemContent.replace(regex, item[key] || '');
      });
      return itemContent;
    }).join('');
  });

  return result;
}

/**
 * Get environment-based URLs
 */
function getEnvironmentUrls() {
  const whost = process.env.WHOST || process.env.HOST || 'localhost';
  const wport = process.env.WPORT || process.env.PORT || '4005';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  return {
    WHOST: whost,
    WPORT: wport,
    APP_URL: `${protocol}://${whost}:${wport}`,
    LOGIN_URL: `${protocol}://${whost}:${wport}/login`,
    RESET_URL: `${protocol}://${whost}:${wport}/forgot-password`,
  };
}

/**
 * Send email using template
 */
export async function sendTemplatedEmail(to, subject, templateName, templateVariables = {}) {
  try {
    const transporter = await initializeTransporterIfNeeded();
    
    // Load template
    const template = loadTemplate(templateName);
    
    // Get environment URLs
    const envUrls = getEnvironmentUrls();
    
    // Merge variables with environment URLs and app name from SystemConfig
    const { getSystemConfig } = await import('../controller/systemConfigController.js');
    const appName = await getSystemConfig('APP_NAME') || 'NLC-CMS';
    
    const variables = {
      APP_NAME: appName,
      ...envUrls,
      ...templateVariables,
    };
    
    // Replace template variables
    const htmlContent = replaceTemplateVariables(template, variables);
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM || 'NLC-CMS'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`📧 Email sent successfully to ${to}`, {
      messageId: info.messageId,
      template: templateName,
    });

    // Log preview URL for development
    if (process.env.NODE_ENV !== 'production' && info.previewURL) {
      logger.info(`📧 Preview URL: ${info.previewURL}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewURL: info.previewURL,
    };
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(to, username, otp) {
  const envUrls = getEnvironmentUrls();
  
  return sendTemplatedEmail(to, 'Password Reset OTP - Verification Required', 'otp-mail', {
    USERNAME: username || 'User',
    EMAIL: to,
    OTP: otp,
    RESET_URL: `${envUrls.APP_URL}/forgot-password`,
  });
}

/**
 * Send welcome email with password setup link
 */
export async function sendWelcomeEmail(to, username, role, wardName, setupToken) {
  const envUrls = getEnvironmentUrls();
  
  return sendTemplatedEmail(to, 'Welcome to NLC-CMS - Set Up Your Password', 'welcome-mail', {
    USERNAME: username || 'User',
    EMAIL: to,
    ROLE: role || 'User',
    WARD_NAME: wardName || 'Not Assigned',
    CREATED_DATE: new Date().toLocaleDateString(),
    SETUP_URL: `${envUrls.APP_URL}/set-password/${setupToken}`,
  });
}

/**
 * Send password reset success email
 */
export async function sendPasswordResetSuccessEmail(to, username, ipAddress) {
  const envUrls = getEnvironmentUrls();
  
  return sendTemplatedEmail(to, 'Password Reset Successful - NLC-CMS', 'password-reset-success', {
    USERNAME: username || 'User',
    EMAIL: to,
    RESET_TIME: new Date().toLocaleString(),
    IP_ADDRESS: ipAddress || 'Unknown',
    LOGIN_URL: envUrls.LOGIN_URL,
  });
}

/**
 * Send complaint status update email
 */
export async function sendComplaintStatusEmail(to, complaintData) {
  const envUrls = getEnvironmentUrls();
  
  // Map status to CSS class
  const statusClassMap = {
    'SUBMITTED': 'submitted',
    'ASSIGNED': 'assigned',
    'IN_PROGRESS': 'in-progress',
    'RESOLVED': 'resolved',
    'CLOSED': 'closed',
  };
  
  return sendTemplatedEmail(to, `Complaint #${complaintData.id} Status Update`, 'complaint-status', {
    CITIZEN_NAME: complaintData.citizenName,
    COMPLAINT_ID: complaintData.id,
    COMPLAINT_TITLE: complaintData.title,
    COMPLAINT_TYPE: complaintData.type,
    LOCATION: complaintData.location,
    WARD_NAME: complaintData.wardName,
    STATUS: complaintData.status,
    STATUS_CLASS: statusClassMap[complaintData.status] || 'submitted',
    SUBMITTED_DATE: complaintData.submittedDate,
    ASSIGNED_TO: complaintData.assignedTo,
    ASSIGNED_CONTACT: complaintData.assignedContact,
    STATUS_MESSAGE: complaintData.statusMessage,
    UPDATED_BY: complaintData.updatedBy,
    UPDATE_TIME: complaintData.updateTime,
    TIMELINE: complaintData.timeline || [],
    COMPLAINT_URL: `${envUrls.APP_URL}/track-complaint/${complaintData.id}`,
    CONTACT_INFO: complaintData.contactInfo,
  });
}

/**
 * Legacy email function for backward compatibility
 */
export async function sendEmail(to, subject, text, html) {
  try {
    const transporter = await initializeTransporterIfNeeded();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM || 'NLC-CMS'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`📧 Legacy email sent successfully to ${to}`, {
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
      previewURL: info.previewURL,
    };
  } catch (error) {
    logger.error(`❌ Failed to send legacy email to ${to}:`, error);
    throw error;
  }
}

/**
 * Legacy password setup email function
 */
export async function sendPasswordSetupEmail(to, username, setupToken) {
  return sendWelcomeEmail(to, username, 'User', null, setupToken);
}

/**
 * Verify email transporter
 */
export async function verifyEmailTransporter() {
  try {
    const transporter = await initializeTransporterIfNeeded();
    await transporter.verify();
    return true;
  } catch (error) {
    logger.error("Email transporter verification failed:", error);
    return false;
  }
}

// Export default for backward compatibility
export default {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordSetupEmail,
  sendPasswordResetSuccessEmail,
  sendComplaintStatusEmail,
  sendTemplatedEmail,
  verifyEmailTransporter,
};