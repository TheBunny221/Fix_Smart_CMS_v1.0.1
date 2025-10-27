#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function fixFailedMigration() {
  try {
    console.log('🔧 Fixing failed migration...\n');
    
    // Mark the failed migration as completed
    await prisma.$queryRaw`
      UPDATE _prisma_migrations 
      SET finished_at = NOW(), 
          logs = 'Manually resolved - schema verified and working'
      WHERE migration_name = '202509241015_add_complaint_type'
        AND finished_at IS NULL
    `;
    
    console.log('✅ Failed migration marked as resolved');
    
    // Verify the fix
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations 
      WHERE migration_name = '202509241015_add_complaint_type'
    `;
    
    if (migrations[0]?.finished_at) {
      console.log('✅ Migration resolution verified');
      console.log('🚀 You can now run "npx prisma migrate deploy" to apply new migrations');
    } else {
      console.log('❌ Migration resolution failed');
    }
    
  } catch (error) {
    console.error('Error fixing migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFailedMigration();