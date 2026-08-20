import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/src/locales/en.json';
import ro from '@/src/locales/ro.json';
import es from '@/src/locales/es.json';
import fr from '@/src/locales/fr.json';
import de from '@/src/locales/de.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ro: { translation: ro },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
