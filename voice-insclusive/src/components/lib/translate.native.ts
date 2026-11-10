import TranslateText, { TranslateLanguage } from '@react-native-ml-kit/translate-text';
export const LANGS: { code: string; name: string; ml: any }[] = [
  { code: 'es', name: 'Español', ml: TranslateLanguage.SPANISH }, { code: 'en', name: 'Inglés', ml: TranslateLanguage.ENGLISH },
  { code: 'fr', name: 'Francés', ml: TranslateLanguage.FRENCH }, { code: 'pt', name: 'Portugués', ml: TranslateLanguage.PORTUGUESE },
  { code: 'ca', name: 'Catalán', ml: TranslateLanguage.CATALAN }, { code: 'it', name: 'Italiano', ml: TranslateLanguage.ITALIAN },
  { code: 'de', name: 'Alemán', ml: TranslateLanguage.GERMAN }, { code: 'ja', name: 'Japonés', ml: TranslateLanguage.JAPANESE },
];
// Sin internet si los modelos ya están descargados; si faltan, descarga solo esa vez.
export async function translate(text: string, from: any, to: any, onDownload?: () => void) {
  try { return await TranslateText.translate({ text, sourceLanguage: from, targetLanguage: to, downloadModelIfNeeded: false }); }
  catch { onDownload?.(); return await TranslateText.translate({ text, sourceLanguage: from, targetLanguage: to, downloadModelIfNeeded: true }); }
}
