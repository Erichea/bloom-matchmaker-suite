import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to trigger AI translation for a new language
 * This can be called from the admin panel or edge function
 */
export async function translateToNewLanguage(
  sourceLanguage: string,
  targetLanguage: string,
  sourceTranslations: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.functions.invoke('translate-locales', {
      body: {
        sourceLanguage,
        targetLanguage,
        translations: sourceTranslations,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Helper to flatten nested translation object for editing
 */
export function flattenTranslations(
  obj: Record<string, any>,
  prefix = ''
): Record<string, string> {
  return Object.keys(obj).reduce((acc: Record<string, string>, key: string) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(acc, flattenTranslations(obj[key], fullKey));
    } else {
      acc[fullKey] = obj[key];
    }
    return acc;
  }, {});
}

/**
 * Helper to unflatten translations back to nested structure
 */
export function unflattenTranslations(
  flat: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.keys(flat).forEach((key) => {
    const keys = key.split('.');
    let current = result;
    
    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        current[k] = flat[key];
      } else {
        current[k] = current[k] || {};
        current = current[k];
      }
    });
  });
  
  return result;
}
