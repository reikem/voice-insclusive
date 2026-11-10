import { Platform, Alert, Share } from 'react-native';
// CAMBIO CLAVE: Importa desde 'expo-file-system/legacy'
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

const web = Platform.OS === 'web';
export const AUDIO_DIR = `${FileSystem.documentDirectory ?? ''}audios/`;
const HIST = `${FileSystem.documentDirectory ?? ''}history.json`;
const MIME: Record<string, string> = { wav: 'audio/wav', webm: 'audio/webm', mp4: 'audio/mp4', txt: 'text/plain' };
export const mimeOf = (ext?: string) => MIME[ext ?? 'wav'] ?? 'application/octet-stream';

export const notify = (t: string, m = '') => (web ? window.alert(m ? `${t}\n${m}` : t) : Alert.alert(t, m));
export const confirmAsk = (t: string, m: string): Promise<boolean> =>
  web ? Promise.resolve(window.confirm(`${t}\n${m}`))
      : new Promise(r => Alert.alert(t, m, [{ text: 'Cancelar', style: 'cancel', onPress: () => r(false) }, { text: 'Eliminar', style: 'destructive', onPress: () => r(true) }]));

export async function shareText(message: string) {
  if (web) {
    const nav: any = navigator;
    if (nav.share) { try { await nav.share({ text: message }); return; } catch { /* cancelado */ } }
    await Clipboard.setStringAsync(message); notify('Copiado', 'Tu navegador no permite compartir; el texto se copió al portapapeles.');
  } else await Share.share({ message });
}
export async function ensureAudioDir() {
  if (web) return;
  const i = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!i.exists) await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
}
// Guarda un archivo en el equipo/teléfono. Devuelve un mensaje o null.
export async function saveFile(uri: string, name: string, mime: string): Promise<string | null> {
  if (web) { const a = document.createElement('a'); a.href = uri; a.download = name; document.body.appendChild(a); a.click(); a.remove(); return 'Descarga iniciada en tu carpeta de descargas.'; }
  if (Platform.OS === 'android') {
    const SAF = FileSystem.StorageAccessFramework;
    const p = await SAF.requestDirectoryPermissionsAsync();
    if (!p.granted) return null;
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const dest = await SAF.createFileAsync(p.directoryUri, name.replace(/\.[^.]+$/, ''), mime);
    await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
    return 'Guardado en la carpeta que elegiste.';
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartir no está disponible en este dispositivo.');
  await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Guardar en Archivos' });
  return null;
}
export async function saveTextFile(name: string, text: string) {
  if (web) { const u = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); try { return await saveFile(u, name, 'text/plain'); } finally { setTimeout(() => URL.revokeObjectURL(u), 5000); } }
  const tmp = `${FileSystem.cacheDirectory}${name}`;
  await FileSystem.writeAsStringAsync(tmp, text);
  try { return await saveFile(tmp, name, 'text/plain'); } finally { FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {}); }
}
export async function deleteAudio(uri?: string) {
  if (!uri) return;
  try { if (web) URL.revokeObjectURL(uri); else await FileSystem.deleteAsync(uri, { idempotent: true }); } catch { /* ya no existe */ }
}
export async function loadHist(): Promise<any[]> {
  try {
    const raw = web ? localStorage.getItem('vox.hist') : (await FileSystem.getInfoAsync(HIST)).exists ? await FileSystem.readAsStringAsync(HIST) : null;
    const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : [];
  } catch { return []; }
}
export async function saveHist(items: any[]) {
  try {
    const clean = items.map(i => (web && i.audio?.startsWith('blob:') ? { ...i, audio: undefined } : i));
    const raw = JSON.stringify(clean);
    if (web) localStorage.setItem('vox.hist', raw); else await FileSystem.writeAsStringAsync(HIST, raw);
  } catch { /* sin espacio o bloqueado: no romper la app */ }
}