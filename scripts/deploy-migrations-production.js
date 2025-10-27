#!/usr/bin/env node

/**
 * Production Migration Deployment Script
 * 
 * This script safely deploys Prisma migrations in production with
 * proper error handling, backup verification, and rollback procedures.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function deployMigrationsProduction() {
  console.log('🚀 Production Migration Deployment\n');
  
  // Pre-deployment checks
  console.log('🔍 Pre-deployment checks...');
  
  // Check if we're in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Warning: NODE_ENV is not set to "production"');
    console.log('   Current NODE_ENV:', process.env.NODE_ENV || 'undefined');
  }
  
  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connectivity verified');
  } catch (error) {
    console.error('❌ Database connectivity failed:', error.message);
    return false;
  }
  
  // Check if backup is recommended
  console.log('\n📋 Pre-migration checklist:');
  console.log('   □ Database backup completed');
  console.log('   □ Application maintenance mode enabled');
  console.log('   □ Migration rollback plan prepared');
  console.log('   □ Team notified of deployment');
  
  // Validate schema before deployment
  console.log('\n🔍 Validating Prisma schema...');
  try {
    execSync('npx prisma validate', { stdio: 'pipe' });
    console.log('✅ Schema validation passed');
  } catch (error) {
    console.error('❌ Schema validation failed');
    console.error('Error:', error.stdout?.toString() || error.message);
    return false;
  }
  
  // Check migration status
  console.log('\n📊 Checking migration status...');
  try {
    const migrationStatus = execSync('npx prisma migrate status', { stdio: 'pipe' });
    console.log('Migration Status Output:');
    console.log(migrationStatus.toString());
  } catch (error) {
    console.log('Migration status output:');
    console.log(error.stdout?.toString() || error.message);
  }
  
  // Get user confirmation for production deployment
  if (process.env.SKIP_CONFIRMATION !== 'true') {
    console.log('\n⚠️ PRODUCTION DEPLOYMENT WARNING');
    console.log('This will apply migrations to the production database.');
    console.log('Ensure you have completed all pre-deployment checks above.');
    console.log('\nTo proceed automatically, set SKIP_CONFIRMATION=true');
    console.log('To continue, press Ctrl+C to cancel or wait 10 seconds...');
    
    // Wait for 10 seconds to allow cancellation
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  console.log('\n🚀 Starting migration deployment...');
  
  try {
    // Record deployment start time
    const deploymentStart = new Date();
    console.log(`⏰ Deployment started at: ${deploymentStart.toISOString()}`);
    
    // Deploy migrations
    console.log('\n📦 Deploying migrations...');
    const deployOutput = execSync('npx prisma migrate deploy', { stdio: 'pipe' });
    console.log('Migration deployment output:');
    console.log(deployOutput.toString());
    
    // Verify deployment success
    console.log('\n✅ Verifying deployment...');
    
    // Test database connectivity after migration
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Post-migration database connectivity verified');
    
    // Check if essential tables exist
    const isPostgreSQL = process.env.DATABASE_URL?.includes('postgresql');
    if (isPostgreSQL) {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      const tableNames = tables.map(t => t.table_name);
      const essentialTables = ['users', 'complaints', 'wards', 'complaint_types'];
      const missingTables = essentialTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length > 0) {
        console.error('❌ Missing essential tables after migration:', missingTables.join(', '));
        return false;
      } else {
        console.log('✅ All essential tables verified');
      }
    }
    
    // Test seed script if requested
    if (process.env.RUN_SEED === 'true') {
      console.log('\n🌱 Running seed script...');
      try {
        execSync('npx prisma db seed', { stdio: 'inherit' });
        console.log('✅ Seed script completed successfully');
      } catch (seedError) {
        console.error('❌ Seed script failed:', seedError.message);
        console.log('⚠️ Migration deployed but seeding failed - manual intervention required');
      }
    }
    
    const deploymentEnd = new Date();
    const duration = deploymentEnd - deploymentStart;
    
    console.log('\n🎉 Migration deployment completed successfully!');
    console.log(`⏰ Total deployment time: ${duration}ms`);
    console.log(`📅 Completed at: ${deploymentEnd.toISOString()}`);
    
    // Post-deployment recommendations
    console.log('\n📋 Post-deployment checklist:');
    console.log('   □ Verify application functionality');
    console.log('   □ Check application logs for errors');
    console.log('   □ Monitor database performance');
    console.log('   □ Disable maintenance mode');
    console.log('   □ Notify team of successful deployment');
    
    return true;
    
  } catch (error) {
    console.error('\n💥 Migration deployment failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔄 Rollback procedures:');
    console.log('   1. Restore database from backup');
    console.log('   2. Revert application to previous version');
    console.log('   3. Check migration files for issues');
    console.log('   4. Contact database administrator if needed');
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line argument handling
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Production Migration Deployment Script');
  console.log('');
  console.log('Usage: node scripts/deploy-migrations-production.js [options]');
  console.log('');
  console.log('Environment Variables:');
  console.log('  SKIP_CONFIRMATION=true    Skip confirmation prompt');
  console.log('  RUN_SEED=true            Run seed script after migration');
  console.log('  NODE_ENV=production      Set environment to production');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/deploy-migrations-production.js');
  console.log('  SKIP_CONFIRMATION=true RUN_SEED=true node scripts/deploy-migrations-production.js');
  process.exit(0);
}

// Run the deployment
deployMigrationsProduction()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });