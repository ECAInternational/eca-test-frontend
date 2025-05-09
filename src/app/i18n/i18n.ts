import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations
const enTranslations = {
  'Document Name': 'Document Name',
  'Type': 'Type',
  'Status': 'Status',
  'Case': 'Case',
  'Version': 'Version',
  'Created On': 'Created On',
  'Edit': 'Edit',
  'Preview': 'Preview',
  'Download': 'Download',
  'Share for approval': 'Share for approval',
  'Failed to generate PDF': 'Failed to generate PDF',
  'Please try again': 'Please try again',
  'Unauthorized access': 'Unauthorized access',
  'Document not found': 'Document not found'
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
