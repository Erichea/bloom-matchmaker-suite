import 'i18next';

// Define all available namespaces
type TranslationNamespace =
  | 'common'
  | 'nav'
  | 'auth'
  | 'dashboard'
  | 'profileStatus'
  | 'matches'
  | 'protected'
  | 'landing'
  | 'error'
  | 'notes'
  | 'suggest'
  | 'profile'
  | 'notifications'
  | 'errors'
  | 'success'
  | 'languageSwitcher'
  | 'photos'
  | 'crop'
  | 'verification'
  | 'questionnaire'
  | 'match'
  | 'admin'
  | 'pwa';

// Define translation resources structure
interface TranslationResources {
  common: {
    loading: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    close: string;
    confirm: string;
    back: string;
    next: string;
    submit: string;
    search: string;
    filter: string;
    language: string;
    logout: string;
    settings: string;
    error: string;
    success: string;
    sending: string;
  };
  nav: {
    home: string;
    matches: string;
    profile: string;
    dashboard: string;
    admin: string;
    clients: string;
    updates: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    forgotPassword: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    loginTitle: string;
    loginSubtitle: string;
    signUpTitle: string;
    signUpSubtitle: string;
    signInError: string;
    signUpError: string;
    signOutError: string;
    signupErrorDescription: string;
    signInSuccess: string;
    authenticationError: string;
    signInAgainMessage: string;
    invitationAccess: string;
    privateMembers: string;
    signInOrFinishInvitation: string;
    bloomMembers: string;
    createAccount: string;
    invitationRequired: string;
    membersOnly: string;
  };
  dashboard: {
    welcomeBack: string;
    there: string;
    completeYourProfile: string;
    welcomeName: string;
    letsGetStarted: string;
    questionnaireProgress: string;
    updateQuestionnaire: string;
    continueQuestionnaire: string;
    pendingMatches: string;
    completeProfileQuestionnaire: string;
    lookingForMutualMatches: string;
    viewMutualMatches: string;
    welcome: string;
    recentActivity: string;
    statistics: string;
    totalMatches: string;
    activeMatches: string;
    profileViews: string;
  };
  // Add other namespaces as needed...
  [key: string]: any;
}

// Extend i18next module to include our types
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: ['common', 'nav', 'auth', 'dashboard'];
    ns: TranslationNamespace;
    returnNull: false;
    returnEmptyString: false;
    returnObjects: false;

    // Define the type structure for translations
    resources: {
      en: TranslationResources;
      fr: TranslationResources;
    };
  }
}

// Enhanced useTranslation hook with namespace support
import { useTranslation as useTranslationBase } from 'react-i18next';

export function useTranslation(
  namespaces?: TranslationNamespace | TranslationNamespace[]
) {
  return useTranslationBase(namespaces);
}

// Type-safe translation function
export type TFunction = {
  <TKeys extends string>(key: TKeys, options?: any): string;
  <TKeys extends string, TInterpolationMap extends Record<string, unknown>>(
    key: TKeys,
    options?: TInterpolationMap
  ): string;
};