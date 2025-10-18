# 🚀 Bloom Matchmaker Suite - Development Guidelines

## 🌍 **INTERNATIONALIZATION IS MANDATORY**

### **🚫 CRITICAL RULE: NO HARDCODED STRINGS**

**This is the most important rule in this codebase.**

**ALL user-facing text MUST be internationalized. No exceptions.**

#### **❌ NEVER DO:**
```tsx
<Button>Submit</Button>
<span>Error occurred</span>
placeholder="Enter email"
title="Loading..."
```

#### **✅ ALWAYS DO:**
```tsx
<Button>{t('common.submit')}</Button>
<span>{t('common.error')}</span>
placeholder={t('auth.emailPlaceholder')}
title={t('common.loading')}
```

**See complete guide:** [`.claude/docs/internationalization-guide.md`](.claude/docs/internationalization-guide.md)

---

## 🔧 **Getting Started**

### Prerequisites
- Node.js 18+
- npm/yarn
- Supabase CLI

### Setup
```bash
npm install
npm run dev
```

---

## 📁 **Project Structure**

```
src/
├── components/     # React components
├── pages/         # React pages
├── hooks/         # Custom hooks
├── i18n/          # Internationalization config
└── lib/           # Utilities

public/locales/
├── en.json        # English translations
└── fr.json        # French translations

.claude/
├── docs/          # Documentation
├── hooks/         # Pre-commit hooks
└── commands/      # Custom commands
```

---

## 🔍 **Code Quality**

### Internationalization Checklist for Every File
- [ ] Import `useTranslation` hook
- [ ] Initialize `{ t } = useTranslation()`
- [ ] Replace ALL hardcoded strings with `t()` calls
- [ ] Add keys to BOTH `en.json` AND `fr.json`
- [ ] Test language switching

### Search for Hardcoded Strings
```bash
# Find quoted strings
grep -r '"[A-Z][a-zA-Z ]*"' src/ --include="*.tsx" --include="*.ts"

# Find placeholders
grep -r "placeholder=" src/ --include="*.tsx" --include="*.ts"

# Find titles
grep -r "title=" src/ --include="*.tsx" --include="*.ts"
```

---

## 🎯 **Development Workflow**

### 1. When Adding New Features
1. Plan translation keys upfront
2. Add keys to BOTH language files
3. Implement with t() calls from start
4. Test both languages

### 2. When Fixing Bugs
1. Check if hardcoded strings are involved
2. Internationalize as needed
3. Update both language files

### 3. Before Submitting PR
1. Run `/check-i18n` command
2. Test language switching
3. Ensure no hardcoded strings remain

---

## 🚨 **Common Mistakes to Avoid**

### ❌ Hardcoded Text
```tsx
// BAD
<h1>Welcome</h1>
<Button>Submit Form</Button>
toast({ title: "Error occurred" })
```

### ❌ Single Language File
```json
// BAD - only added to English
{ "welcome": "Welcome" }
```

### ❌ Missing Hook Import
```tsx
// BAD - forgot import
const Component = () => {
  // Missing: import { useTranslation } from "react-i18next"
  const { t } = useTranslation();
  return <h1>{t('welcome')}</h1>;
};
```

---

## ✅ **Best Practices**

### ✅ Proper Implementation
```tsx
import { useTranslation } from "react-i18next";

const Component = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <Button>{t('common.submit')}</Button>
      <Input placeholder={t('form.emailPlaceholder')} />
    </div>
  );
};
```

### ✅ Translation Keys
```json
// en.json AND fr.json
{
  "welcome": {
    "title": "Welcome",
    "subtitle": "Get started with Bloom"
  },
  "common": {
    "submit": "Submit",
    "cancel": "Cancel"
  }
}
```

---

## 🧪 **Testing**

### Manual Testing
1. Switch between English and French
2. Verify ALL text updates correctly
3. Check all user flows
4. Test error states and loading states

### Automated Testing
```bash
# Validate translation files
node -e "
const en = require('./public/locales/en.json');
const fr = require('./public/locales/fr.json');
console.log('✓ Translation files valid');
"
```

---

## 📞 **Getting Help**

### Resources
- [Internationalization Guide](.claude/docs/internationalization-guide.md)
- [Existing Components](src/components/) - for examples
- [Translation Files](public/locales/) - for patterns

### When Stuck
1. Check existing components for similar patterns
2. Ask for review before merging
3. Test with both languages
4. Read the complete i18n guide

---

## ⚡ **Quick Reference**

### Import Hook
```typescript
import { useTranslation } from "react-i18next";
```

### Initialize Hook
```typescript
const { t } = useTranslation();
```

### Use Translation
```typescript
{t('key.name')}
{t('key.name', { variable: value })}
```

### Conditional
```typescript
{condition ? t('key.yes') : t('key.no')}
```

---

**REMEMBER: Internationalization is mandatory for every user-facing string!** 🌍

*For questions, see the complete internationalization guide or ask team members.*