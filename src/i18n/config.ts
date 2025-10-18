import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

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
      // Load translations from /locales folder
      loadPath: '/locales/{{lng}}.json',
      
      // Cache translations in localStorage for offline support
      requestOptions: {
        cache: 'default',
      },
    },

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
  });

export default i18n;
