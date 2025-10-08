#!/usr/bin/env node

/**
 * Generate static swagger.json file from the Swagger configuration
 * This script creates a static OpenAPI specification file that can be used
 * for external integrations, documentation hosting, or CI/CD pipelines.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSwaggerJson() {
  try {
    console.log('🔧 Generating swagger.json...');
    
    // Import the Swagger configuration
    const { specs } = await import('../server/config/swagger.js');
    
    // Define output path
    const outputPath = path.join(__dirname, '..', 'swagger.json');
    
    // Write the JSON file
    fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));
    
    console.log('✅ swagger.json generated successfully!');
    console.log(`📄 File location: ${outputPath}`);
    console.log(`📊 Total endpoints documented: ${countEndpoints(specs)}`);
    console.log(`🏷️  Total schemas defined: ${Object.keys(specs.components?.schemas || {}).length}`);
    
  } catch (error) {
    console.error('❌ Error generating swagger.json:', error.message);
    process.exit(1);
  }
}

function countEndpoints(specs) {
  let count = 0;
  const paths = specs.paths || {};
  
  for (const path in paths) {
    const methods = paths[path];
    for (const method in methods) {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        count++;
      }
    }
  }
  
  return count;
}

// Run the generator
generateSwaggerJson();