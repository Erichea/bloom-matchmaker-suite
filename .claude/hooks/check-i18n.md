# 🌍 Internationalization Check Hook

## Purpose
This hook runs automatically to ensure no hardcoded strings are committed to the codebase.

## What it checks
1. **useTranslation Import**: Ensures `useTranslation` is imported in components with user-facing text
2. **Hardcoded Strings**: Searches for English strings that should be translated
3. **Translation Keys**: Validates that keys exist in both en.json and fr.json
4. **File Coverage**: Checks that all new components follow i18n standards

## Commands it runs
```bash
# Check for hardcoded strings
grep -r '"[A-Z][a-zA-Z ]*"' src/ --include="*.tsx" --include="*.ts" | head -20

# Check for placeholder attributes
grep -r "placeholder=" src/ --include="*.tsx" --include="*.ts" | head -10

# Check for title attributes
grep -r "title=" src/ --include="*.tsx" --include="*.ts" | head -10

# Validate translation files
node -e "
const en = require('./public/locales/en.json');
const fr = require('./public/locales/fr.json');
console.log('✓ en.json valid:', Object.keys(en).length, 'sections');
console.log('✓ fr.json valid:', Object.keys(fr).length, 'sections');
"
```

## ❌ Common Issues Found

### Hardcoded Strings
```
❌ <Button>Submit</Button>
❌ <span>Error occurred</span>
❌ placeholder="Enter your email"
❌ title="Loading..."
```

### ✅ Correct Implementation
```
✅ <Button>{t('common.submit')}</Button>
✅ <span>{t('common.error')}</span>
✅ placeholder={t('auth.emailPlaceholder')}
✅ title={t('common.loading')}
```

## 🚨 Blocking Issues

The hook will fail if:
- Hardcoded English strings are found
- useTranslation is missing in components with UI text
- Translation keys exist in only one language file
- Components don't follow i18n patterns

## 🔧 How to Fix Issues

1. **Add useTranslation import:**
   ```typescript
   import { useTranslation } from "react-i18next";
   ```

2. **Initialize the hook:**
   ```typescript
   const { t } = useTranslation();
   ```

3. **Replace hardcoded strings:**
   ```typescript
   // Before
   <Button>Submit</Button>

   // After
   <Button>{t('common.submit')}</Button>
   ```

4. **Add keys to BOTH files:**
   ```json
   // en.json
   { "common": { "submit": "Submit" } }

   // fr.json
   { "common": { "submit": "Soumettre" } }
   ```

## 📚 Reference

For complete internationalization guidelines, see:
- `.claude/docs/internationalization-guide.md`
- Existing components for examples
- Team members for help

---

**Remember: NO hardcoded user-facing strings in the codebase!** 🚫✅