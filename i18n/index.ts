// i18n/index.ts

let translations: { [key: string]: any } = {};
let currentLocale = 'de';
let isInitialized = false;

/**
 * Fetches and initializes the translation files for the application.
 * This must be called before the main application renders.
 */
export async function initI18n() {
  if (isInitialized) return;
  try {
    const [deRes, enRes] = await Promise.all([
      fetch('./i18n/de.json'),
      fetch('./i18n/en.json')
    ]);

    if (!deRes.ok || !enRes.ok) {
      throw new Error(`Failed to fetch translation files: ${deRes.status}, ${enRes.status}`);
    }

    const de = await deRes.json();
    const en = await enRes.json();
    translations = { de, en };
    isInitialized = true;
  } catch (error) {
    console.error("Failed to load i18n files. Application may not display text correctly.", error);
    // Provide empty fallbacks so the app doesn't crash on access.
    translations = { de: {}, en: {} };
    isInitialized = true; // Mark as initialized even on error to unblock the app.
  }
}

export const setLocale = (locale: string) => {
  currentLocale = translations[locale] ? locale : 'de';
};

export const getLocale = () => currentLocale;

const getTranslation = (key: string, locale: string): string | undefined => {
  const translationTable = translations[locale];
  // Direct lookup for flat JSON keys like "val.required"
  return translationTable ? translationTable[key] : undefined;
};

export const t = (key: string, params?: { [key: string]: string | number }): string => {
  let finalKey = key;
  if (params && typeof params.count === 'number') {
    finalKey = params.count === 1 ? `${key}.one` : `${key}.other`;
  }

  // 1. Try final (potentially plural) key in current locale
  let translation = getTranslation(finalKey, currentLocale);

  // 2. If plural key failed, try singular key in current locale
  if (!translation && finalKey !== key) {
    translation = getTranslation(key, currentLocale);
  }

  // 3. If still no translation and locale is not German, repeat for German (the fallback locale)
  if (!translation && currentLocale !== 'de') {
    // 3a. Try final key in German
    translation = getTranslation(finalKey, 'de');
    // 3b. If plural key in German failed, try singular key in German
    if (!translation && finalKey !== key) {
      translation = getTranslation(key, 'de');
    }
  }
  
  // If no translation is found at all, return the key as a fallback
  if (!translation) {
    if (isInitialized) {
        console.warn(`[i18n] Missing translation for key: ${key}`);
    }
    return key;
  }

  // Interpolate parameters if any
  if (params) {
    return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
      return acc.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
    }, translation);
  }

  return translation;
};