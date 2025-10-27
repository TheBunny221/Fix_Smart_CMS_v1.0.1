#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function cleanMigrationHistory() {
  try {
    console.log('🧹 Cleaning migration history...\n');
    
    // Remove the old migration that doesn't exist locally
    const result = await prisma.$queryRaw`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '202509241015_add_complaint_type'
    `;
    
    console.log('✅ Removed old migration record from database');
    
    // Check current migration status
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations 
      ORDER BY started_at DESC
    `;
    
    console.log('\n📋 Current migrations in database:');
    if (migrations.length === 0) {
      console.log('   (No migrations found)');
    } else {
      migrations.forEach(migration => {
        console.log(`   • ${migration.migration_name} - ${migration.finished_at ? 'SUCCESS' : 'PENDING'}`);
      });
    }
    
    console.log('\n🚀 Migration history cleaned. You can now run "npx prisma migrate deploy"');
    
  } catch (error) {
    console.error('Error cleaning migration history:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanMigrationHistory();