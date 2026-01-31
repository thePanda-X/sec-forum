import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
import commonEN from './locales/en/common.json';
import authEN from './locales/en/auth.json';
import forumEN from './locales/en/forum.json';
import notificationsEN from './locales/en/notifications.json';
import settingsEN from './locales/en/settings.json';
import profileEN from './locales/en/profile.json';
import adminEN from './locales/en/admin.json';
import errorsEN from './locales/en/errors.json';

// Spanish translations
import commonES from './locales/es/common.json';
import authES from './locales/es/auth.json';
import forumES from './locales/es/forum.json';
import notificationsES from './locales/es/notifications.json';
import settingsES from './locales/es/settings.json';
import profileES from './locales/es/profile.json';
import adminES from './locales/es/admin.json';
import errorsES from './locales/es/errors.json';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español'
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇺🇸',
  es: '🇪🇸'
};

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    forum: forumEN,
    notifications: notificationsEN,
    settings: settingsEN,
    profile: profileEN,
    admin: adminEN,
    errors: errorsEN
  },
  es: {
    common: commonES,
    auth: authES,
    forum: forumES,
    notifications: notificationsES,
    settings: settingsES,
    profile: profileES,
    admin: adminES,
    errors: errorsES
  }
};

// Storage key for language preference
export const LANGUAGE_STORAGE_KEY = 'sec-forum-language';

// Get initial language from localStorage or browser
const getInitialLanguage = (): SupportedLanguage => {
  // Check localStorage first
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }
  
  // Fall back to browser language
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }
  
  return 'en';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'forum', 'notifications', 'settings', 'profile', 'admin', 'errors'],
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY
    }
  });

// Helper function to change language and persist to localStorage
export const changeLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
};

// Helper function to get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  return i18n.language as SupportedLanguage;
};

// Helper to translate API error keys
export const translateApiKey = (key: string): string => {
  const translation = i18n.t(`errors:api.${key}`, { defaultValue: '' });
  return translation || key;
};

export default i18n;
