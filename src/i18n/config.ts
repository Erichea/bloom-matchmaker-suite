import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { supabase } from '@/integrations/supabase/client';

// Initialize i18next with lazy loading and detection
i18n
  .use(Backend) // Load translations via HTTP
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],

    // Use localStorage to persist language choice
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    backend: {
      // Load translations from /locales folder with namespaces
      loadPath: '/locales/{{lng}}/{{ns}}.json',

      // Cache translations in localStorage for offline support
      requestOptions: {
        cache: 'default',
      },
    },

    // Default namespaces to load
    defaultNS: ['common', 'nav', 'auth', 'dashboard'],

    // List of all available namespaces
    ns: ['common', 'nav', 'auth', 'dashboard', 'profileStatus', 'matches', 'protected', 'landing', 'error', 'notes', 'suggest', 'profile', 'notifications', 'errors', 'success', 'languageSwitcher', 'photos', 'crop', 'verification', 'questionnaire', 'match', 'admin', 'pwa'],

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // React specific options
    react: {
      useSuspense: true, // Use Suspense for lazy loading
    },

    // Enable debug in development
    debug: import.meta.env.DEV,

    // Development-time warnings
    saveMissing: import.meta.env.DEV,
    returnNull: false,
    returnEmptyString: false,
    returnObjects: false,

    // Missing key handler
    missingKeyHandler: import.meta.env.DEV ? (lng, ns, key) => {
      console.warn(`🔑 Missing translation key: ${key} (language: ${lng}, namespace: ${ns})`);
    } : undefined,
  });

/**
 * Load user's language preference from database and update i18n
 * Call this after user authentication
 */
export async function loadUserLanguagePreference(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading language preference:', error);
      return;
    }

    if (data?.preferred_language && data.preferred_language !== i18n.language) {
      await i18n.changeLanguage(data.preferred_language);
    }
  } catch (err) {
    console.error('Error loading user language preference:', err);
  }
}

export default i18n;
