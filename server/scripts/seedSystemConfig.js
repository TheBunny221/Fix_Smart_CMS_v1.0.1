/**
 * SystemConfig Seed Script
 * 
 * Seeds the SystemConfig table with default values for the email broadcaster
 * and other system components.
 * 
 * Usage: node server/scripts/seedSystemConfig.js
 */

import { loadEnvironmentConfig } from "../config/environment.js";
import { getPrisma } from "../db/connection.js";
import logger from "../utils/logger.js";

// Load environment configuration
loadEnvironmentConfig();

console.log('🚀 Starting SystemConfig seeding script...');

const prisma = getPrisma();

const defaultConfigs = [
  // App Configuration
  {
    key: 'APP_NAME',
    value: 'Fix_Smart_CMS',
    type: 'app',
    description: 'Application display name used in emails and UI'
  },
  {
    key: 'APP_VERSION',
    value: '1.0.3',
    type: 'app',
    description: 'Current application version'
  },
  {
    key: 'ORGANIZATION_NAME',
    value: 'Smart City Management',
    type: 'app',
    description: 'Organization name for branding'
  },
  {
    key: 'WEBSITE_URL',
    value: 'https://fix-smart-cms.gov.in',
    type: 'app',
    description: 'Organization website URL'
  },
  {
    key: 'SUPPORT_EMAIL',
    value: 'support@fix-smart-cms.gov.in',
    type: 'app',
    description: 'Support contact email address'
  },
  
  // Visual Branding
  {
    key: 'PRIMARY_COLOR',
    value: '#667eea',
    type: 'branding',
    description: 'Primary brand color for UI and emails'
  },
  {
    key: 'SECONDARY_COLOR',
    value: '#764ba2',
    type: 'branding',
    description: 'Secondary brand color for accents'
  },
  {
    key: 'LOGO_URL',
    value: null,
    type: 'branding',
    description: 'Organization logo URL (optional)'
  },
  
  // Email Configuration
  {
    key: 'EMAIL_FROM_NAME',
    value: 'Fix_Smart_CMS',
    type: 'email',
    description: 'Display name for outgoing emails'
  },
  {
    key: 'EMAIL_FROM_ADDRESS',
    value: 'noreply@fix-smart-cms.gov.in',
    type: 'email',
    description: 'From email address for outgoing emails'
  },
  {
    key: 'EMAIL_REPLY_TO',
    value: 'support@fix-smart-cms.gov.in',
    type: 'email',
    description: 'Reply-to email address'
  },
  {
    key: 'EMAIL_FOOTER_TEXT',
    value: 'This is an automated message. Please do not reply to this email.',
    type: 'email',
    description: 'Standard footer text for emails'
  },
  
  // Complaint System Configuration
  {
    key: 'COMPLAINT_ID_PREFIX',
    value: 'KSC',
    type: 'complaint',
    description: 'Prefix for complaint IDs'
  },
  {
    key: 'COMPLAINT_ID_LENGTH',
    value: '4',
    type: 'complaint',
    description: 'Length of complaint ID number part'
  },
  {
    key: 'COMPLAINT_ID_START_NUMBER',
    value: '1',
    type: 'complaint',
    description: 'Starting number for complaint IDs'
  },
  {
    key: 'AUTO_ASSIGN_COMPLAINTS',
    value: 'true',
    type: 'complaint',
    description: 'Automatically assign complaints to ward officers'
  },
  
  // System Settings
  {
    key: 'MAINTENANCE_MODE',
    value: 'false',
    type: 'system',
    description: 'Enable maintenance mode'
  },
  {
    key: 'REGISTRATION_ENABLED',
    value: 'true',
    type: 'system',
    description: 'Allow new user registrations'
  },
  {
    key: 'MAX_FILE_UPLOAD_SIZE',
    value: '10485760', // 10MB in bytes
    type: 'system',
    description: 'Maximum file upload size in bytes'
  },
  {
    key: 'ALLOWED_FILE_TYPES',
    value: 'jpg,jpeg,png,pdf,doc,docx',
    type: 'system',
    description: 'Comma-separated list of allowed file extensions'
  }
];

async function seedSystemConfig() {
  console.log('🌱 Seeding SystemConfig table...');
  
  try {
    // Test database connection
    console.log('Testing database connection...');
    const testCount = await prisma.systemConfig.count();
    console.log(`Found ${testCount} existing SystemConfig entries`);
    
  } catch (connectionError) {
    console.error('❌ Database connection failed:', connectionError.message);
    throw connectionError;
  }
  
  try {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const config of defaultConfigs) {
      const existing = await prisma.systemConfig.findUnique({
        where: { key: config.key }
      });
      
      if (existing) {
        if (existing.value !== config.value || existing.description !== config.description) {
          await prisma.systemConfig.update({
            where: { key: config.key },
            data: {
              value: config.value,
              type: config.type,
              description: config.description,
              isActive: true
            }
          });
          updated++;
          console.log(`✅ Updated: ${config.key} = ${config.value}`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped: ${config.key} (no changes)`);
        }
      } else {
        await prisma.systemConfig.create({
          data: {
            key: config.key,
            value: config.value,
            type: config.type,
            description: config.description,
            isActive: true
          }
        });
        created++;
        console.log(`🆕 Created: ${config.key} = ${config.value}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total:   ${defaultConfigs.length}`);
    
    console.log('\n✅ SystemConfig seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding SystemConfig:', error);
    logger.error('SystemConfig seeding failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📋 Script execution detected, starting seeding...');
  seedSystemConfig()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedSystemConfig };
export default seedSystemConfig;