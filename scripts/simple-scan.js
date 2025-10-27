/**
 * Simple hardcoded string scanner for testing
 */

import fs from 'fs';

// Test with a few specific files first
const testFiles = [
  'client/pages/Login.tsx',
  'client/pages/Index.tsx',
  'client/pages/AdminConfig.tsx'
];

function scanFileForHardcodedStrings(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const results = {
      filePath,
      hardcodedStrings: [],
      translationKeys: [],
      hasTranslationImport: content.includes('useTranslation') || content.includes('react-i18next'),
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) {
        continue;
      }

      // Find JSX text content: >text<
      const jsxTextMatches = line.matchAll(/>([^<>{}]+)</g);
      for (const match of jsxTextMatches) {
        const text = match[1].trim();
        if (text.length > 1 && !text.match(/^[a-zA-Z0-9_-]+$/) && !text.includes('{')) {
          results.hardcodedStrings.push({
            content: text,
            line: lineNumber,
            type: 'jsx',
            context: line.trim()
          });
        }
      }

      // Find translation keys: t('key')
      const translationMatches = line.matchAll(/t\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
      for (const match of translationMatches) {
        results.translationKeys.push({
          key: match[1],
          line: lineNumber,
          context: line.trim()
        });
      }

      // Find button text
      const buttonMatches = line.matchAll(/<button[^>]*>([^<]+)<\/button>/gi);
      for (const match of buttonMatches) {
        const text = match[1].trim();
        if (text.length > 1 && !text.includes('{')) {
          results.hardcodedStrings.push({
            content: text,
            line: lineNumber,
            type: 'button',
            context: line.trim()
          });
        }
      }

      // Find placeholder text
      const placeholderMatches = line.matchAll(/placeholder\s*=\s*["']([^"']+)["']/gi);
      for (const match of placeholderMatches) {
        const text = match[1].trim();
        if (text.length > 1) {
          results.hardcodedStrings.push({
            content: text,
            line: lineNumber,
            type: 'placeholder',
            context: line.trim()
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return null;
  }
}

console.log('🔍 Testing hardcoded string detection on sample files...\n');

for (const filePath of testFiles) {
  if (fs.existsSync(filePath)) {
    console.log(`📄 Scanning: ${filePath}`);
    const result = scanFileForHardcodedStrings(filePath);
    
    if (result) {
      console.log(`  Translation import: ${result.hasTranslationImport ? '✅' : '❌'}`);
      console.log(`  Hardcoded strings found: ${result.hardcodedStrings.length}`);
      console.log(`  Translation keys found: ${result.translationKeys.length}`);
      
      if (result.hardcodedStrings.length > 0) {
        console.log('  📝 Sample hardcoded strings:');
        result.hardcodedStrings.slice(0, 3).forEach(hs => {
          console.log(`    Line ${hs.line}: "${hs.content}" (${hs.type})`);
        });
      }
      
      if (result.translationKeys.length > 0) {
        console.log('  🌐 Sample translation keys:');
        result.translationKeys.slice(0, 3).forEach(tk => {
          console.log(`    Line ${tk.line}: ${tk.key}`);
        });
      }
    }
    console.log('');
  } else {
    console.log(`❌ File not found: ${filePath}\n`);
  }
}

console.log('✅ Simple scan completed!');