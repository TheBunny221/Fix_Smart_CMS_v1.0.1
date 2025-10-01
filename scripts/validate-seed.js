#!/usr/bin/env node

/**
 * Validation script to test seeding functionality
 * This script validates that the seed files work correctly with different schema configurations
 */

import { PrismaClient } from "@prisma/client";
import seedCommon from "../prisma/seed.common.js";

const prisma = new PrismaClient();

async function validateSeeding() {
  console.log("🧪 Starting seed validation...");
  
  try {
    // Test with minimal data to avoid overwhelming the database
    console.log("\n📋 Testing dev environment seeding...");
    await seedCommon(prisma, {
      destructive: false, // Non-destructive for testing
      adminEmail: "test-admin@example.com",
      adminPassword: "test123",
      environment: 'dev',
      target: {
        wards: 2,
        subZonesPerWard: 1,
        maintenancePerWard: 1,
        citizens: 2,
        complaints: 5,
        serviceRequests: 2,
      },
    });
    
    console.log("\n📋 Testing prod environment seeding...");
    await seedCommon(prisma, {
      destructive: false, // Non-destructive for testing
      adminEmail: "test-admin-prod@example.com", 
      adminPassword: "test123",
      environment: 'prod',
      target: {
        wards: 2,
        subZonesPerWard: 1,
        maintenancePerWard: 1,
        citizens: 2,
        complaints: 5,
        serviceRequests: 2,
      },
    });
    
    // Validate data was created
    const wardCount = await prisma.ward.count();
    const userCount = await prisma.user.count();
    const complaintCount = await prisma.complaint.count();
    
    console.log("\n📊 Validation Results:");
    console.log(`✅ Wards created: ${wardCount}`);
    console.log(`✅ Users created: ${userCount}`);
    console.log(`✅ Complaints created: ${complaintCount}`);
    
    if (wardCount >= 2 && userCount >= 4 && complaintCount >= 5) {
      console.log("\n🎉 Seed validation PASSED!");
      return true;
    } else {
      console.log("\n❌ Seed validation FAILED - insufficient data created");
      return false;
    }
    
  } catch (error) {
    console.error("\n❌ Seed validation FAILED with error:", error.message);
    return false;
  }
}

async function main() {
  try {
    const success = await validateSeeding();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("Validation script error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
