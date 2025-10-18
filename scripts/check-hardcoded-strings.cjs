#!/usr/bin/env node

/**
 * Check for hardcoded English strings in React components
 * This script identifies user-facing strings that should be translated
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

console.log('🔍 Checking for hardcoded strings...\n');

// Patterns that should be flagged as hardcoded strings
const patterns = [
  // JSX elements with English text content
  />([A-Z][a-zA-Z ]{2,})</g,
  // Button labels and similar
  /(?:title|placeholder|label|aria-label|alt)=["']([A-Z][a-zA-Z ]{2,})["']/g,
  // Alert/toast messages
  /(?:alert|toast|confirm)\(["']([A-Z][a-zA-Z ]{5,})["']/g,
  // Console errors for debugging (these are OK)
  /console\.(?:error|warn|log)\(["']([A-Z][a-zA-Z ]{5,})["']/g,
];

// Files to ignore
const ignorePatterns = [
  'node_modules',
  'dist',
  '.git',
  'scripts',
  'test',
  'coverage',
];

let totalIssues = 0;
const fileIssues = [];

async function checkFiles() {
  try {
    const files = await glob('src/**/*.{tsx,ts,jsx,js}', {
      ignore: ignorePatterns.map(p => `**/${p}/**`),
    });

    console.log(`📁 Checking ${files.length} files...\n`);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = [];

      // Check each pattern
      patterns.forEach((pattern, patternIndex) => {
        let match;
        const resetPattern = new RegExp(pattern);
        while ((match = resetPattern.exec(content)) !== null) {
          const text = match[1];

          // Skip common technical terms and patterns that are OK
          const skipPatterns = [
            /^(HTML|CSS|JS|TS|JSX|TSX|API|URL|HTTP|HTTPS|JSON|XML|SVG|PDF|PNG|JPG|GIF|WEBP|AVIF)$/,
            /^(ID|UUID|GUID|SQL|NoSQL|REST|GraphQL|WebSocket|CDN|CI\/CD|TDD|BDD)$/,
            /^(DOM|CSS|HTML|XML|JSON|SVG|PDF|PNG|JPE?G|GIF|WEBP|AVIF)$/,
            /^(TODO|FIXME|NOTE|HACK|XXX|BUG)$/,
            /^(Props|State|Ref|Effect|Hook|Context|Reducer)$/,
            /^(Click|Tap|Swipe|Pinch|Zoom|Drag|Drop)$/,
            /^[A-Z]{2,}$/, // Acronyms of 2+ letters
          ];

          const shouldSkip = skipPatterns.some(skip => skip.test(text));

          if (!shouldSkip && text.length > 3) {
            issues.push({
              text,
              line: content.substring(0, match.index).split('\n').length,
              type: getPatternType(patternIndex),
            });
          }
        }
      });

      if (issues.length > 0) {
        fileIssues.push({ file, issues });
        totalIssues += issues.length;
      }
    }

    // Print results
    if (fileIssues.length === 0) {
      console.log('✅ No hardcoded strings found!');
    } else {
      console.log(`❌ Found ${totalIssues} potential hardcoded strings in ${fileIssues.length} files:\n`);

      fileIssues.forEach(({ file, issues }) => {
        console.log(`📄 ${file}`);
        issues.forEach(issue => {
          console.log(`   Line ${issue.line}: [${issue.type}] "${issue.text}"`);
        });
        console.log('');
      });

      console.log('💡 Suggestions:');
      console.log('1. Replace hardcoded strings with translation keys');
      console.log('2. Add keys to both public/locales/en/ and public/locales/fr/');
      console.log('3. Use proper namespace loading: useTranslation([\'namespace\'])');
      console.log('4. Run npm run validate:i18n to ensure consistency');
    }

    return totalIssues;

  } catch (error) {
    console.error('Error checking files:', error);
    return 1;
  }
}

function getPatternType(patternIndex) {
  const types = ['JSX Content', 'Attribute', 'Message', 'Console'];
  return types[patternIndex] || 'Unknown';
}

// Run the check
checkFiles().then(issueCount => {
  if (issueCount > 0) {
    console.log(`\n📊 Summary: ${issueCount} hardcoded strings found`);
    console.log('Please fix these issues before committing.');
    process.exit(1);
  } else {
    console.log('\n📊 Summary: All strings are properly internationalized!');
    process.exit(0);
  }
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});