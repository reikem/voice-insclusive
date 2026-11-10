// Web: graba con MediaRecorder y transcribe con Whisper-tiny (WASM) en el navegador.
// El modelo y la librería se descargan UNA vez (requiere internet) y luego el navegador los guarda en caché.
const NAMES: Record<string, string> = { es: 'spanish', en: 'english', fr: 'french', pt: 'portuguese', ca: 'catalan', it: 'italian', de: 'german', ja: 'japanese' };
const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2'; // versión fija
let asr: any;
async function model() {
  if (!asr) {
    const load = new Function('u', 'return import(u)') as (u: string) => Promise<any>; // evita que Metro intente empaquetarla
    const { pipeline } = await load(CDN);
    asr = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', { device: 'wasm' });
  }
  return asr;
}
export const loadModel = model;
async function pcm(buf: ArrayBuffer) {
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext; const ac = new AC({ sampleRate: 16000 });
  try { return (await ac.decodeAudioData(buf)).getChannelData(0); } finally { ac.close(); }
}
async function run(buf: ArrayBuffer, lang: string) {
  const a = await model();
  const out = await a(await pcm(buf), { language: NAMES[lang] ?? 'spanish', task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 });
  return String(out?.text ?? '').trim();
}
export async function startLive(lang: string, onText: (t: string) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(m => (window as any).MediaRecorder?.isTypeSupported(m)) || '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); const chunks: Blob[] = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  rec.start(1000);
  return async () => {
    await new Promise<void>(r => { rec.onstop = () => r(); rec.stop(); });
    stream.getTracks().forEach(t => t.stop()); // libera el micrófono
    const type = rec.mimeType || 'audio/webm'; const blob = new Blob(chunks, { type });
    try { onText(await run(await blob.arrayBuffer(), lang)); } catch { onText(''); }
    return { uri: URL.createObjectURL(blob), ext: type.includes('mp4') ? 'mp4' : 'webm' };
  };
}
export async function transcribeFile(uri: string, lang: string) { return run(await (await fetch(uri)).arrayBuffer(), lang); }
