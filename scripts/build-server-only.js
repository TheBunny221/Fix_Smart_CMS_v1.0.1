#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Server-Only Build Script for NLC-CMS
 * Compiles TypeScript without client build
 */

console.log('🚀 Starting Server-Only Build (TypeScript compilation)...\n');

function cleanPreviousBuild() {
    console.log('🧹 Cleaning previous TypeScript build...');

    const tsbuildDir = path.join(rootDir, 'tsbuild');

    if (fs.existsSync(tsbuildDir)) {
        fs.rmSync(tsbuildDir, { recursive: true, force: true });
        console.log('   ✅ Cleaned: tsbuild directory');
    }

    // Clean compiled JS files from client directory
    try {
        execSync('find client -type f \\( -name "*.js" -o -name "*.js.map" \\) -delete', {
            cwd: rootDir,
            stdio: 'pipe'
        });
        console.log('   ✅ Cleaned: client compiled JS files');
    } catch (error) {
        // Ignore errors if no files to clean
    }

    console.log('');
}

function compileTypeScript() {
    console.log('🔧 Compiling TypeScript...');

    try {
        execSync('npx tsc --project tsconfig.json', {
            cwd: rootDir,
            stdio: 'inherit'
        });
        console.log('   ✅ TypeScript compilation successful\n');
        return true;
    } catch (error) {
        console.error('   ❌ TypeScript compilation failed');
        console.error(error.message);
        return false;
    }
}

function runTypeCheck() {
    console.log('🔍 Running type checking...');

    try {
        execSync('npx tsc -p tsconfig.json --noEmit', {
            cwd: rootDir,
            stdio: 'inherit'
        });
        console.log('   ✅ Type checking passed\n');
        return true;
    } catch (error) {
        console.error('   ❌ Type checking failed');
        return false;
    }
}

function generateBuildReport() {
    console.log('📊 Generating build report...');

    const tsbuildDir = path.join(rootDir, 'tsbuild');
    let totalFiles = 0;
    let totalSize = 0;
    const fileTypes = {};

    function walkDir(dir) {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else {
                totalFiles++;
                totalSize += stat.size;

                const ext = path.extname(item);
                fileTypes[ext] = (fileTypes[ext] || 0) + 1;
            }
        });
    }

    walkDir(tsbuildDir);

    const buildReport = {
        timestamp: new Date().toISOString(),
        buildType: 'server-only-typescript',
        totalFiles,
        totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
        fileTypes,
        outputDirectory: 'tsbuild/',
        status: 'success'
    };

    // Write build report
    fs.writeFileSync(
        path.join(rootDir, 'tsbuild-report.json'),
        JSON.stringify(buildReport, null, 2)
    );

    console.log('   ✅ Build report generated: tsbuild-report.json\n');

    return buildReport;
}

function displaySummary(buildReport) {
    console.log('🎉 Server-Only Build Completed Successfully!');
    console.log('='.repeat(60));
    console.log(`📦 Build output: tsbuild/`);
    console.log(`📊 Total files: ${buildReport.totalFiles}`);
    console.log(`💾 Total size: ${buildReport.totalSizeMB} MB`);
    console.log(`🕒 Build time: ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 File breakdown:');
    Object.entries(buildReport.fileTypes).forEach(([ext, count]) => {
        console.log(`   ${ext || 'no extension'}: ${count} files`);
    });
    console.log('');
    console.log('✅ What was built:');
    console.log('   - TypeScript files compiled to JavaScript');
    console.log('   - Type definitions preserved');
    console.log('   - Module structure maintained');
    console.log('   - Source maps generated');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   - Use compiled files from tsbuild/ directory');
    console.log('   - Run server with: node tsbuild/server/server.js');
    console.log('   - For full production build: npm run build');
    console.log('');
}

async function buildServerOnly() {
    const startTime = Date.now();

    try {
        cleanPreviousBuild();

        const typeCheckPassed = runTypeCheck();
        if (!typeCheckPassed) {
            throw new Error('Type checking failed');
        }

        const compilationSuccessful = compileTypeScript();
        if (!compilationSuccessful) {
            throw new Error('TypeScript compilation failed');
        }

        const buildReport = generateBuildReport();
        displaySummary(buildReport);

        const buildTime = Math.round((Date.now() - startTime) / 1000);
        console.log(`⏱️ Total build time: ${buildTime} seconds`);

    } catch (error) {
        console.error('❌ Server-Only Build Failed:');
        console.error(error.message);
        process.exit(1);
    }
}

// Run the build
buildServerOnly();