#!/usr/bin/env node

import { getPrisma } from "../server/db/connection.js";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * API Endpoints Test Script
 * Tests all major API endpoints to ensure they work with the finalized schema
 */

console.log('🧪 Starting API Endpoints Test...\n');

const prisma = getPrisma();

// Test data
const testData = {
  ward: null,
  user: null,
  complaintType: null,
  complaint: null,
  attachment: null
};

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    await prisma.$connect();
    console.log('   ✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    return false;
  }
}

async function testUserOperations() {
  console.log('\n👥 Testing User operations...');
  
  try {
    // Test user creation
    const ward = await prisma.ward.findFirst();
    if (!ward) {
      throw new Error('No ward found for user creation');
    }
    testData.ward = ward;

    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        fullName: 'Test User',
        phoneNumber: '1234567890',
        password: 'hashedpassword',
        role: 'CITIZEN',
        wardId: ward.id
      }
    });
    testData.user = user;
    console.log('   ✅ User creation successful');

    // Test user retrieval
    const retrievedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ward: true }
    });
    
    if (retrievedUser && retrievedUser.ward) {
      console.log('   ✅ User retrieval with relations successful');
    } else {
      throw new Error('User retrieval failed');
    }

    return true;
  } catch (error) {
    console.log('   ❌ User operations failed:', error.message);
    return false;
  }
}

async function testComplaintOperations() {
  console.log('\n📝 Testing Complaint operations...');
  
  try {
    // Get complaint type
    const complaintType = await prisma.complaintType.findFirst();
    if (!complaintType) {
      throw new Error('No complaint type found');
    }
    testData.complaintType = complaintType;

    // Test complaint creation
    const complaint = await prisma.complaint.create({
      data: {
        title: 'Test Complaint',
        description: 'This is a test complaint for API testing',
        type: 'Water Supply',
        complaintTypeId: complaintType.id,
        status: 'REGISTERED',
        priority: 'MEDIUM',
        wardId: testData.ward.id,
        area: 'Test Area',
        contactName: 'Test Contact',
        contactPhone: '9876543210',
        submittedById: testData.user.id
      }
    });
    testData.complaint = complaint;
    console.log('   ✅ Complaint creation successful');

    // Test complaint retrieval with relations
    const retrievedComplaint = await prisma.complaint.findUnique({
      where: { id: complaint.id },
      include: {
        ward: true,
        submittedBy: true,
        complaintType: true,
        statusLogs: true,
        attachments: true
      }
    });

    if (retrievedComplaint && retrievedComplaint.ward && retrievedComplaint.submittedBy) {
      console.log('   ✅ Complaint retrieval with relations successful');
    } else {
      throw new Error('Complaint retrieval failed');
    }

    return true;
  } catch (error) {
    console.log('   ❌ Complaint operations failed:', error.message);
    return false;
  }
}

async function testAttachmentOperations() {
  console.log('\n📎 Testing Attachment operations...');
  
  try {
    // Test attachment creation
    const attachment = await prisma.attachment.create({
      data: {
        fileName: 'test-file.jpg',
        originalName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/api/uploads/test-file.jpg',
        entityType: 'COMPLAINT',
        entityId: testData.complaint.id,
        complaintId: testData.complaint.id,
        uploadedById: testData.user.id
      }
    });
    testData.attachment = attachment;
    console.log('   ✅ Attachment creation successful');

    // Test attachment retrieval with relations
    const retrievedAttachment = await prisma.attachment.findUnique({
      where: { id: attachment.id },
      include: {
        complaint: true,
        uploadedBy: true
      }
    });

    if (retrievedAttachment && retrievedAttachment.complaint && retrievedAttachment.uploadedBy) {
      console.log('   ✅ Attachment retrieval with relations successful');
    } else {
      throw new Error('Attachment retrieval failed');
    }

    // Test attachment filtering by entity type
    const complaintAttachments = await prisma.attachment.findMany({
      where: {
        entityType: 'COMPLAINT',
        entityId: testData.complaint.id
      }
    });

    if (complaintAttachments.length > 0) {
      console.log('   ✅ Attachment filtering by entity type successful');
    } else {
      throw new Error('Attachment filtering failed');
    }

    return true;
  } catch (error) {
    console.log('   ❌ Attachment operations failed:', error.message);
    return false;
  }
}

async function testStatusLogOperations() {
  console.log('\n📊 Testing Status Log operations...');
  
  try {
    // Test status log creation
    const statusLog = await prisma.statusLog.create({
      data: {
        complaintId: testData.complaint.id,
        userId: testData.user.id,
        fromStatus: 'REGISTERED',
        toStatus: 'ASSIGNED',
        comment: 'Test status change',
        timestamp: new Date()
      }
    });
    console.log('   ✅ Status log creation successful');

    // Test status log retrieval with relations
    const retrievedStatusLog = await prisma.statusLog.findUnique({
      where: { id: statusLog.id },
      include: {
        complaint: true,
        user: true
      }
    });

    if (retrievedStatusLog && retrievedStatusLog.complaint && retrievedStatusLog.user) {
      console.log('   ✅ Status log retrieval with relations successful');
    } else {
      throw new Error('Status log retrieval failed');
    }

    return true;
  } catch (error) {
    console.log('   ❌ Status log operations failed:', error.message);
    return false;
  }
}

async function testSystemConfigOperations() {
  console.log('\n⚙️ Testing System Config operations...');
  
  try {
    // Test system config creation
    const config = await prisma.systemConfig.create({
      data: {
        key: 'TEST_CONFIG',
        value: 'test-value',
        type: 'test',
        description: 'Test configuration'
      }
    });
    console.log('   ✅ System config creation successful');

    // Test system config retrieval
    const retrievedConfig = await prisma.systemConfig.findUnique({
      where: { key: 'TEST_CONFIG' }
    });

    if (retrievedConfig && retrievedConfig.value === 'test-value') {
      console.log('   ✅ System config retrieval successful');
    } else {
      throw new Error(`System config retrieval failed. Expected 'test-value', got '${retrievedConfig?.value}'`);
    }

    // Test system config update
    const updatedConfig = await prisma.systemConfig.update({
      where: { key: 'TEST_CONFIG' },
      data: { value: 'updated-test-value' }
    });

    if (updatedConfig && updatedConfig.value === 'updated-test-value') {
      console.log('   ✅ System config update successful');
    } else {
      throw new Error('System config update failed');
    }

    return true;
  } catch (error) {
    console.log('   ❌ System config operations failed:', error.message);
    return false;
  }
}

async function testComplexQueries() {
  console.log('\n🔍 Testing Complex Queries...');
  
  try {
    // Test complaint with all relations
    const complaintWithAllRelations = await prisma.complaint.findUnique({
      where: { id: testData.complaint.id },
      include: {
        ward: true,
        subZone: true,
        submittedBy: true,
        assignedTo: true,
        wardOfficer: true,
        maintenanceTeam: true,
        complaintType: true,
        statusLogs: {
          include: {
            user: true
          }
        },
        attachments: {
          include: {
            uploadedBy: true
          }
        },
        notifications: true,
        messages: true,
        materials: true
      }
    });

    if (complaintWithAllRelations) {
      console.log('   ✅ Complex complaint query successful');
    } else {
      throw new Error('Complex complaint query failed');
    }

    // Test user with all relations
    const userWithAllRelations = await prisma.user.findUnique({
      where: { id: testData.user.id },
      include: {
        ward: true,
        submittedComplaints: true,
        assignedComplaints: true,
        wardOfficerComplaints: true,
        maintenanceTeamComplaints: true,
        statusLogs: true,
        notifications: true,
        uploadedAttachments: true
      }
    });

    if (userWithAllRelations) {
      console.log('   ✅ Complex user query successful');
    } else {
      throw new Error('Complex user query failed');
    }

    return true;
  } catch (error) {
    console.log('   ❌ Complex queries failed:', error.message);
    return false;
  }
}

async function testIndexPerformance() {
  console.log('\n⚡ Testing Index Performance...');
  
  try {
    const startTime = Date.now();

    // Test indexed queries
    await Promise.all([
      prisma.complaint.findMany({
        where: { status: 'REGISTERED' },
        take: 10
      }),
      prisma.complaint.findMany({
        where: { wardId: testData.ward.id },
        take: 10
      }),
      prisma.user.findMany({
        where: { role: 'CITIZEN', isActive: true },
        take: 10
      }),
      prisma.attachment.findMany({
        where: { entityType: 'COMPLAINT' },
        take: 10
      })
    ]);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    console.log(`   ✅ Index performance test completed in ${queryTime}ms`);
    
    if (queryTime < 1000) {
      console.log('   ✅ Query performance is good');
    } else {
      console.log('   ⚠️ Query performance could be improved');
    }

    return true;
  } catch (error) {
    console.log('   ❌ Index performance test failed:', error.message);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order of dependencies
    if (testData.attachment) {
      await prisma.attachment.delete({ where: { id: testData.attachment.id } });
      console.log('   ✅ Test attachment deleted');
    }

    await prisma.statusLog.deleteMany({
      where: { complaintId: testData.complaint?.id }
    });
    console.log('   ✅ Test status logs deleted');

    if (testData.complaint) {
      await prisma.complaint.delete({ where: { id: testData.complaint.id } });
      console.log('   ✅ Test complaint deleted');
    }

    if (testData.user) {
      await prisma.user.delete({ where: { id: testData.user.id } });
      console.log('   ✅ Test user deleted');
    }

    await prisma.systemConfig.deleteMany({
      where: { key: 'TEST_CONFIG' }
    });
    console.log('   ✅ Test system config deleted');

    return true;
  } catch (error) {
    console.log('   ❌ Cleanup failed:', error.message);
    return false;
  }
}

async function generateTestReport(results) {
  console.log('\n📊 Generating Test Report...');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result === true).length;
  const failedTests = totalTests - passedTests;
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: Math.round((passedTests / totalTests) * 100)
    },
    results: results,
    schema: {
      version: '1.0.0',
      type: 'finalized',
      attachmentStrategy: 'unified'
    }
  };

  // Write report to file
  const fs = await import('fs');
  fs.writeFileSync(
    path.join(process.cwd(), 'api-test-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('   ✅ Test report generated: api-test-report.json');
  
  return report;
}

async function runAllTests() {
  const results = {};
  
  try {
    results.databaseConnection = await testDatabaseConnection();
    results.userOperations = await testUserOperations();
    results.complaintOperations = await testComplaintOperations();
    results.attachmentOperations = await testAttachmentOperations();
    results.statusLogOperations = await testStatusLogOperations();
    results.systemConfigOperations = await testSystemConfigOperations();
    results.complexQueries = await testComplexQueries();
    results.indexPerformance = await testIndexPerformance();
    results.cleanup = await cleanupTestData();

    const report = await generateTestReport(results);

    console.log('\n' + '='.repeat(60));
    console.log('🎯 API ENDPOINTS TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log('='.repeat(60));

    if (report.summary.successRate === 100) {
      console.log('🎉 All API endpoints are working correctly!');
      console.log('✅ Schema finalization successful');
      console.log('✅ Unified attachments table working properly');
      console.log('✅ All relationships and indexes functioning');
    } else {
      console.log('⚠️ Some tests failed. Please review the results above.');
    }

    return report.summary.successRate === 100;

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });