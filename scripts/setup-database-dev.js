#!/usr/bin/env node

/**
 * Development Database Setup Script
 * Ensures the database is properly initialized for development
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔧 Setting up development database...\n');

try {
  // Check if .env file exists
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    const envExamplePath = path.join(rootDir, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created');
    } else {
      console.log('⚠️ No .env.example found, using default SQLite configuration');
    }
  }

  // Ensure DATABASE_URL is set to SQLite for development
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('DATABASE_URL="file:./dev.db"')) {
    console.log('🔧 Updating DATABASE_URL to use SQLite for development...');
    const updatedContent = envContent.replace(
      /DATABASE_URL=.*/,
      'DATABASE_URL="file:./dev.db"'
    );
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ DATABASE_URL updated');
  }

  // Generate Prisma client
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });

  // Push database schema (creates database if it doesn't exist)
  console.log('🔄 Setting up database schema...');
  execSync('npx prisma db push', { 
    cwd: rootDir, 
    stdio: 'inherit' 
  });

  // Run seed script if it exists
  const seedPath = path.join(rootDir, 'prisma', 'seed.dev.js');
  if (fs.existsSync(seedPath)) {
    console.log('🌱 Seeding database with development data...');
    execSync('npm run seed:dev', { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
  } else {
    console.log('⚠️ No seed script found, skipping seeding');
  }

  console.log('\n✅ Development database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Check the TaskDetails page functionality');

} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  console.error('\n🔧 Troubleshooting steps:');
  console.error('1. Check that Node.js and npm are properly installed');
  console.error('2. Ensure all dependencies are installed: npm install');
  console.error('3. Check the .env file configuration');
  console.error('4. Try running: npx prisma db push --force-reset');
  
  process.exit(1);
}