import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import { getLocales } from 'expo-localization';
import en from '../locales/en';
import he, { type TranslationResources } from '../locales/he';

export const SUPPORTED_LANGUAGES = ['he', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = 'he';

const RTL_LANGUAGES: ReadonlySet<AppLanguage> = new Set(['he']);

function isSupported(code: string | null): code is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(code as AppLanguage);
}

/**
 * First supported language in the device's preference list, else Hebrew.
 * Older Android versions report Hebrew with the legacy code "iw".
 */
export function detectLanguage(): AppLanguage {
  for (const { languageCode } of getLocales()) {
    const code = languageCode === 'iw' ? 'he' : languageCode;
    if (isSupported(code)) return code;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Aligns the native layout direction with the app language. React Native
 * only applies a direction change after the app restarts, so this returns
 * true when a reload is needed (e.g. device in French -> app in Hebrew).
 */
function syncLayoutDirection(language: AppLanguage): boolean {
  if (Platform.OS === 'web') return false;
  const shouldBeRTL = RTL_LANGUAGES.has(language);
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);
  return I18nManager.isRTL !== shouldBeRTL;
}

const initialLanguage = detectLanguage();

// Resources are bundled, so init completes synchronously and t() works on the
// very first render. Nothing to await.
void i18n.use(initReactI18next).init({
  resources: {
    he: { translation: he },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false }, // React already escapes output
  initAsync: false,
});

syncLayoutDirection(initialLanguage);

/** Switches language at runtime. Returns true if the app must reload for RTL/LTR. */
export async function setLanguage(language: AppLanguage): Promise<boolean> {
  await i18n.changeLanguage(language);
  return syncLayoutDirection(language);
}

// Type-safe keys: t('timeline.todya') is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: TranslationResources };
  }
}

export default i18n;
