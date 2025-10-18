#!/usr/bin/env tsx

/**
 * Translation Validation Script
 *
 * This script validates the integrity of translation files by:
 * 1. Parsing translation files with duplicate-key awareness
 * 2. Comparing key structure between languages
 * 3. Verifying interpolation placeholders match
 * 4. Checking for missing or empty translations
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface TranslationIssue {
  type: 'duplicate_key' | 'missing_key' | 'missing_translation' | 'placeholder_mismatch' | 'empty_translation';
  severity: 'error' | 'warning';
  file: string;
  key?: string;
  message: string;
  details?: any;
}

class TranslationValidator {
  private issues: TranslationIssue[] = [];
  private localesDir = path.join(process.cwd(), 'public', 'locales');
  private languages = ['en', 'fr'];

  async validate(): Promise<void> {
    console.log('🔍 Validating translation files...\n');
    console.log(`📂 Looking in: ${this.localesDir}`);

    // Check if locales directory exists
    if (!fs.existsSync(this.localesDir)) {
      this.addIssue({
        type: 'missing_key',
        severity: 'error',
        file: this.localesDir,
        message: 'Locales directory not found'
      });
      return;
    }

    // Get all namespace files
    const namespaceFiles = await this.getNamespaceFiles();

    if (namespaceFiles.length === 0) {
      this.addIssue({
        type: 'missing_key',
        severity: 'error',
        file: this.localesDir,
        message: 'No namespace translation files found'
      });
      return;
    }

    console.log(`📁 Found ${namespaceFiles.length} namespaces\n`);

    // Validate each namespace
    for (const namespace of namespaceFiles) {
      await this.validateNamespace(namespace);
    }

    // Print results
    this.printResults();

    // Exit with error code if there are error-level issues
    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    if (errorCount > 0) {
      process.exit(1);
    }
  }

  private async getNamespaceFiles(): Promise<string[]> {
    try {
      const enFiles = await glob('*.json', { cwd: path.join(this.localesDir, 'en') });
      return enFiles.map(f => path.basename(f, '.json'));
    } catch (error) {
      return [];
    }
  }

  private async validateNamespace(namespace: string): Promise<void> {
    console.log(`🔍 Validating ${namespace} namespace...`);

    const translations: Record<string, any> = {};
    const fileContents: Record<string, string> = {};

    // Load all language files for this namespace
    for (const lang of this.languages) {
      const filePath = path.join(this.localesDir, lang, `${namespace}.json`);

      if (!fs.existsSync(filePath)) {
        this.addIssue({
          type: 'missing_key',
          severity: 'error',
          file: filePath,
          message: `Missing ${lang} translation file for namespace: ${namespace}`
        });
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        fileContents[lang] = content;

        // Check for duplicate keys by parsing with line tracking
        const { data: parsed, duplicates } = this.parseWithDuplicateTracking(content);

        if (duplicates.length > 0) {
          for (const dup of duplicates) {
            this.addIssue({
              type: 'duplicate_key',
              severity: 'error',
              file: filePath,
              key: dup.key,
              message: `Duplicate key "${dup.key}" found at lines ${dup.lines.join(', ')}`,
              details: dup
            });
          }
        }

        translations[lang] = parsed;
      } catch (error) {
        this.addIssue({
          type: 'missing_key',
          severity: 'error',
          file: filePath,
          message: `Failed to parse ${lang} translation file: ${error.message}`
        });
      }
    }

    // Compare key structure between languages
    if (translations.en && translations.fr) {
      this.compareKeyStructures(namespace, translations);
      this.validatePlaceholders(namespace, translations);
      this.checkEmptyTranslations(namespace, translations);
    }

    console.log(`✓ ${namespace} validated\n`);
  }

  private parseWithDuplicateTracking(content: string): { data: any; duplicates: Array<{key: string, lines: number[]}> } {
    const lines = content.split('\n');
    const duplicates: Array<{key: string, lines: number[]}> = [];
    const keyMap: Record<string, number> = {};

    try {
      const data = JSON.parse(content);

      // Track key occurrences by scanning the raw content
      lines.forEach((line, index) => {
        const keyMatch = line.match(/^\s*"([^"]+)":/);
        if (keyMatch) {
          const key = keyMatch[1];
          if (keyMap[key]) {
            if (!duplicates.find(d => d.key === key)) {
              duplicates.push({ key, lines: [keyMap[key]] });
            }
            duplicates.find(d => d.key === key)!.lines.push(index + 1);
          } else {
            keyMap[key] = index + 1;
          }
        }
      });

      return { data, duplicates };
    } catch (error) {
      throw new Error(`JSON parse error: ${error.message}`);
    }
  }

  private compareKeyStructures(namespace: string, translations: Record<string, any>): void {
    const enKeys = this.getAllKeys(translations.en, '');
    const frKeys = this.getAllKeys(translations.fr, '');

    const missingInFr = enKeys.filter(key => !frKeys.includes(key));
    const missingInEn = frKeys.filter(key => !enKeys.includes(key));

    for (const key of missingInFr) {
      this.addIssue({
        type: 'missing_key',
        severity: 'error',
        file: `public/locales/fr/${namespace}.json`,
        key,
        message: `Missing French translation for key: ${key}`
      });
    }

    for (const key of missingInEn) {
      this.addIssue({
        type: 'missing_key',
        severity: 'warning',
        file: `public/locales/en/${namespace}.json`,
        key,
        message: `Extra key in French (missing in English): ${key}`
      });
    }
  }

  private validatePlaceholders(namespace: string, translations: Record<string, any>): void {
    const enKeys = this.getAllKeys(translations.en, '');

    for (const key of enKeys) {
      const enValue = this.getNestedValue(translations.en, key);
      const frValue = this.getNestedValue(translations.fr, key);

      if (typeof enValue === 'string' && typeof frValue === 'string') {
        const enPlaceholders = this.extractPlaceholders(enValue);
        const frPlaceholders = this.extractPlaceholders(frValue);

        const missingInFr = enPlaceholders.filter(p => !frPlaceholders.includes(p));
        const missingInEn = frPlaceholders.filter(p => !enPlaceholders.includes(p));

        if (missingInFr.length > 0) {
          this.addIssue({
            type: 'placeholder_mismatch',
            severity: 'error',
            file: `public/locales/fr/${namespace}.json`,
            key,
            message: `Missing placeholders in French: ${missingInFr.join(', ')}`,
            details: { en: enPlaceholders, fr: frPlaceholders }
          });
        }

        if (missingInEn.length > 0) {
          this.addIssue({
            type: 'placeholder_mismatch',
            severity: 'error',
            file: `public/locales/en/${namespace}.json`,
            key,
            message: `Missing placeholders in English: ${missingInEn.join(', ')}`,
            details: { en: enPlaceholders, fr: frPlaceholders }
          });
        }
      }
    }
  }

  private checkEmptyTranslations(namespace: string, translations: Record<string, any>): void {
    const enKeys = this.getAllKeys(translations.en, '');

    for (const key of enKeys) {
      const enValue = this.getNestedValue(translations.en, key);
      const frValue = this.getNestedValue(translations.fr, key);

      if (!enValue || (typeof enValue === 'string' && enValue.trim() === '')) {
        this.addIssue({
          type: 'empty_translation',
          severity: 'warning',
          file: `public/locales/en/${namespace}.json`,
          key,
          message: `Empty English translation for key: ${key}`
        });
      }

      if (!frValue || (typeof frValue === 'string' && frValue.trim() === '')) {
        this.addIssue({
          type: 'empty_translation',
          severity: 'error',
          file: `public/locales/fr/${namespace}.json`,
          key,
          message: `Empty French translation for key: ${key}`
        });
      }
    }
  }

  private getAllKeys(obj: any, prefix: string): string[] {
    const keys: string[] = [];

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...this.getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys;
  }

  private getNestedValue(obj: any, keyPath: string): any {
    return keyPath.split('.').reduce((current, key) => current?.[key], obj);
  }

  private extractPlaceholders(text: string): string[] {
    const placeholders: string[] = [];
    const regex = /\{\{([^}]+)\}\}/g; // {{placeholder}} format
    const regex2 = /\{([^}]+)\}/g; // {placeholder} format

    let match;
    while ((match = regex.exec(text)) !== null) {
      placeholders.push(match[1]);
    }

    // Reset regex lastIndex
    regex.lastIndex = 0;
    while ((match = regex2.exec(text)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }

    return placeholders;
  }

  private addIssue(issue: TranslationIssue): void {
    this.issues.push(issue);
  }

  private printResults(): void {
    console.log('📊 Validation Results:\n');

    if (this.issues.length === 0) {
      console.log('✅ All translations are valid!');
      return;
    }

    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      console.log(`❌ ${errors.length} Error(s) found:\n`);
      errors.forEach((issue, index) => {
        console.log(`${index + 1}. [ERROR] ${issue.message}`);
        if (issue.key) console.log(`   Key: ${issue.key}`);
        console.log(`   File: ${issue.file}`);
        if (issue.details) console.log(`   Details: ${JSON.stringify(issue.details, null, 2)}`);
        console.log('');
      });
    }

    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} Warning(s):\n`);
      warnings.forEach((issue, index) => {
        console.log(`${index + 1}. [WARNING] ${issue.message}`);
        if (issue.key) console.log(`   Key: ${issue.key}`);
        console.log(`   File: ${issue.file}`);
        console.log('');
      });
    }

    console.log(`📈 Summary: ${errors.length} errors, ${warnings.length} warnings`);
  }
}

// Run validation if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const validator = new TranslationValidator();
  validator.validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

export default TranslationValidator;