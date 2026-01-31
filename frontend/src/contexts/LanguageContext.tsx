import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  changeLanguage as i18nChangeLanguage, 
  getCurrentLanguage, 
  SUPPORTED_LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage 
} from '../i18n';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>(getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(false);

  // Sync language from user profile when user logs in
  useEffect(() => {
    const syncLanguageFromUser = async () => {
      if (user?.language && SUPPORTED_LANGUAGES.includes(user.language as SupportedLanguage)) {
        const userLang = user.language as SupportedLanguage;
        if (userLang !== language) {
          await i18nChangeLanguage(userLang);
          setLanguageState(userLang);
        }
      }
    };

    syncLanguageFromUser();
  }, [user?.language]);

  // Keep state in sync with i18n
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage)) {
        setLanguageState(lng as SupportedLanguage);
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    
    setIsLoading(true);
    try {
      // Change language in i18n (also saves to localStorage)
      await i18nChangeLanguage(lang);
      setLanguageState(lang);

      // If user is logged in, sync to backend
      if (user) {
        try {
          await fetch('/api/v1/settings/language', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ language: lang }),
          });
        } catch (error) {
          // Silently fail - language is still saved locally
          console.warn('Failed to sync language preference to server:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
