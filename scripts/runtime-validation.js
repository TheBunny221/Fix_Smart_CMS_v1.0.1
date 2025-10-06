#!/usr/bin/env node

/**
 * Runtime Fix_Smart_CMS_v1.0.3 Documentation Alignment Validation
 * 
 * This script validates the running system against documented API endpoints,
 * database connectivity, and runtime behavior specifications.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 RUNTIME Fix_Smart_CMS_v1.0.3 Documentation Alignment Validation');
console.log('📁 Project Root:', projectRoot);
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;
let warnings = 0;
const issues = [];

function logResult(type, category, message, details = null) {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️' };
  const colors = { pass: '\x1b[32m', fail: '\x1b[31m', warn: '\x1b[33m', reset: '\x1b[0m' };
  
  console.log(`${colors[type]}${icons[type]} ${category}: ${message}${colors.reset}`);
  
  if (type === 'pass') passed++;
  else if (type === 'fail') {
    failed++;
    issues.push({ category, message, details });
  } else if (type === 'warn') {
    warnings++;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(projectRoot, filePath));
}

// ============================================================================
// VALIDATE DATABASE CONNECTIVITY AND SCHEMA
// ============================================================================

console.log('\n🗄️  VALIDATING DATABASE CONNECTIVITY');

// Check if database files exist for development
if (fileExists('dev.db')) {
  logResult('pass', 'Database Files', 'Development SQLite database exists');
} else {
  logResult('warn', 'Database Files', 'Development database not found - may need setup');
}

if (fileExists('production.db')) {
  logResult('pass', 'Database Files', 'Production SQLite database exists');
} else {
  logResult('warn', 'Database Files', 'Production database not found - normal for PostgreSQL setup');
}

// Check Prisma client generation
if (fileExists('node_modules/.prisma/client')) {
  logResult('pass', 'Prisma Client', 'Prisma client generated');
} else {
  logResult('fail', 'Prisma Client', 'Prisma client not generated - run npm run db:generate:dev');
}

// ============================================================================
// VALIDATE BUILD OUTPUT STRUCTURE
// ============================================================================

console.log('\n🔨 VALIDATING BUILD OUTPUT');

// Check if dist directory exists (after build)
if (fileExists('dist')) {
  logResult('pass', 'Build Output', 'Build output directory 