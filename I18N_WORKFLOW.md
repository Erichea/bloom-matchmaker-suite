# Internationalization (i18n) Workflow

This guide outlines the proper workflow for working with translations in the Bloom Matchmaker Suite.

## 🌍 Translation System Architecture

- **Framework**: React i18next with namespace-based organization
- **Languages**: English (en), French (fr)
- **File Structure**: `public/locales/{language}/{namespace}.json`
- **Type Safety**: TypeScript definitions with development-time warnings

## 📁 Namespace Organization

Translations are organized into domain-scoped namespaces:

- `common.json` - Shared UI elements (buttons, loading states, etc.)
- `nav.json` - Navigation items
- `auth.json` - Authentication related text
- `dashboard.json` - Client dashboard content
- `admin.json` - Admin dashboard and management interface
- `profile.json` - User profile management
- `match.json` - Match-related interactions
- And other feature-specific namespaces...

## 🔧 Development Workflow

### 1. Adding New Translations

**NEVER** hardcode user-facing strings in components. Always use translation keys.

```tsx
// ❌ BAD - Hardcoded string
<button>Submit</button>

// ✅ GOOD - Using translation
const { t } = useTranslation(['common']);
<button>{t('common.submit')}</button>
```

**Steps to add new translations:**

1. Add the key to both `public/locales/en/{namespace}.json` and `public/locales/fr/{namespace}.json`
2. Use the key in your component with proper namespace loading
3. Run validation: `npm run validate:i18n`

### 2. Namespace Loading

Always specify which namespaces you need:

```tsx
// ❌ BAD - Loads all namespaces
const { t } = useTranslation();

// ✅ GOOD - Specific namespaces
const { t } = useTranslation(['common', 'auth']);
const { t } = useTranslation('dashboard'); // Single namespace
```

### 3. Translation Key Conventions

- Use camelCase for keys: `welcomeMessage` (not `welcome_message`)
- Group related keys together
- Use descriptive names: `profile.saveSuccess` instead of `profile.success`
- Follow the namespace structure: `namespace.section.key`

## 🛠️ Available Scripts

### Validation
```bash
npm run validate:i18n
```
Validates all translation files for:
- Missing keys between languages
- Duplicate keys
- Empty translations
- Structural consistency

### Build Integration
The build process will fail if:
- Translation files contain invalid JSON
- Required namespaces are missing
- Type definitions are inconsistent

## 🚨 Common Pitfalls

### 1. Forgetting Namespaces
```tsx
// ❌ This will cause runtime errors
const { t } = useTranslation();
return <h1>{t('dashboard.welcomeBack')}</h1>; // dashboard not loaded!

// ✅ Correct approach
const { t } = useTranslation(['dashboard']);
return <h1>{t('dashboard.welcomeBack')}</h1>;
```

### 2. Hardcoded Strings
Always search for hardcoded English strings before committing:
```bash
grep -r '"[A-Z][a-zA-Z ]*"' src/ --include="*.tsx" --include="*.ts"
```

### 3. Missing French Translations
Always add translations to BOTH languages. The validation script will catch this.

## 🔄 Pre-commit Hook (Recommended)

Add this to your `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# Validate translations before commit
npm run validate:i18n
if [ $? -ne 0 ]; then
  echo "❌ Translation validation failed. Please fix translation issues before committing."
  exit 1
fi
```

## 📝 Adding New Namespaces

1. Create files: `public/locales/en/{namespace}.json` and `public/locales/fr/{namespace}.json`
2. Add namespace to `src/i18n/config.ts` in the `ns` array
3. Update TypeScript definitions in `src/i18n/types.d.ts`
4. Run validation to ensure consistency

## 🐛 Debugging Translation Issues

### Missing Keys
Development mode will show warnings in console:
```
🔑 Missing translation key: dashboard.welcome (language: en, namespace: dashboard)
```

### Build Failures
If builds fail due to translations:
1. Check validation output: `npm run validate:i18n`
2. Ensure all namespaces are properly loaded
3. Verify JSON syntax in translation files

## 📊 Translation Statistics

Current translation coverage:
- **Total namespaces**: 23
- **Total keys**: 350+ (varies as we add more)
- **Languages**: English (en), French (fr)
- **Validation**: Automated with 100% coverage requirement

## 🎯 Best Practices

1. **Think translations first**: Before writing UI text, consider how it will be translated
2. **Use interpolation**: For dynamic content, use proper interpolation: `t('welcome', { name: userName })`
3. **Test both languages**: Switch between languages to test layout and formatting
4. **Keep translations consistent**: Use the same terminology across the app
5. **Document context**: Add comments for complex translations that need cultural context

## 🔍 Code Review Checklist

When reviewing PRs, check for:
- [ ] No hardcoded user-facing strings
- [ ] Proper namespace loading
- [ ] Translation keys follow conventions
- [ ] Both English and French translations provided
- [ ] Validation passes (`npm run validate:i18n`)

## 🚀 Performance Considerations

- Namespaces are loaded on-demand
- Only load the namespaces you need
- Common namespace is loaded by default for shared elements
- Build process optimizes translation bundle size

---

## Quick Reference

### Translation Key Examples
```tsx
// Common elements
t('common.save')
t('common.loading')
t('common.cancel')

// Auth flow
t('auth.signIn')
t('auth.welcomeBack', { name: 'John' })

// Dashboard
t('dashboard.welcomeBack')
t('dashboard.totalClients')

// Admin interface
t('admin.totalClients')
t('admin.recentProfileUpdates')
```

### Finding Translation Issues
```bash
# Find hardcoded strings
grep -r '"[A-Z][a-zA-Z ]*"' src/ --include="*.tsx" --include="*.ts"

# Validate translations
npm run validate:i18n

# Check specific namespace
cat public/locales/en/dashboard.json
```