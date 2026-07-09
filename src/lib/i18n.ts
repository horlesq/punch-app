import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/src/locales/en.json';
import ro from '@/src/locales/ro.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ro: { translation: ro },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
