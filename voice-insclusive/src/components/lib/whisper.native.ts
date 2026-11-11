import { initWhisper, WhisperContext } from 'whisper.rn';
import { ensureAudioDir, AUDIO_DIR } from './io';

let MODEL: any;
try {
  // Sube 3 niveles desde src/components/lib/ hasta la raíz del proyecto
  MODEL = require('../../../ggml-base.bin');
  console.log('[WHISPER DEBUG] Modelo binario cargado correctamente.');
} catch (error) {
  console.error('[WHISPER ERROR] No se pudo encontrar el archivo ggml-base.bin en la raíz:', error);
}

let ctx: WhisperContext | null = null;

export async function loadModel() {
  if (!ctx) {
    try {
      ctx = await initWhisper({ filePath: MODEL });
      console.log('[WHISPER DEBUG] Contexto de Whisper inicializado con éxito.');
    } catch (err) {
      console.error('[WHISPER ERROR] Falló al ejecutar initWhisper:', err);
      throw err;
    }
  }
  return ctx;
}

export async function startLive(lang: string, onText: (t: string) => void) {
  const c = await loadModel();
  await ensureAudioDir();
  const uri = `${AUDIO_DIR}rec-${Date.now()}.wav`;
  let done = () => {};
  const finished = new Promise<void>(r => (done = r));
  
  const { stop, subscribe } = await c.transcribeRealtime({ 
    language: lang, 
    realtimeAudioSec: 900, 
    realtimeAudioSliceSec: 25, 
    audioOutputPath: uri.replace('file://', '') 
  });
  
  subscribe(e => { 
    if (e.data?.result) onText(e.data.result.trim()); 
    if (!e.isCapturing) done(); 
  });
  
  return async () => { 
    await stop(); 
    await Promise.race([finished, new Promise(r => setTimeout(r, 4000))]); 
    return { uri, ext: 'wav' }; 
  };
}

export async function transcribeFile(uri: string, lang: string) {
  const c = await loadModel();
  const { promise } = c.transcribe(uri, { language: lang });
  return (await promise).result.trim();
}