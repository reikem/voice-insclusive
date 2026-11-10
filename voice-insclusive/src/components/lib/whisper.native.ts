import { initWhisper, WhisperContext } from 'whisper.rn';
import { ensureAudioDir, AUDIO_DIR } from './io';

const MODEL = require('../../assets/ggml-tiny.bin');
let ctx: WhisperContext | null = null;
export async function loadModel() { if (!ctx) ctx = await initWhisper({ filePath: MODEL }); return ctx; }

// Transcripción en vivo en el dispositivo + audio WAV 16 kHz guardado dentro de la app.
export async function startLive(lang: string, onText: (t: string) => void) {
  const c = await loadModel(); await ensureAudioDir();
  const uri = `${AUDIO_DIR}rec-${Date.now()}.wav`;
  let done = () => {}; const finished = new Promise<void>(r => (done = r));
  const { stop, subscribe } = await c.transcribeRealtime({ language: lang, realtimeAudioSec: 900, realtimeAudioSliceSec: 25, audioOutputPath: uri.replace('file://', '') });
  subscribe(e => { if (e.data?.result) onText(e.data.result.trim()); if (!e.isCapturing) done(); });
  return async () => { await stop(); await Promise.race([finished, new Promise(r => setTimeout(r, 4000))]); return { uri, ext: 'wav' }; };
}
export async function transcribeFile(uri: string, lang: string) {
  const c = await loadModel();
  const { promise } = c.transcribe(uri, { language: lang });
  return (await promise).result.trim();
}
