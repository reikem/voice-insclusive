export const LANGS: { code: string; name: string; ml: any }[] = [
    ['es', 'Español'], ['en', 'Inglés'], ['fr', 'Francés'], ['pt', 'Portugués'], ['ca', 'Catalán'], ['it', 'Italiano'], ['de', 'Alemán'], ['ja', 'Japonés'],
  ].map(([code, name]) => ({ code, name, ml: code }));
  export async function translate(_t: string, _f: any, _to: any, _cb?: () => void): Promise<string> {
    throw new Error('La traducción sin internet solo está disponible en la app de Android o iOS.');
  }
  