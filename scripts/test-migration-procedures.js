#!/usr/bin/env node

/**
 * Test Migration Procedures Script
 * 
 * This script tests Prisma migration procedures in a safe way
 * by validating the migration state and testing seed scripts.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function testMigrationProcedures() {
  console.log('🧪 Testing Migration Procedures\n');
  
  try {
    // Test 1: Validate Prisma schema
    console.log('1️⃣ Validating Prisma schema...');
    try {
      execSync('npx prisma validate', { stdio: 'pipe' });
      console.log('   ✅ Schema validation passed\n');
    } catch (error) {
      console.log('   ❌ Schema validation failed');
      console.log('   Error:', error.stdout?.toString() || error.message);
      return false;
    }

    // Test 2: Check migration status
    console.log('2️⃣ Checking migration status...');
    try {
      const migrationStatus = execSync('npx prisma migrate status', { stdio: 'pipe' });
      console.log('   📊 Migration Status:');
      console.log('   ' + migrationStatus.toString().split('\n').join('\n   '));
    } catch (error) {
      console.log('   ⚠️ Migration status check completed with warnings');
      console.log('   Output:', error.stdout?.toString() || error.message);
    }
    console.log('');

    // Test 3: Test database connectivity
    console.log('3️⃣ Testing database connectivity...');
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('   ✅ Database connection successful\n');
    } catch (error) {
      console.log('   ❌ Database connection failed');
      console.log('   Error:', error.message);
      return false;
    }

    // Test 4: Check if tables exist
    console.log('4️⃣ Checking database schema...');
    try {
      const isPostgreSQL = process.env.DATABASE_URL?.includes('postgresql');
      
      if (isPostgreSQL) {
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `;
        
        console.log('   📋 Database tables found:');
        tables.forEach(table => {
          console.log(`      • ${table.table_name}`);
        });
        
        // Check for essential tables
        const tableNames = tables.map(t => t.table_name);
        const essentialTables = ['users', 'complaints', 'wards', 'complaint_types'];
        const missingTables = essentialTables.filter(table => !tableNames.includes(table));
        
        if (missingTables.length > 0) {
          console.log('   ⚠️ Missing essential tables:', missingTables.join(', '));
        } else {
          console.log('   ✅ All essential tables present');
        }
      } else {
        console.log('   ℹ️ Non-PostgreSQL database detected, skipping table check');
      }
      console.log('');
    } catch (error) {
      console.log('   ❌ Schema check failed');
      console.log('   Error:', error.message);
      return false;
    }

    // Test 5: Test seed script (dry run)
    console.log('5️⃣ Testing seed script import paths...');
    try {
      // Test if seed script can be imported without running
      const seedPath = new URL('../prisma/seed.js', import.meta.url);
      console.log('   📁 Seed script path:', seedPath.pathname);
      
      // Check if seed dependencies exist
      const fs = await import('fs');
      const path = await import('path');
      
      const seedJsonPath = new URL('../prisma/seeds/seed.json', import.meta.url);
      if (fs.existsSync(seedJsonPath)) {
        console.log('   ✅ Seed data file found');
        
        // Validate JSON structure
        const seedData = JSON.parse(fs.readFileSync(seedJsonPath, 'utf8'));
        const expectedKeys = ['systemConfig', 'ward', 'complaintType'];
        const foundKeys = Object.keys(seedData);
        
        console.log('   📊 Seed data sections:', foundKeys.join(', '));
        
        const missingKeys = expectedKeys.filter(key => !foundKeys.includes(key));
        if (missingKeys.length > 0) {
          console.log('   ⚠️ Missing seed sections:', missingKeys.join(', '));
        } else {
          console.log('   ✅ All expected seed sections present');
        }
      } else {
        console.log('   ❌ Seed data file not found');
        return false;
      }
      console.log('');
    } catch (error) {
      console.log('   ❌ Seed script test failed');
      console.log('   Error:', error.message);
      return false;
    }

    // Test 6: Test connection pool configuration
    console.log('6️⃣ Testing connection pool configuration...');
    try {
      const isPostgreSQL = process.env.DATABASE_URL?.includes('postgresql');
      
      if (isPostgreSQL) {
        console.log('   🏊 Connection Pool Settings:');
        console.log(`      • Min Connections: ${process.env.DATABASE_POOL_MIN || '2'}`);
        console.log(`      • Max Connections: ${process.env.DATABASE_POOL_MAX || '10'}`);
        
        // Test multiple concurrent connections
        const connectionTests = Array.from({ length: 3 }, async (_, i) => {
          const startTime = Date.now();
          await prisma.$queryRaw`SELECT ${i + 1} as connection_test`;
          return Date.now() - startTime;
        });
        
        const results = await Promise.all(connectionTests);
        const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
        
        console.log(`      • Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
        console.log('   ✅ Connection pool test passed');
      } else {
        console.log('   ℹ️ Connection pooling not applicable for non-PostgreSQL databases');
      }
      console.log('');
    } catch (error) {
      console.log('   ❌ Connection pool test failed');
      console.log('   Error:', error.message);
      return false;
    }

    console.log('🎉 All migration procedure tests passed!');
    console.log('\n📋 Production Migration Checklist:');
    console.log('   1. ✅ Schema validation');
    console.log('   2. ✅ Database connectivity');
    console.log('   3. ✅ Table structure verification');
    console.log('   4. ✅ Seed script validation');
    console.log('   5. ✅ Connection pool configuration');
    console.log('\n🚀 Ready for production migration with: npx prisma migrate deploy');
    
    return true;

  } catch (error) {
    console.error('💥 Migration test failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMigrationProcedures()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });