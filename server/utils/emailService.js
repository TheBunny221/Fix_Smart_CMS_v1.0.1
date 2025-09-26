import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Global singleton transporter instance
let transporterInstance = null;
let isInitializing = false;
let initPromise = null;

const buildProdTransport = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_SERVICE,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const buildDevTransportWithEnv = () =>
  nodemailer.createTransport({
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

async function buildDevTransportWithEthereal() {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
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

async function initializeTransporterIfNeeded() {
  if (transporterInstance || isInitializing) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      const isProd = process.env.NODE_ENV === "production";
      if (isProd) {
        transporterInstance = buildProdTransport();
      } else {
        const hasCustomDevSmtp = !!(
          process.env.EMAIL_SERVICE ||
          process.env.EMAIL_USER ||
          process.env.EMAIL_PASS
        );

        if (hasCustomDevSmtp) {
          transporterInstance = buildDevTransportWithEnv();
        } else {
          transporterInstance = await buildDevTransportWithEthereal();
          console.log(
            "📨 Using Ethereal test account for emails in development (singleton)",
          );
        }
      }

      // Verify transporter once on init to surface configuration issues early
      try {
        await transporterInstance.verify();
        console.log("✅ Email transporter verified and ready");
      } catch (verifyErr) {
        console.warn(
          "⚠️ Email transporter verification failed:",
          verifyErr?.message || verifyErr,
        );
      }

      return transporterInstance;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

export async function getEmailTransporter() {
  if (transporterInstance) return transporterInstance;
  await initializeTransporterIfNeeded();
  return transporterInstance;
}

// Send email function (uses global transporter)
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = await getEmailTransporter();

    const mailOptions = {
      from:
        process.env.EMAIL_FROM || "NLC-CMS <no-reply@cochinsmartcity.local>",
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Email sent successfully!");
      console.log("📧 Message ID:", info.messageId);
      console.log("📬 To:", to);
      console.log("📝 Subject:", subject);

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("🔗 Preview URL (Ethereal):", previewUrl);
        console.log("💡 Open this URL to see the sent email in your browser");
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

// Send OTP email
export const sendOTPEmail = async (
  email,
  otpCode,
  purposeOrOptions = "verification",
) => {
  const isOptionsObject =
    purposeOrOptions && typeof purposeOrOptions === "object";
  const {
    purpose = "verification",
    fullName = "Citizen",
    contextId = null,
    contextLabel = null,
  } = isOptionsObject ? purposeOrOptions : { purpose: purposeOrOptions };

  const normalized = String(purpose || "verification").toLowerCase();

  const resolveMeta = () => {
    switch (normalized) {
      case "login":
        return {
          subject: "OTP for Login - NLC-CMS",
          title: "Login Verification",
          intro:
            "You've requested to login to your account. Please use the verification code below.",
        };
      case "registration":
      case "verify":
      case "verification":
        return {
          subject: "OTP for Email Verification - NLC-CMS",
          title: "Email Verification",
          intro:
            "Please use the verification code below to verify your email address.",
        };
      case "complaint_verification":
        return {
          subject: `OTP for Complaint Verification${contextId ? ` - ${contextId}` : ""}`,
          title: "Complaint Verification",
          intro: contextId
            ? `You're verifying complaint ${contextId}. Use the code below to continue.`
            : "Use the verification code below to continue.",
        };
      case "complaint_tracking":
        return {
          subject: `OTP for Complaint Tracking${contextId ? ` - ${contextId}` : ""}`,
          title: "Complaint Verification",
          intro: contextId
            ? `You've requested to track your complaint ${contextId}. Please use the verification code below to access your complaint details.`
            : "Use the verification code below to access your complaint details.",
        };
      case "service_request":
        return {
          subject: `OTP for Service Request Verification${contextId ? ` - ${contextId}` : ""}`,
          title: "Service Request Verification",
          intro:
            contextLabel
              ? `You're verifying your ${contextLabel} request${
                  contextId ? ` (${contextId})` : ""
                }. Use the code below to continue.`
              : "Use the verification code below to verify your service request.",
        };
      default:
        return {
          subject: "OTP for Verification - NLC-CMS",
          title: "Verification",
          intro:
            "Please use the verification code below to complete your action.",
        };
    }
  };

  const { subject, title, intro } = resolveMeta();

  const greetingName = fullName || "Citizen";

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🔐 ${title}</h1>
          </div>

          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
            <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 20px;">Hello ${greetingName},</h2>
            <p style="margin: 0; color: #374151; line-height: 1.6;">
              ${intro}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #1f2937; color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 8px; display: inline-block;">
              ${otpCode}
            </div>
            <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
              This code will expire in 10 minutes
            </p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Security Note:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
        </div>
      </div>
    `;

  const text = `${intro} OTP: ${otpCode}. This code will expire in 10 minutes.`;

  return await sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};

// Send password setup email
export const sendPasswordSetupEmail = async (email, fullName, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NLC-CMS</h1>
        <p style="color: white; margin: 5px 0 0 0;">E-Governance Portal</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Set Your Password</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hello ${fullName},
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Welcome to NLC-CMS E-Governance Portal! Your account has been created successfully.
          To secure your account and enable password-based login, please set your password by clicking the button below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Set Your Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link in your browser:
          <br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          This link will expire in <strong>10 minutes</strong> for security reasons.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Note: You can always login using OTP sent to your email if you prefer not to set a password.
        </p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from NLC-CMS E-Governance Portal.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: "Set Your Password - NLC-CMS",
    text: `Hello ${fullName}, Please set your password for NLC-CMS E-Governance Portal by clicking this link: ${resetUrl}. This link will expire in 10 minutes.`,
    html,
  });
};

// Send complaint status update email
export const sendComplaintStatusEmail = async (
  email,
  fullName,
  complaintId,
  status,
  comment,
) => {
  const statusMessages = {
    REGISTERED: "Your complaint has been registered successfully.",
    ASSIGNED: "Your complaint has been assigned to our maintenance team.",
    IN_PROGRESS: "Work on your complaint is currently in progress.",
    RESOLVED: "Your complaint has been resolved successfully.",
    CLOSED: "Your complaint has been closed.",
    REOPENED: "Your complaint has been reopened for further action.",
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NLC-CMS</h1>
        <p style="color: white; margin: 5px 0 0 0;">E-Governance Portal</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Complaint Status Update</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hello ${fullName},
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Complaint ID:</strong> ${complaintId}
          </p>
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Status:</strong> <span style="color: #667eea; font-weight: bold;">${status}</span>
          </p>
          <p style="margin: 0; color: #666;">
            ${statusMessages[status] || "Your complaint status has been updated."}
          </p>
          ${comment ? `<p style="margin: 15px 0 0 0; color: #666;"><strong>Additional Details:</strong> ${comment}</p>` : ""}
        </div>
        
        <p style="color: #666; font-size: 14px;">
          You can track your complaint anytime by logging into your citizen dashboard or using our public tracking system.
        </p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from NLC-CMS E-Governance Portal.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: `Complaint ${complaintId} - Status Updated to ${status}`,
    text: `Hello ${fullName}, Your complaint ${complaintId} status has been updated to ${status}. ${statusMessages[status] || ""} ${comment ? `Additional details: ${comment}` : ""}`,
    html,
  });
};

// Send welcome email for new citizen
export const sendWelcomeEmail = async (email, fullName, complaintId) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to NLC-CMS!</h1>
        <p style="color: white; margin: 5px 0 0 0;">E-Governance Portal</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Account Created Successfully</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Hello ${fullName},
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Welcome to NLC-CMS E-Governance Portal! Your complaint has been verified and you have been automatically registered as a citizen.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ade80;">
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Your Complaint ID:</strong> ${complaintId}
          </p>
          <p style="margin: 0; color: #666;">
            You are now logged in and can track your complaint progress from your citizen dashboard.
          </p>
        </div>
        
        <h3 style="color: #333; margin: 30px 0 15px 0;">What you can do now:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li>Track your current complaint progress</li>
          <li>Submit new complaints easily</li>
          <li>Receive real-time updates on complaint status</li>
          <li>Provide feedback on resolved complaints</li>
          <li>Access your citizen dashboard anytime</li>
        </ul>
        
        <h3 style="color: #333; margin: 30px 0 15px 0;">Login Options:</h3>
        <ul style="color: #666; line-height: 1.8;">
          <li><strong>OTP Login:</strong> Always available - we'll send you an OTP via email</li>
          <li><strong>Password Login:</strong> Set a password from your profile settings for quick access</li>
        </ul>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Thank you for choosing NLC-CMS E-Governance Portal for your civic needs.
        </p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from NLC-CMS E-Governance Portal.</p>
        <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: "Welcome to NLC-CMS - Account Created",
    text: `Hello ${fullName}, Welcome to NLC-CMS E-Governance Portal! Your complaint ${complaintId} has been verified and you have been registered as a citizen. You can now access your dashboard and track your complaint progress.`,
    html,
  });
};

// Kick off initialization on module load (non-blocking)
void initializeTransporterIfNeeded();

export default {
  getEmailTransporter,
  sendEmail,
  sendOTPEmail,
  sendPasswordSetupEmail,
  sendComplaintStatusEmail,
  sendWelcomeEmail,
};
