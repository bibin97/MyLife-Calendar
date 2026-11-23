import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import ml from './locales/ml/translation.json';

const LANG_KEY = 'mylife_lang';

const savedLang = localStorage.getItem(LANG_KEY) || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ml: { translation: ml }
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false
    }
  });

/**
 * Change language and persist to localStorage.
 * This is the single source of truth for language switching.
 * localStorage is used ONLY for language preference — never for auth tokens.
 */
export const changeAppLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
};

export default i18n;
