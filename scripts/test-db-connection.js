#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment configuration
dotenv.config();
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true });
}

/**
 * Test Database Connection Script
 * Tests PostgreSQL connection and provides fallback options
 */

console.log('🔍 Testing Database Connection...\n');

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  console.log(`📊 Database URL: ${databaseUrl?.replace(/:[^:@]*@/, ':***@')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔌 Attempting database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query execution successful');
    
    // Get database info
    if (databaseUrl?.includes('postgresql')) {
      try {
        const result = await prisma.$queryRaw`SELECT version() as version`;
        console.log(`📊 PostgreSQL Version: ${result[0]?.version?.substring(0, 50)}...`);
      } catch (error) {
        console.log('⚠️ Could not fetch PostgreSQL version');
      }
    } else {
      console.log('📊 Using SQLite database');
    }
    
    console.log('\n🎉 Database connection test PASSED');
    return true;
    
  } catch (error) {
    console.log('❌ Database connection FAILED');
    console.log(`Error: ${error.message}`);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Troubleshooting suggestions:');
      console.log('1. Check if PostgreSQL server is running');
      console.log('2. Verify network connectivity to 199.199.50.51:5432');
      console.log('3. Check firewall settings');
      console.log('4. Verify database credentials');
      
      console.log('\n🔄 Fallback option:');
      console.log('Update DATABASE_URL to use SQLite for local testing:');
      console.log('DATABASE_URL="file:./production.db"');
    }
    
    return false;
    
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });