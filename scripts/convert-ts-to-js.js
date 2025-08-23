#!/usr/bin/env node

/**
 * TypeScript to JavaScript Conversion Script
 * Converts .ts and .tsx files to .js and .jsx respectively
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  sourceDir: path.join(__dirname, '../client'),
  excludeDirs: ['node_modules', 'dist', 'build', '.git'],
  extensions: ['.ts', '.tsx'],
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

/**
 * Find all TypeScript files in the project
 */
function findTypeScriptFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !config.excludeDirs.includes(entry.name)) {
      findTypeScriptFiles(fullPath, files);
    } else if (entry.isFile() && config.extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Convert TypeScript file to JavaScript using TypeScript compiler
 */
function convertFile(tsFile) {
  const jsFile = tsFile.replace(/\.tsx?$/, tsFile.endsWith('.tsx') ? '.jsx' : '.js');
  
  // Skip if JS file already exists and is newer
  if (fs.existsSync(jsFile)) {
    const tsStats = fs.statSync(tsFile);
    const jsStats = fs.statSync(jsFile);
    if (jsStats.mtime > tsStats.mtime) {
      if (config.verbose) {
        console.log(`⏭️  Skipping ${path.relative(config.sourceDir, tsFile)} (JS file is newer)`);
      }
      return { skipped: true };
    }
  }
  
  try {
    // Read TypeScript content
    let content = fs.readFileSync(tsFile, 'utf8');
    
    // Basic TypeScript to JavaScript transformations
    content = transformTypeScriptToJavaScript(content);
    
    if (config.dryRun) {
      console.log(`🔍 Would convert: ${path.relative(config.sourceDir, tsFile)} → ${path.relative(config.sourceDir, jsFile)}`);
      return { dryRun: true };
    }
    
    // Write JavaScript content
    fs.writeFileSync(jsFile, content, 'utf8');
    
    console.log(`✅ Converted: ${path.relative(config.sourceDir, tsFile)} → ${path.relative(config.sourceDir, jsFile)}`);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Failed to convert ${tsFile}:`, error.message);
    return { error: error.message };
  }
}

/**
 * Transform TypeScript code to JavaScript
 */
function transformTypeScriptToJavaScript(content) {
  // Remove type annotations
  content = content.replace(/:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*(?=\s*[=,\)\{;])/g, '');
  
  // Remove interface declarations
  content = content.replace(/interface\s+\w+\s*\{[^}]*\}/g, '');
  
  // Remove type-only imports
  content = content.replace(/import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]*['"];?\n?/g, '');
  
  // Remove type parameters from generics
  content = content.replace(/<[^>]*>/g, '');
  
  // Remove optional property operators
  content = content.replace(/\?\s*:/g, ':');
  
  // Remove non-null assertion operators
  content = content.replace(/!/g, '');
  
  // Remove as Type assertions
  content = content.replace(/\s+as\s+\w+/g, '');
  
  // Remove type annotations from function parameters
  content = content.replace(/\(\s*([^:)]+):\s*[^,)]+/g, '($1');
  
  // Remove return type annotations
  content = content.replace(/\):\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*\s*=>/g, ') =>');
  content = content.replace(/\):\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*\s*\{/g, ') {');
  
  // Convert .ts/.tsx imports to .js/.jsx
  content = content.replace(/from\s+['"]([^'"]*?)\.tsx?['"]/g, (match, path) => {
    if (path.endsWith('.ts')) {
      return match.replace('.ts', '.js');
    } else if (path.endsWith('.tsx')) {
      return match.replace('.tsx', '.jsx');
    }
    return match;
  });
  
  // Remove export type statements
  content = content.replace(/export\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]*['"];?\n?/g, '');
  content = content.replace(/export\s+type\s+\w+\s*=.*?;?\n?/g, '');
  
  return content;
}

/**
 * Main conversion function
 */
function main() {
  console.log('🔄 Starting TypeScript to JavaScript conversion...');
  
  if (config.dryRun) {
    console.log('🔍 Running in dry-run mode (no files will be modified)');
  }
  
  const tsFiles = findTypeScriptFiles(config.sourceDir);
  console.log(`📁 Found ${tsFiles.length} TypeScript files`);
  
  const results = {
    success: 0,
    skipped: 0,
    errors: 0,
    dryRun: 0,
  };
  
  for (const tsFile of tsFiles) {
    const result = convertFile(tsFile);
    
    if (result.success) results.success++;
    else if (result.skipped) results.skipped++;
    else if (result.error) results.errors++;
    else if (result.dryRun) results.dryRun++;
  }
  
  console.log('\n📊 Conversion Summary:');
  if (config.dryRun) {
    console.log(`🔍 Files that would be converted: ${results.dryRun}`);
  } else {
    console.log(`✅ Successfully converted: ${results.success}`);
    console.log(`⏭️  Skipped (already up-to-date): ${results.skipped}`);
    console.log(`❌ Failed: ${results.errors}`);
  }
  
  if (results.errors > 0) {
    console.log('\n⚠️  Some files failed to convert. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 Conversion completed successfully!');
  }
}

// Run the conversion
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
