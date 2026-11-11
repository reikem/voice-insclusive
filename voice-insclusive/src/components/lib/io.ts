import { Platform, Alert, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

const web = Platform.OS === 'web';

const getDocDir = () => {
  try {
    return FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
  } catch (e: any) {
    console.warn('Advertencia al obtener el directorio:', e?.message ?? e);
    return '';
  }
};

export const AUDIO_DIR = `${getDocDir()}audios/`;
const HIST = `${getDocDir()}history.json`;

const MIME: Record<string, string> = { wav: 'audio/wav', webm: 'audio/webm', mp4: 'audio/mp4', txt: 'text/plain' };
export const mimeOf = (ext?: string) => MIME[ext ?? 'wav'] ?? 'application/octet-stream';

export const notify = (t: string, m = '') => (web ? window.alert(m ? `${t}\n${m}` : t) : Alert.alert(t, m));

export const confirmAsk = (t: string, m: string): Promise<boolean> =>
  web ? Promise.resolve(window.confirm(`${t}\n${m}`))
      : new Promise(r => Alert.alert(t, m, [{ text: 'Cancelar', style: 'cancel', onPress: () => r(false) }, { text: 'Eliminar', style: 'destructive', onPress: () => r(true) }]));

export async function shareText(message: string) {
  if (web) {
    const nav: any = navigator;
    if (nav.share) { 
      try { 
        await nav.share({ text: message }); 
        return; 
      } catch (e: any) { 
        console.warn('Compartir cancelado o no disponible:', e?.message ?? e);
      } 
    }
    await Clipboard.setStringAsync(message); 
    notify('Copiado', 'Tu navegador no permite compartir; el texto se copió al portapapeles.');
  } else {
    try {
      await Share.share({ message });
    } catch (e: any) {
      console.warn('Error al compartir texto:', e?.message ?? e);
    }
  }
}

export async function ensureAudioDir() {
  if (web) return;
  try {
    const info = await FileSystem.getInfoAsync(AUDIO_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
    }
  } catch (e: any) {
    console.warn('Error al crear el directorio de audios:', e?.message ?? e);
  }
}

export async function saveFile(uri: string, name: string, mime: string): Promise<string | null> {
  if (web) { 
    const a = document.createElement('a'); 
    a.href = uri; 
    a.download = name; 
    document.body.appendChild(a); 
    a.click(); 
    a.remove(); 
    return 'Descarga iniciada en tu carpeta de descargas.'; 
  }

  try {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Compartir archivos no está disponible en este dispositivo.');
    }
    await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Guardar archivo' });
    return null;
  } catch (e: any) {
    throw new Error('No se pudo guardar el archivo: ' + (e?.message ?? e));
  }
}

export async function saveTextFile(name: string, text: string) {
  if (web) { 
    const u = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); 
    try { 
      return await saveFile(u, name, 'text/plain'); 
    } finally { 
      setTimeout(() => URL.revokeObjectURL(u), 5000); 
    } 
  }
  
  const cacheDir = FileSystem.cacheDirectory ?? '';
  const tmp = `${cacheDir}${name}`;
  try {
    await FileSystem.writeAsStringAsync(tmp, text);
    return await saveFile(tmp, name, 'text/plain'); 
  } catch (e: any) {
    console.warn('Error al guardar el archivo de texto:', e?.message ?? e);
    notify('Error', 'No se pudo guardar el archivo en el dispositivo.');
    return null;
  } finally { 
    FileSystem.deleteAsync(tmp, { idempotent: true }).catch((e: any) => {
      console.warn('No se pudo limpiar el archivo temporal:', e?.message ?? e);
    }); 
  }
}

export async function deleteAudio(uri?: string) {
  if (!uri) return;
  try { 
    if (web) {
      URL.revokeObjectURL(uri);
    } else {
      await FileSystem.deleteAsync(uri, { idempotent: true }); 
    }
  } catch (e: any) { 
    console.warn('El archivo de audio ya no existe o no se pudo eliminar:', e?.message ?? e);
  }
}

export async function loadHist(): Promise<any[]> {
  try {
    if (web) {
      const raw = localStorage.getItem('vox.hist');
      const a = raw ? JSON.parse(raw) : []; 
      return Array.isArray(a) ? a : [];
    }
    
    const info = await FileSystem.getInfoAsync(HIST);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(HIST);
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch (e: any) { 
    console.warn('No se pudo cargar el historial previo:', e?.message ?? e);
    return []; 
  }
}

export async function saveHist(items: any[]) {
  try {
    const clean = items.map(i => (web && i.audio?.startsWith('blob:') ? { ...i, audio: undefined } : i));
    const raw = JSON.stringify(clean);
    
    if (web) {
      localStorage.setItem('vox.hist', raw);
    } else {
      await ensureAudioDir();
      await FileSystem.writeAsStringAsync(HIST, raw);
    }
  } catch (e: any) { 
    console.warn('Error al guardar el historial:', e?.message ?? e);
    notify('Almacenamiento lleno o bloqueado', 'No se pudo actualizar el historial en este dispositivo.');
  }
}