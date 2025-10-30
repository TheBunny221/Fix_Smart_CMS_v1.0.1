/**
 * Email Broadcaster Test Script
 * 
 * This script tests the email broadcaster system with sample data
 * to ensure all components are working correctly.
 * 
 * Usage: node server/scripts/testEmailBroadcaster.js
 */

import { getPrisma } from "../db/connection.js";
import emailBroadcaster from "../services/emailBroadcaster.js";
import systemConfigCache from "../services/systemConfigCache.js";
import logger from "../utils/logger.js";

const prisma = getPrisma();

async function createTestData() {
  console.log("🔧 Creating test data...");

  // Initialize SystemConfig cache if not already done
  if (!systemConfigCache.isInitialized) {
    await systemConfigCache.initialize();
  }

  // Create test system config entries
  await prisma.systemConfig.upsert({
    where: { key: 'APP_NAME' },
    update: {},
    create: {
      key: 'APP_NAME',
      value: 'Test Smart CMS',
      type: 'app',
      description: 'Application name for testing'
    }
  });

  await prisma.systemConfig.upsert({
    where: { key: 'ORGANIZATION_NAME' },
    update: {},
    create: {
      key: 'ORGANIZATION_NAME',
      value: 'Test City Corporation',
      type: 'app',
      description: 'Organization name for testing'
    }
  });

  // Refresh cache to pick up test config
  await systemConfigCache.forceRefresh();

  // Create test ward
  const ward = await prisma.ward.upsert({
    where: { name: "Test Ward" },
    update: {},
    create: {
      name: "Test Ward",
      description: "Test ward for email broadcaster testing"
    }
  });

  // Create test users
  const citizen = await prisma.user.upsert({
    where: { email: "test.citizen@example.com" },
    update: {},
    create: {
      email: "test.citizen@example.com",
      fullName: "Test Citizen",
      phoneNumber: "+91-9876543210",
      role: "CITIZEN",
      isActive: true
    }
  });

  const wardOfficer = await prisma.user.upsert({
    where: { email: "test.officer@example.com" },
    update: {},
    create: {
      email: "test.officer@example.com",
      fullName: "Test Ward Officer",
      phoneNumber: "+91-9876543211",
      role: "WARD_OFFICER",
      wardId: ward.id,
      isActive: true
    }
  });

  const maintenanceTeam = await prisma.user.upsert({
    where: { email: "test.maintenance@example.com" },
    update: {},
    create: {
      email: "test.maintenance@example.com",
      fullName: "Test Maintenance Team",
      phoneNumber: "+91-9876543212",
      role: "MAINTENANCE_TEAM",
      wardId: ward.id,
      isActive: true
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "test.admin@example.com" },
    update: {},
    create: {
      email: "test.admin@example.com",
      fullName: "Test Administrator",
      phoneNumber: "+91-9876543213",
      role: "ADMINISTRATOR",
      isActive: true
    }
  });

  // Create test complaint
  const complaint = await prisma.complaint.create({
    data: {
      complaintId: "TEST001",
      title: "Test Street Light Issue",
      description: "Test complaint for email broadcaster validation",
      type: "STREET_LIGHTING",
      status: "REGISTERED",
      priority: "MEDIUM",
      slaStatus: "ON_TIME",
      wardId: ward.id,
      area: "Test Area",
      landmark: "Test Landmark",
      address: "Test Address, Test City",
      contactName: citizen.fullName,
      contactEmail: citizen.email,
      contactPhone: citizen.phoneNumber,
      submittedById: citizen.id,
      wardOfficerId: wardOfficer.id,
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
    }
  });

  console.log("✅ Test data created successfully");
  return { complaint, citizen, wardOfficer, maintenanceTeam, admin };
}

async function testStatusUpdates(testData) {
  const { complaint, wardOfficer, maintenanceTeam } = testData;
  
  console.log("\n📧 Testing status update emails...");

  // Test 1: Assignment to maintenance team
  console.log("Test 1: Assigning complaint to maintenance team");
  const result1 = await emailBroadcaster.broadcastStatusUpdate({
    complaintId: complaint.id,
    newStatus: 'ASSIGNED',
    previousStatus: 'REGISTERED',
    comment: 'Complaint assigned to maintenance team for resolution',
    updatedByUserId: wardOfficer.id,
    additionalData: {
      assignmentType: 'maintenance_team',
      assignedToUserId: maintenanceTeam.id
    }
  });
  console.log("Result:", result1);

  // Test 2: Work in progress
  console.log("\nTest 2: Updating status to IN_PROGRESS");
  const result2 = await emailBroadcaster.broadcastStatusUpdate({
    complaintId: complaint.id,
    newStatus: 'IN_PROGRESS',
    previousStatus: 'ASSIGNED',
    comment: 'Started working on the street light repair',
    updatedByUserId: maintenanceTeam.id,
    additionalData: {
      isMaintenanceUpdate: true
    }
  });
  console.log("Result:", result2);

  // Test 3: Resolution
  console.log("\nTest 3: Resolving complaint");
  const result3 = await emailBroadcaster.broadcastStatusUpdate({
    complaintId: complaint.id,
    newStatus: 'RESOLVED',
    previousStatus: 'IN_PROGRESS',
    comment: 'Street light has been repaired and is now working properly',
    updatedByUserId: maintenanceTeam.id,
    additionalData: {
      isResolution: true
    }
  });
  console.log("Result:", result3);

  // Test 4: Closure
  console.log("\nTest 4: Closing complaint");
  const result4 = await emailBroadcaster.broadcastStatusUpdate({
    complaintId: complaint.id,
    newStatus: 'CLOSED',
    previousStatus: 'RESOLVED',
    comment: 'Complaint closed after successful resolution',
    updatedByUserId: wardOfficer.id,
    additionalData: {
      isClosure: true
    }
  });
  console.log("Result:", result4);

  console.log("✅ All status update tests completed");
}

async function testRecipientFiltering(testData) {
  const { complaint } = testData;
  
  console.log("\n🎯 Testing recipient filtering...");

  // Get complaint with relations for testing
  const complaintWithRelations = await emailBroadcaster.getComplaintWithRelations(complaint.id);
  
  // Test recipient determination for different statuses
  const statuses = ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  
  for (const status of statuses) {
    console.log(`\nTesting recipients for status: ${status}`);
    const recipients = await emailBroadcaster.determineRecipients(complaintWithRelations, status);
    
    console.log(`Found ${recipients.length} recipients:`);
    recipients.forEach(recipient => {
      console.log(`  - ${recipient.fullName} (${recipient.role}) - ${recipient.email}`);
      console.log(`    Allowed statuses: ${recipient.template.allowedStatuses.join(', ')}`);
      console.log(`    Show internal comments: ${recipient.template.showInternalComments}`);
    });
  }

  console.log("✅ Recipient filtering tests completed");
}

async function testSystemConfigIntegration() {
  console.log("\n⚙️ Testing SystemConfig integration...");
  
  const appConfig = systemConfigCache.getAppConfig();
  console.log("App Config:", appConfig);
  
  const emailConfig = systemConfigCache.getEmailConfig();
  console.log("Email Config:", emailConfig);
  
  const cacheStats = systemConfigCache.getStats();
  console.log("Cache Stats:", cacheStats);
  
  console.log("✅ SystemConfig integration tests completed");
}

async function testEmailTemplates(testData) {
  const { complaint, citizen, wardOfficer } = testData;
  
  console.log("\n🎨 Testing email template generation...");

  // Test citizen template
  console.log("Testing citizen email template...");
  const citizenContent = await emailBroadcaster.generateEmailContent({
    complaint,
    recipient: {
      id: citizen.id,
      email: citizen.email,
      fullName: citizen.fullName,
      role: 'CITIZEN',
      language: 'en',
      template: emailBroadcaster.constructor.prototype.constructor.EMAIL_TEMPLATES?.CITIZEN || {
        allowedStatuses: ['REGISTERED', 'ASSIGNED', 'RESOLVED', 'CLOSED', 'REOPENED'],
        showInternalComments: false,
        showAssignmentDetails: false,
        templateType: 'citizen'
      }
    },
    newStatus: 'RESOLVED',
    previousStatus: 'IN_PROGRESS',
    comment: 'Your street light has been repaired',
    updatedByUserId: wardOfficer.id
  });
  
  console.log("Citizen email subject:", citizenContent.subject);
  console.log("Citizen email text length:", citizenContent.text.length);
  console.log("Citizen email HTML length:", citizenContent.html.length);

  // Test staff template
  console.log("\nTesting staff email template...");
  const staffContent = await emailBroadcaster.generateEmailContent({
    complaint,
    recipient: {
      id: wardOfficer.id,
      email: wardOfficer.email,
      fullName: wardOfficer.fullName,
      role: 'WARD_OFFICER',
      language: 'en',
      template: emailBroadcaster.constructor.prototype.constructor.EMAIL_TEMPLATES?.WARD_OFFICER || {
        allowedStatuses: ['REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'],
        showInternalComments: true,
        showAssignmentDetails: true,
        templateType: 'staff'
      }
    },
    newStatus: 'RESOLVED',
    previousStatus: 'IN_PROGRESS',
    comment: 'Street light repair completed with new LED bulb',
    updatedByUserId: wardOfficer.id
  });
  
  console.log("Staff email subject:", staffContent.subject);
  console.log("Staff email text length:", staffContent.text.length);
  console.log("Staff email HTML length:", staffContent.html.length);

  console.log("✅ Email template tests completed");
}

async function cleanupTestData(testData) {
  console.log("\n🧹 Cleaning up test data...");
  
  const { complaint } = testData;
  
  try {
    // Delete in reverse order of creation due to foreign key constraints
    await prisma.statusLog.deleteMany({
      where: { complaintId: complaint.id }
    });
    
    await prisma.complaint.delete({
      where: { id: complaint.id }
    });
    
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "test.citizen@example.com",
            "test.officer@example.com", 
            "test.maintenance@example.com",
            "test.admin@example.com"
          ]
        }
      }
    });
    
    await prisma.ward.delete({
      where: { name: "Test Ward" }
    });
    
    console.log("✅ Test data cleaned up successfully");
  } catch (error) {
    console.warn("⚠️ Some test data may not have been cleaned up:", error.message);
  }
}

async function runTests() {
  console.log("🚀 Starting Email Broadcaster System Tests\n");
  
  let testData;
  
  try {
    // Create test data
    testData = await createTestData();
    
    // Run tests
    await testSystemConfigIntegration();
    await testRecipientFiltering(testData);
    await testEmailTemplates(testData);
    await testStatusUpdates(testData);
    
    console.log("\n🎉 All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    logger.error("Email broadcaster test failed", {
      error: error.message,
      stack: error.stack
    });
  } finally {
    // Cleanup
    if (testData) {
      await cleanupTestData(testData);
    }
    
    // Close database connection
    await prisma.$disconnect();
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
export default runTests;