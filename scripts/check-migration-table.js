#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function checkMigrationTable() {
  try {
    console.log('🔍 Checking _prisma_migrations table...\n');
    
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, checksum, started_at, finished_at, logs
      FROM _prisma_migrations 
      ORDER BY started_at DESC
    `;
    
    console.log('📋 Migrations in database:');
    migrations.forEach(migration => {
      console.log(`   • ${migration.migration_name}`);
      console.log(`     Started: ${migration.started_at}`);
      console.log(`     Finished: ${migration.finished_at || 'NULL (FAILED)'}`);
      if (migration.logs && migration.logs.includes('ERROR')) {
        console.log(`     Status: ❌ FAILED`);
        console.log(`     Error: ${migration.logs.substring(0, 200)}...`);
      } else if (migration.finished_at) {
        console.log(`     Status: ✅ SUCCESS`);
      } else {
        console.log(`     Status: ⏳ PENDING/FAILED`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error checking migration table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationTable();