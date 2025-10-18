# 🌍 Internationalization Guide for Bloom Matchmaker Suite

## 📋 **MANDATORY: No Hardcoded Strings Policy**

### **🚫 CRITICAL RULE: NEVER HARDCODE USER-FACING TEXT**

When working on this codebase, **ALL** user-facing strings must be internationalized. This is **NOT OPTIONAL** - it's a mandatory requirement for every PR.

---

## 🔧 **NEW: Namespace-Based Internationalization System**

### **🎯 CRITICAL: Always Specify Namespaces**

The translation system now uses domain-scoped namespaces for performance and maintainability.

**❌ NEVER DO THIS (old way):**
```typescript
const { t } = useTranslation(); // Loads ALL namespaces - BAD for performance
```

**✅ ALWAYS DO THIS (new way):**
```typescript
const { t } = useTranslation(['common', 'auth']); // Load only what you need
const { t } = useTranslation('dashboard'); // Single namespace
```

### **1. Import useTranslation Hook**
```typescript
import { useTranslation } from "react-i18next";
```

### **2. Initialize Hook with Namespaces**
```typescript
// For components needing multiple namespaces
const { t } = useTranslation(['common', 'auth', 'dashboard']);

// For single namespace components
const { t } = useTranslation('admin');
```

### **3. Replace ALL Hardcoded Strings**

**❌ NEVER DO THIS:**
```tsx
<Button>Submit</Button>
<span>Error occurred</span>
placeholder="Enter your email"
title="Loading..."
```

**✅ ALWAYS DO THIS:**
```tsx
<Button>{t('common.submit')}</Button>
<span>{t('common.error')}</span>
placeholder={t('auth.emailPlaceholder')}
title={t('common.loading')}
```

### **4. Conditional Strings**
```tsx
{condition ? t('common.yes') : t('common.no')}
```

### **5. Dynamic Values**
```tsx
{t('common.welcome', { name: userName })}
```

---

## 📁 **NEW: Namespace-Based File Structure**

### **Translation Files Location:**
```
public/locales/
├── en/
│   ├── common.json      # Shared UI elements
│   ├── nav.json         # Navigation items
│   ├── auth.json        # Authentication
│   ├── dashboard.json   # Client dashboard
│   ├── admin.json       # Admin interface
│   ├── profile.json     # User profiles
│   └── ... (23 total namespaces)
└── fr/
    ├── common.json
    ├── nav.json
    ├── auth.json
    └── ... (same structure as English)
```

**ALWAYS add keys to BOTH en/ AND fr/ directories!**

---

## 🏗️ **Translation Key Organization**

### **Available Namespaces:**
- `common` - Shared UI elements (buttons, loading, etc.)
- `nav` - Navigation items
- `auth` - Authentication flows
- `dashboard` - Client dashboard content
- `admin` - Admin dashboard and management
- `profile` - User profile management
- `match` - Match-related interactions
- `photos` - Photo upload/management
- `verification` - Email verification
- And 14 more domain-specific namespaces

### **Key Naming Conventions:**
- **camelCase:** `welcomeMessage` ✅
- **Descriptive:** `userProfileTitle` ✅
- **Namespace context:** `admin.totalClients`, `dashboard.welcomeBack` ✅

---

## 🚨 **CHECKLIST FOR EVERY COMPONENT/FILE**

### **Before Submitting PR:**

1. **[ ] Import `useTranslation` hook**
2. **[ ] Initialize with SPECIFIC namespaces:**
   ```typescript
   const { t } = useTranslation(['common', 'auth']); // Specify needed namespaces
   ```
3. **[ ] Search for ANY hardcoded strings:**
   - Button text: `<button>Text</button>`
   - Labels: `<label>Text</label>`
   - Placeholders: `placeholder="Text"`
   - Titles/attributes: `title="Text"`
   - Error/success messages
   - Any text users see

4. **[ ] Replace ALL hardcoded strings with `t()` calls**
5. **[ ] Add new keys to BOTH `public/locales/en/namespace.json` AND `public/locales/fr/namespace.json`**
6. **[ ] Run validation: `npm run validate:i18n`**
7. **[ ] Check for hardcoded strings: `npm run check:hardcoded-strings`**
8. **[ ] Test language switching works**

---

## 🛠️ **Common Translation Patterns**

### **Buttons:**
```tsx
<Button>{t('component.actionName')}</Button>
```

### **Forms:**
```tsx
<FormLabel>{t('form.fieldName')}</FormLabel>
<Input placeholder={t('form.fieldPlaceholder')} />
```

### **Messages:**
```tsx
toast({ title: t('message.title'), description: t('message.description') })
```

### **Conditionals:**
```tsx
{isLoading ? t('common.loading') : t('common.loaded')}
```

---

## 📝 **Adding New Translation Keys (NEW PROCESS)**

### **Step 1: Choose the Right Namespace**
- `common.json` - Shared UI elements (buttons, loading states)
- `auth.json` - Authentication related text
- `dashboard.json` - Client dashboard content
- `admin.json` - Admin interface
- `profile.json` - User profile management
- Create new namespace only if truly needed

### **Step 2: Add to English Namespace**
```json
// public/locales/en/common.json (or appropriate namespace)
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature",
    "action": "Get Started"
  }
}
```

### **Step 3: Add to French Namespace**
```json
// public/locales/fr/common.json (same namespace as English)
{
  "newFeature": {
    "title": "Nouvelle fonctionnalité",
    "description": "Ceci est une nouvelle fonctionnalité",
    "action": "Commencer"
  }
}
```

### **Step 4: Update Component with Namespace Loading**
```tsx
import { useTranslation } from "react-i18next";

const Component = () => {
  const { t } = useTranslation(['common']); // Load the namespace

  return (
    <div>
      <h2>{t('common.newFeature.title')}</h2>
      <p>{t('common.newFeature.description')}</p>
      <Button>{t('common.newFeature.action')}</Button>
    </div>
  );
};
```

### **Step 5: Validate**
```bash
npm run validate:i18n
npm run check:hardcoded-strings
```

---

## 🔍 **NEW: Automated Tools for Finding Issues**

### **Use Built-in Validation Scripts:**

```bash
# Check for hardcoded strings (automated detection)
npm run check:hardcoded-strings

# Validate translation file integrity
npm run validate:i18n
```

### **Manual Search Patterns:**
```bash
# Find all hardcoded strings
grep -r '".*"' src/ --include="*.tsx" --include="*.ts"

# Find common hardcoded patterns
grep -r "placeholder=" src/
grep -r "title=" src/
grep -r "Alert\|Error\|Success" src/
```

### **VS Code Search:**
- Search for: `"[A-Z][a-z].*"` (quoted strings)
- Search for: `placeholder=`
- Search for: `title=`

### **Development Warnings:**
The system automatically shows warnings in console for missing translation keys:
```
🔑 Missing translation key: dashboard.welcome (language: en, namespace: dashboard)
```

---

## ⚠️ **THINGS TO NEVER HARDCODE**

### **User-facing text:**
- ❌ `<span>Loading...</span>`
- ❌ `<h1>Welcome</h1>`
- ❌ `placeholder="Enter email"`
- ❌ `title="Click to edit"`
- ❌ `toast({ title: "Error" })`

### **What CAN be hardcoded:**
- ✅ Developer comments
- ✅ Console.log messages
- ✅ API endpoint URLs
- ✅ Technical constants
- ✅ CSS class names
- ✅ Database field names

---

## 🎯 **Examples of Proper Implementation (NEW)**

### **✅ GOOD (Namespace-based):**
```tsx
import { useTranslation } from "react-i18next";

const Component = () => {
  const { t } = useTranslation(['dashboard', 'common', 'auth']);

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <Button>{t('common.submit')}</Button>
      <Input placeholder={t('auth.emailPlaceholder')} />
      {error && <p>{t('common.error')}}</p>}
    </div>
  );
};
```

### **✅ GOOD (Single namespace):**
```tsx
import { useTranslation } from "react-i18next";

const AdminComponent = () => {
  const { t } = useTranslation('admin');

  return (
    <div>
      <h1>{t('admin.dashboardTitle')}</h1>
      <Button>{t('admin.loading')}</Button>
    </div>
  );
};
```

### **❌ BAD (Old way):**
```tsx
const Component = () => {
  const { t } = useTranslation(); // Loads ALL namespaces - inefficient!

  return (
    <div>
      <h1>Dashboard</h1>
      <Button>Submit</Button>
      <Input placeholder="Enter email" />
      {error && <p>Something went wrong</p>}
    </div>
  );
};
```

### **❌ BAD (Hardcoded):**
```tsx
const Component = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <Button>Submit</Button>
      <Input placeholder="Enter email" />
      {error && <p>Something went wrong</p>}
    </div>
  );
};
```

---

## 🧪 **Testing Internationalization (NEW TOOLS)**

### **Automated Testing:**
```bash
# 1. Validate translation file integrity
npm run validate:i18n

# 2. Check for hardcoded strings
npm run check:hardcoded-strings

# 3. Build to ensure type safety
npm run build
```

### **Manual Testing:**
1. Switch languages in the app
2. Verify ALL text updates
3. Check for any remaining English text
4. Test different screens and flows

### **Development Mode Testing:**
The system automatically shows warnings for:
- Missing translation keys
- Empty translations
- Invalid JSON in translation files

### **Translation File Validation:**
```bash
# Check namespace structure
node -e "
const en = require('./public/locales/en/admin.json');
const fr = require('./public/locales/fr/admin.json');
console.log('✓ admin namespace keys (EN):', Object.keys(en).length);
console.log('✓ admin namespace keys (FR):', Object.keys(fr).length);
"
```

---

## 🔧 **NEW: Development Workflow with Automation**

### **When Adding New Features:**
1. Plan translation keys upfront
2. Choose appropriate namespace(s)
3. Add keys to BOTH `public/locales/en/namespace.json` AND `public/locales/fr/namespace.json`
4. Implement with proper namespace loading from the start
5. Run `npm run validate:i18n` to ensure consistency
6. Run `npm run check:hardcoded-strings` to catch issues
7. Test both languages

### **When Fixing Bugs:**
1. Check if any hardcoded strings are involved
2. Internationalize as needed with proper namespaces
3. Update both language files
4. Run validation scripts

### **When Refactoring:**
1. Preserve existing t() calls and namespace loading
2. Update translation keys if needed
3. Ensure both namespace files stay in sync
4. Run validation after changes

### **Pre-commit Quality Check:**
```bash
# Run this before every commit
npm run validate:i18n
npm run check:hardcoded-strings
npm run build  # Ensure type safety
```

---

## 📞 **Getting Help**

### **If unsure about internationalization:**
1. Check existing components for patterns
2. Ask for review before merging
3. Test thoroughly

### **Translation best practices:**
- Keep translations concise
- Use consistent terminology
- Consider cultural differences
- Test with actual users

---

## ✅ **Final Reminders**

1. **NEVER** commit hardcoded user-facing strings
2. **ALWAYS** add keys to BOTH en.json AND fr.json
3. **ALWAYS** test language switching
4. **ALWAYS** follow existing patterns
5. **ASK** for help if unsure

**This applies to EVERY component, page, hook, and user-facing feature!**

---

*Last updated: 2024-10-18*
*For questions about this guide, ask in team discussions or create an issue.*