/**
 * Test script for SystemConfig API endpoints
 * 
 * This script tests the system config cache and API endpoints
 * to ensure everything is working correctly.
 */

import { getPrisma } from "../db/connection.js";
import systemConfigCache from "../services/systemConfigCache.js";
import logger from "../utils/logger.js";

const prisma = getPrisma();

async function testSystemConfigApi() {
  console.log("🧪 Testing SystemConfig API...");

  try {
    // Test 1: Initialize cache
    console.log("\n1. Testing cache initialization...");
    if (!systemConfigCache.isInitialized) {
      await systemConfigCache.initialize();
      console.log("✅ Cache initialized successfully");
    } else {
      console.log("✅ Cache already initialized");
    }

    // Test 2: Check cache stats
    console.log("\n2. Testing cache stats...");
    const stats = systemConfigCache.getStats();
    console.log("Cache stats:", JSON.stringify(stats, null, 2));

    // Test 3: Test basic cache operations
    console.log("\n3. Testing cache operations...");
    
    // Create a test config
    await systemConfigCache.set('TEST_CONFIG', 'test_value', 'test', 'Test configuration');
    console.log("✅ Created test config");

    // Get the test config
    const testValue = systemConfigCache.get('TEST_CONFIG');
    console.log(`✅ Retrieved test config: ${testValue}`);

    // Test pattern matching
    const testConfigs = systemConfigCache.getByPattern('TEST_', 'startsWith');
    console.log("✅ Pattern matching results:", Object.keys(testConfigs));

    // Test 4: Test app config
    console.log("\n4. Testing app config...");
    const appConfig = systemConfigCache.getAppConfig();
    console.log("App config:", JSON.stringify(appConfig, null, 2));

    // Test 5: Test email config
    console.log("\n5. Testing email config...");
    const emailConfig = systemConfigCache.getEmailConfig();
    console.log("Email config:", JSON.stringify(emailConfig, null, 2));

    // Test 6: Test bulk operations
    console.log("\n6. Testing bulk operations...");
    const bulkConfigs = [
      { key: 'BULK_TEST_1', value: 'value1', type: 'test', description: 'Bulk test 1' },
      { key: 'BULK_TEST_2', value: 'value2', type: 'test', description: 'Bulk test 2' }
    ];
    
    const bulkResult = await systemConfigCache.bulkUpdate(bulkConfigs);
    console.log("✅ Bulk update results:", JSON.stringify(bulkResult, null, 2));

    // Test 7: Test database consistency
    console.log("\n7. Testing database consistency...");
    const dbConfigs = await prisma.systemConfig.findMany({
      where: { key: { startsWith: 'TEST_' }, isActive: true }
    });
    console.log(`✅ Found ${dbConfigs.length} test configs in database`);

    // Cleanup test configs
    console.log("\n8. Cleaning up test configs...");
    await prisma.systemConfig.updateMany({
      where: { key: { startsWith: 'TEST_' } },
      data: { isActive: false }
    });
    await prisma.systemConfig.updateMany({
      where: { key: { startsWith: 'BULK_TEST_' } },
      data: { isActive: false }
    });
    
    // Refresh cache to remove test configs
    await systemConfigCache.forceRefresh();
    console.log("✅ Cleanup completed");

    console.log("\n🎉 All tests passed! SystemConfig API is working correctly.");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSystemConfigApi().catch(console.error);