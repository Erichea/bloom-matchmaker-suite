#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

console.log('🔍 Starting translation validation...\n');

const localesDir = path.join(process.cwd(), 'public', 'locales');
console.log(`📂 Looking in: ${localesDir}`);

// Check if directory exists
if (!fs.existsSync(localesDir)) {
  console.error('❌ Locales directory not found');
  process.exit(1);
}

// Get namespace files
const enDir = path.join(localesDir, 'en');
if (!fs.existsSync(enDir)) {
  console.error('❌ English locale directory not found');
  process.exit(1);
}

const namespaceFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));
console.log(`📁 Found ${namespaceFiles.length} namespace files: ${namespaceFiles.join(', ')}`);

// Validate each namespace
let errors = 0;
let warnings = 0;

for (const namespaceFile of namespaceFiles) {
  const namespace = path.basename(namespaceFile, '.json');
  console.log(`\n🔍 Validating ${namespace} namespace...`);

  const enPath = path.join(enDir, namespaceFile);
  const frPath = path.join(localesDir, 'fr', namespaceFile);

  // Check French file exists
  if (!fs.existsSync(frPath)) {
    console.error(`❌ Missing French file: ${frPath}`);
    errors++;
    continue;
  }

  try {
    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const frContent = JSON.parse(fs.readFileSync(frPath, 'utf8'));

    console.log(`✅ ${namespace}: EN(${Object.keys(enContent).length} keys) FR(${Object.keys(frContent).length} keys)`);

    // Simple key comparison
    const enKeys = Object.keys(enContent);
    const frKeys = Object.keys(frContent);

    const missingInFr = enKeys.filter(k => !frKeys.includes(k));
    const missingInEn = frKeys.filter(k => !enKeys.includes(k));

    if (missingInFr.length > 0) {
      console.error(`❌ Missing keys in French: ${missingInFr.join(', ')}`);
      errors++;
    }

    if (missingInEn.length > 0) {
      console.warn(`⚠️  Extra keys in French: ${missingInEn.join(', ')}`);
      warnings++;
    }

  } catch (e) {
    console.error(`❌ Failed to parse ${namespace}: ${e.message}`);
    errors++;
  }
}

console.log(`\n📊 Summary: ${errors} errors, ${warnings} warnings`);

if (errors > 0) {
  console.log('❌ Validation failed');
  process.exit(1);
} else {
  console.log('✅ All translations validated successfully');
}