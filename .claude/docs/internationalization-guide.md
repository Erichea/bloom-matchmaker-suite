# 🌍 Internationalization Guide for Bloom Matchmaker Suite

## 📋 **MANDATORY: No Hardcoded Strings Policy**

### **🚫 CRITICAL RULE: NEVER HARDCODE USER-FACING TEXT**

When working on this codebase, **ALL** user-facing strings must be internationalized. This is **NOT OPTIONAL** - it's a mandatory requirement for every PR.

---

## 🔧 **How to Add Internationalization**

### **1. Import useTranslation Hook**
```typescript
import { useTranslation } from "react-i18next";
```

### **2. Initialize Hook in Component**
```typescript
const { t } = useTranslation();
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

## 📁 **Where Translation Keys Live**

### **English:** `/public/locales/en.json`
### **French:** `/public/locales/fr.json`

**ALWAYS add keys to BOTH files!**

---

## 🏗️ **Translation Key Organization**

### **Follow Existing Patterns:**
```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "error": "Error",
    "success": "Success"
  },
  "auth": {
    "signIn": "Sign In",
    "email": "Email",
    "password": "Password"
  },
  "dashboard": {
    "welcome": "Welcome"
  }
}
```

### **Key Naming Conventions:**
- **camelCase:** `welcomeMessage` ✅
- **Descriptive:** `userProfileTitle` ✅
- **Group by feature:** `auth.signIn`, `dashboard.loading` ✅

---

## 🚨 **CHECKLIST FOR EVERY COMPONENT/FILE**

### **Before Submitting PR:**

1. **[ ] Import `useTranslation` hook**
2. **[ ] Initialize `{ t } = useTranslation()`**
3. **[ ] Search for ANY hardcoded strings:**
   - Button text: `<button>Text</button>`
   - Labels: `<label>Text</label>`
   - Placeholders: `placeholder="Text"`
   - Titles/attributes: `title="Text"`
   - Error/success messages
   - Any text users see

4. **[ ] Replace ALL hardcoded strings with `t()` calls**
5. **[ ] Add new keys to BOTH en.json AND fr.json**
6. **[ ] Test language switching works**

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

## 📝 **Adding New Translation Keys**

### **Step 1: Add to English**
```json
// en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature",
    "action": "Get Started"
  }
}
```

### **Step 2: Add to French**
```json
// fr.json
{
  "newFeature": {
    "title": "Nouvelle fonctionnalité",
    "description": "Ceci est une nouvelle fonctionnalité",
    "action": "Commencer"
  }
}
```

### **Step 3: Use in Component**
```tsx
<h2>{t('newFeature.title')}</h2>
<p>{t('newFeature.description')}</p>
<Button>{t('newFeature.action')}</Button>
```

---

## 🔍 **How to Find Hardcoded Strings**

### **Search Patterns:**
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

## 🎯 **Examples of Proper Implementation**

### **✅ GOOD:**
```tsx
import { useTranslation } from "react-i18next";

const Component = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <Button>{t('common.submit')}</Button>
      <Input placeholder={t('form.emailPlaceholder')} />
      {error && <p>{t('error.generic')}</p>}
    </div>
  );
};
```

### **❌ BAD:**
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

## 🧪 **Testing Internationalization**

### **Manual Testing:**
1. Switch languages in the app
2. Verify ALL text updates
3. Check for any remaining English text
4. Test different screens and flows

### **Translation File Validation:**
```bash
node -e "
const en = require('./public/locales/en.json');
const fr = require('./public/locales/fr.json');
console.log('✓ en.json sections:', Object.keys(en).length);
console.log('✓ fr.json sections:', Object.keys(fr).length);
"
```

---

## 🔧 **Development Workflow**

### **When Adding New Features:**
1. Plan translation keys upfront
2. Add keys to BOTH translation files
3. Implement with t() calls from the start
4. Test both languages

### **When Fixing Bugs:**
1. Check if any hardcoded strings are involved
2. Internationalize as needed
3. Update both language files

### **When Refactoring:**
1. Preserve existing t() calls
2. Update translation keys if needed
3. Ensure both files stay in sync

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