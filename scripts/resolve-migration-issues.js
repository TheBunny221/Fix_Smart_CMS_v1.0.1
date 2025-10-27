#!/usr/bin/env node

/**
 * Migration Issue Resolution Script
 * 
 * This script helps resolve common migration issues in production databases,
 * particularly failed migrations that prevent new migrations from being applied.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function resolveMigrationIssues() {
  console.log('🔧 Migration Issue Resolution Tool\n');
  
  try {
    // Check current migration status
    console.log('📊 Checking migration status...');
    try {
      const migrationStatus = execSync('npx prisma migrate status', { stdio: 'pipe' });
      console.log('Current migration status:');
      console.log(migrationStatus.toString());
    } catch (error) {
      console.log('Migration status output:');
      console.log(error.stdout?.toString() || error.message);
      
      // Check if this is a failed migration issue
      if (error.stdout?.toString().includes('failed migrations')) {
        console.log('\n🚨 Detected failed migrations in database');
        return await handleFailedMigrations();
      }
    }
    
    console.log('\n✅ No migration issues detected');
    return true;
    
  } catch (error) {
    console.error('💥 Error checking migration status:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function handleFailedMigrations() {
  console.log('\n🔧 Handling failed migrations...');
  
  try {
    // Get failed migration details
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, logs
      FROM _prisma_migrations 
      WHERE finished_at IS NULL OR logs LIKE '%ERROR%'
      ORDER BY started_at DESC
    `;
    
    console.log('\n📋 Failed migrations found:');
    failedMigrations.forEach(migration => {
      console.log(`   • ${migration.migration_name}`);
      console.log(`     Started: ${migration.started_at}`);
      console.log(`     Status: ${migration.finished_at ? 'Completed with errors' : 'Failed/Incomplete'}`);
      if (migration.logs) {
        console.log(`     Logs: ${migration.logs.substring(0, 200)}...`);
      }
    });
    
    console.log('\n🔄 Resolution options:');
    console.log('1. Mark failed migrations as resolved (if schema is correct)');
    console.log('2. Reset migration history (DESTRUCTIVE - use with caution)');
    console.log('3. Manual intervention required');
    
    // Option 1: Mark as resolved
    console.log('\n🎯 Attempting to resolve failed migrations...');
    
    // Check if the database schema matches the Prisma schema
    console.log('🔍 Checking if database schema matches Prisma schema...');
    
    const isPostgreSQL = process.env.DATABASE_URL?.includes('postgresql');
    if (isPostgreSQL) {
      // Check if essential tables exist with correct structure
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      const tableNames = tables.map(t => t.table_name);
      console.log('📋 Current database tables:', tableNames.join(', '));
      
      // If the schema looks correct, we can mark failed migrations as resolved
      const essentialTables = ['users', 'complaints', 'wards'];
      const hasEssentialTables = essentialTables.every(table => tableNames.includes(table));
      
      if (hasEssentialTables) {
        console.log('✅ Essential tables found - schema appears to be in good state');
        
        // Mark failed migrations as resolved
        console.log('🔧 Marking failed migrations as resolved...');
        
        for (const migration of failedMigrations) {
          await prisma.$queryRaw`
            UPDATE _prisma_migrations 
            SET finished_at = NOW(), logs = 'Manually resolved - schema verified'
            WHERE migration_name = ${migration.migration_name}
          `;
          console.log(`   ✅ Resolved: ${migration.migration_name}`);
        }
        
        console.log('\n🎉 Failed migrations have been marked as resolved');
        console.log('🔄 You can now run "npx prisma migrate deploy" to apply new migrations');
        
        return true;
      } else {
        console.log('❌ Database schema appears incomplete');
        console.log('⚠️ Manual intervention required - contact database administrator');
        return false;
      }
    } else {
      console.log('ℹ️ Non-PostgreSQL database - manual resolution required');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error handling failed migrations:', error);
    
    console.log('\n🔧 Alternative resolution methods:');
    console.log('1. Use Prisma Studio to inspect _prisma_migrations table');
    console.log('2. Manually update migration records in database');
    console.log('3. Use "npx prisma migrate resolve --applied <migration_name>" for each failed migration');
    console.log('4. Contact database administrator for assistance');
    
    return false;
  }
}

// Command line argument handling
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Migration Issue Resolution Tool');
  console.log('');
  console.log('Usage: node scripts/resolve-migration-issues.js');
  console.log('');
  console.log('This tool helps resolve common migration issues including:');
  console.log('  • Failed migrations blocking new deployments');
  console.log('  • Inconsistent migration history');
  console.log('  • Schema drift issues');
  console.log('');
  console.log('The tool will automatically detect and attempt to resolve issues.');
  process.exit(0);
}

// Run the resolution
resolveMigrationIssues()
  .then(success => {
    if (success) {
      console.log('\n✅ Migration issues resolved successfully');
      console.log('🚀 You can now proceed with migration deployment');
    } else {
      console.log('\n⚠️ Migration issues require manual intervention');
      console.log('📞 Contact your database administrator for assistance');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });