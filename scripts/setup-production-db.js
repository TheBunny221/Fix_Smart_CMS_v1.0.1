#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

/**
 * Production Database Setup Script
 * Handles both PostgreSQL and SQLite configurations
 */

console.log('🚀 Production Database Setup\n');

// Load environment
dotenv.config();
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true });
}

const databaseUrl = process.env.DATABASE_URL || '';
const isPostgreSQL = databaseUrl.includes('postgresql://') || databaseUrl.includes('postgres://');
const isSQLite = databaseUrl.includes('file:') || databaseUrl.includes('sqlite:');

console.log(`📊 Database URL: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
console.log(`🔧 Database Type: ${isPostgreSQL ? 'PostgreSQL' : isSQLite ? 'SQLite' : 'Unknown'}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);

async function setupDatabase() {
  try {
    // Step 1: Update schema based on database type
    console.log('📝 Updating Prisma schema...');
    
    const schemaPath = path.join(process.cwd(), 'prisma/schema.prod.prisma');
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    if (isPostgreSQL) {
      schemaContent = schemaContent.replace(
        /provider\s*=\s*"sqlite"/g,
        'provider = "postgresql"'
      );
      console.log('   ✅ Schema configured for PostgreSQL');
    } else if (isSQLite) {
      schemaContent = schemaContent.replace(
        /provider\s*=\s*"postgresql"/g,
        'provider = "sqlite"'
      );
      console.log('   ✅ Schema configured for SQLite');
    }
    
    fs.writeFileSync(schemaPath, schemaContent);
    
    // Step 2: Generate Prisma client
    console.log('\n🔧 Generating Prisma client...');
    execSync('npx prisma generate --schema=prisma/schema.prod.prisma', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Step 3: Test database connection
    console.log('\n🔌 Testing database connection...');
    
    if (isPostgreSQL) {
      try {
        execSync('npx prisma db push --schema=prisma/schema.prod.prisma', { 
          stdio: 'pipe',
          cwd: process.cwd()
        });
        console.log('   ✅ PostgreSQL connection successful');
      } catch (error) {
        console.log('   ❌ PostgreSQL connection failed');
        console.log('   🔄 Falling back to SQLite...');
        
        // Fallback to SQLite
        process.env.DATABASE_URL = 'file:./production.db';
        
        // Update .env file
        const envPath = path.join(process.cwd(), '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(
          /DATABASE_URL=.*/,
          'DATABASE_URL="file:./production.db"'
        );
        fs.writeFileSync(envPath, envContent);
        
        // Update schema for SQLite
        schemaContent = schemaContent.replace(
          /provider\s*=\s*"postgresql"/g,
          'provider = "sqlite"'
        );
        fs.writeFileSync(schemaPath, schemaContent);
        
        // Regenerate client and setup SQLite
        execSync('npx prisma generate --schema=prisma/schema.prod.prisma', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        execSync('npx prisma db push --schema=prisma/schema.prod.prisma', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        console.log('   ✅ SQLite fallback successful');
      }
    } else {
      execSync('npx prisma db push --schema=prisma/schema.prod.prisma', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('   ✅ SQLite connection successful');
    }
    
    // Step 4: Seed database
    console.log('\n🌱 Seeding database...');
    execSync('npm run db:seed', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('\n🎉 Production database setup completed successfully!');
    
    // Step 5: Display summary
    console.log('\n📋 Setup Summary:');
    console.log(`   Database Type: ${fs.readFileSync(schemaPath, 'utf8').includes('postgresql') ? 'PostgreSQL' : 'SQLite'}`);
    console.log(`   Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Schema File: ${schemaPath}`);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    return false;
  }
}

// Run setup
setupDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });