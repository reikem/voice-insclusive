import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View, StyleSheet, Vibration, ActivityIndicator, Linking, Pressable, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { C } from './theme';
import { Btn, Card, H, Chip } from './ui';
import { useApp, Item } from './state';
import { startLive, transcribeFile } from './lib/whisper';
import { ensureMic } from './lib/perm';
import { notify, confirmAsk, shareText, saveFile, saveTextFile, mimeOf } from './lib/io';
import { toBraille, dotsOf } from './lib/braille';
import { toFingerspelling } from './lib/signs';
import { LANGS, translate } from './lib/translate';

const Page = ({ children }: any) => <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' }}>{children}</ScrollView>;
const mmss = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

/* ---------- GRABAR ---------- */
const MODES = ['Reunión', 'Conversación', 'Nota personal', 'Conferencia'];
const MAX_MB = 150;
export function Grabar() {
  const { text, setText, lang, hist, addHist, delHist, setTab } = useApp();
  const [mode, setMode] = useState(0), [rec, setRec] = useState(false), [busy, setBusy] = useState(false), [secs, setSecs] = useState(0), [marks, setMarks] = useState<number[]>([]), [bars, setBars] = useState([6, 10, 14, 20, 24, 18, 12, 8]);
  const stopRef = useRef<null | (() => Promise<{ uri: string; ext: string }>)>(null), live = useRef('');
  useEffect(() => { if (!rec) return; const t = setInterval(() => { setSecs(x => x + 1); setBars(b => b.map(() => 4 + Math.floor(Math.random() * 20))); }, 1000); return () => clearInterval(t); }, [rec]);
  useEffect(() => { if (secs >= 900 && rec) finish(); }, [secs]);
  useEffect(() => () => { stopRef.current?.().catch(() => { }); }, []); // libera el micrófono al salir

  const start = async () => {
    if (!(await ensureMic())) return;
    setBusy(true);
    try { live.current = ''; setText(''); setSecs(0); setMarks([]); stopRef.current = await startLive(lang, t => { live.current = t; setText(t); }); setRec(true); }
    catch (e: any) { notify('No se pudo grabar', String(e?.message ?? e)); } finally { setBusy(false); }
  };
  const finish = async () => {
    const stop = stopRef.current; if (!stop) return; stopRef.current = null; setBusy(true);
    try {
      const a = await stop(); setRec(false); const t = live.current.trim();
      if (t || a?.uri) addHist({ id: String(Date.now()), title: t ? t.split(/\s+/).slice(0, 6).join(' ') : 'Grabación', text: t, secs, mode: MODES[mode], at: Date.now(), audio: a?.uri, ext: a?.ext });
    } catch (e: any) { setRec(false); notify('Error al detener', String(e?.message ?? e)); } finally { setBusy(false); }
  };
  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (r.canceled) return; const f = r.assets[0];
    if (f.size && f.size > MAX_MB * 1024 * 1024) return notify('Archivo muy grande', `El máximo es ${MAX_MB} MB.`);
    setBusy(true);
    try { const t = await transcribeFile(f.uri, lang); setText(t); addHist({ id: String(Date.now()), title: f.name.slice(0, 60), text: t, secs: 0, mode: 'Archivo', at: Date.now() }); }
    catch (e: any) { notify('No se pudo transcribir', 'Usa WAV 16 kHz mono (en web se aceptan más formatos). ' + (e?.message ?? '')); } finally { setBusy(false); }
  };
  const saveAudio = async (i: Item) => {
    try { const m = await saveFile(i.audio!, `vox-${i.id}.${i.ext || 'wav'}`, mimeOf(i.ext)); if (m) notify('Listo', m); }
    catch (e: any) { notify('No se pudo guardar el audio', String(e?.message ?? e)); }
  };
  const del = async (i: Item) => { if (await confirmAsk('Eliminar grabación', 'Se borrarán el audio y el texto de este dispositivo.')) delHist(i.id); };
  const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'Ahora' : m < 60 ? `Hace ${m} min` : m < 1440 ? `Hace ${Math.round(m / 60)} h` : `Hace ${Math.round(m / 1440)} d`; };
  return (
    <Page>
      <View style={s.rowB}><Text style={s.muted}>Modo de registro</Text><Text style={s.badge}>Español · en el dispositivo</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>{MODES.map((m, k) => <Chip key={m} label={m} on={mode === k} onPress={() => setMode(k)} />)}</ScrollView>
      <Card style={{ alignItems: 'center' }}>
        <View style={s.wave} accessibilityElementsHidden>{bars.map((h, k) => <View key={k} style={{ width: 8, height: rec ? h : 12, borderRadius: 4, backgroundColor: k === 4 ? C.primary : C.primaryC, opacity: rec ? 1 : 0.3 }} />)}</View>
        <Text style={s.timer} accessibilityLiveRegion="polite">{mmss(secs)}<Text style={s.muted}> / 15:00 máx</Text></Text>
        <Text style={s.muted}>{!rec ? 'Listo para transcribir' : Platform.OS === 'web' ? 'Grabando · se transcribe al detener' : 'Grabando · transcripción en el teléfono'}</Text>
        <Btn label={`Agregar marcador (${marks.length})`} kind="soft" disabled={!rec} onPress={() => { setMarks(m => [...m, secs]); Vibration.vibrate(30); }} style={{ alignSelf: 'stretch' }} />
        <Btn label={rec ? 'Detener y guardar' : busy ? 'Procesando…' : 'Iniciar grabación'} kind={rec ? 'accent' : 'primary'} onPress={rec ? finish : start} disabled={busy} style={{ alignSelf: 'stretch' }} />
        {busy && <ActivityIndicator color={C.primary} />}
      </Card>
      <Card><H>Transcripción</H><Text style={s.body} selectable>{text || 'El texto aparecerá aquí.'}</Text>{marks.length > 0 && <Text style={s.muted}>Marcadores: {marks.map(mmss).join(' · ')}</Text>}</Card>
      <Card><H>Subir archivo</H><Text style={s.muted}>Máximo {MAX_MB} MB. Se procesa sin conexión en el dispositivo.</Text><Btn label="Elegir archivo de audio" kind="soft" onPress={pick} disabled={busy} /></Card>
      <View style={s.rowB}><H>Historial reciente</H><Text style={s.badge}>{hist.length}</Text></View>
      <Text style={s.muted}>Los audios se guardan dentro de la app. Usa “Guardar audio” para copiarlos a tu {Platform.OS === 'web' ? 'computadora' : 'almacenamiento'}.</Text>
      {hist.length === 0 && <Text style={s.muted}>Aún no hay grabaciones.</Text>}
      {hist.map(i => (
        <Card key={i.id}>
          <Text style={[s.body, { fontWeight: '600' }]} numberOfLines={1}>{i.title}</Text>
          <Text style={s.muted}>{ago(i.at)} · {mmss(i.secs)} · {i.mode}{i.audio ? ' · con audio' : ''}</Text>
          <View style={s.row}><Btn label="Abrir en editor" kind="soft" onPress={() => { setText(i.text); setTab(1); }} style={{ flex: 1 }} /><Btn label="Compartir texto" kind="soft" disabled={!i.text} onPress={() => shareText(i.text)} style={{ flex: 1 }} /></View>
          <View style={s.row}>{!!i.audio && <Btn label="Guardar audio" kind="accent" onPress={() => saveAudio(i)} style={{ flex: 1 }} />}<Btn label="Eliminar" kind="soft" onPress={() => del(i)} style={{ flex: 1 }} /></View>
        </Card>))}
    </Page>
  );
}

/* ---------- EDITOR ---------- */
export function Editor() {
  const { text, setText } = useApp();
  const [ok, setOk] = useState('');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const punctuate = () => setText(text.replace(/\s+/g, ' ').trim().replace(/(^\w|[.!?]\s+\w)/g, m => m.toUpperCase()).replace(/([^.!?])$/, '$1.'));
  const copy = async () => { await Clipboard.setStringAsync(text); setOk('Copiado'); setTimeout(() => setOk(''), 2000); };
  return (
    <Page>
      <Card>
        <H>Reunión Estratégica</H><Text style={s.muted}>{words} palabras</Text>
        <TextInput accessibilityLabel="Transcripción editable" multiline value={text} onChangeText={setText} placeholder="Graba o escribe aquí" style={s.input} textAlignVertical="top" />
        <View style={s.row}><Btn label="Copiar todo" onPress={copy} style={{ flex: 1 }} /><Btn label="Puntuar" kind="soft" onPress={punctuate} style={{ flex: 1 }} /></View>
        <Btn label="Compartir" kind="accent" onPress={() => shareText(text)} />
        <Btn label="Guardar como .txt" kind="soft" disabled={!text} onPress={async () => { try { const m = await saveTextFile('transcripcion.txt', text); if (m) notify('Listo', m); } catch (e: any) { notify('No se pudo guardar', String(e?.message ?? e)); } }} />
        <Text accessibilityLiveRegion="polite" style={{ color: C.tertiary, fontWeight: '700' }}>{ok}</Text>
      </Card>
    </Page>
  );
}

/* ---------- INCLUSIÓN ---------- */
export function Inclusion() {
  const { text } = useApp();
  const [tab, setTab] = useState<'sg' | 'br'>('sg'), [i, setI] = useState(0), [play, setPlay] = useState(false), [speed, setSpeed] = useState(1), [dact, setDact] = useState(true), [toast, setToast] = useState('');
  const braille = toBraille(text), words = text.trim().split(/\s+/).filter(Boolean), letters = toFingerspelling(text);
  const units = dact ? letters.map(x => x.token) : words;
  useEffect(() => { setI(0); setPlay(false); }, [dact, text]);
  useEffect(() => { if (!play) return; const t = setInterval(() => setI(x => { if (x + 1 >= units.length) { setPlay(false); return 0; } return x + 1; }), (dact ? 800 : 1200) / speed); return () => clearInterval(t); }, [play, speed, units.length, dact]);
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };
  const feel = (cells: string) => { const p: number[] = [0]; for (const c of cells) { if (c === ' ' || c === '\n') { p.push(0, 300); continue; } for (let k = 0; k < dotsOf(c).length; k++) p.push(60, 70); p.push(0, 250); } Vibration.vibrate(p.slice(0, 400)); };
  const cells = [...braille].filter(c => c !== '\n').slice(0, 8);
  return (
    <Page>
      <View style={{ flexDirection: 'row' }}><Chip label="Lengua de señas" on={tab === 'sg'} onPress={() => setTab('sg')} /><Chip label="Braille digital" on={tab === 'br'} onPress={() => setTab('br')} /></View>
      {!text ? <Card><Text style={s.body}>Primero graba o escribe un texto en Grabar o Editor.</Text></Card> : tab === 'sg' ? (
        <Card style={{ backgroundColor: C.dark }}>
          <Text style={{ color: C.secondaryFixed, fontWeight: '700' }}>{dact ? 'Deletreo manual (dactilología)' : 'Palabra por palabra'} · en el teléfono</Text>
          <View style={s.sign}><Text style={s.signL} accessibilityLiveRegion="polite">{units[i] ?? ''}</Text></View>
          <Text style={{ color: C.onDark, fontSize: 18, lineHeight: 28 }}>{words.map((w, k) => <Text key={k} style={!dact && k === i ? { backgroundColor: C.primaryC, color: C.primaryFixed, fontWeight: '700' } : undefined}>{w} </Text>)}</Text>
          <Text style={{ color: C.outline }}>{dact ? `Letra ${Math.min(i + 1, units.length)} de ${units.length}` : `Palabra ${Math.min(i + 1, units.length)} de ${units.length}`}</Text>
          <View style={s.row}><Btn label={play ? 'Pausar' : 'Reproducir'} onPress={() => setPlay(p => !p)} style={{ flex: 1 }} /><Btn label="Reiniciar" kind="soft" onPress={() => { setI(0); setPlay(false); }} style={{ flex: 1 }} /></View>
          <View style={{ flexDirection: 'row' }}>{[0.5, 0.75, 1].map(v => <Chip key={v} label={`${v}x`} on={speed === v} onPress={() => setSpeed(v)} />)}</View>
          <Btn label={dact ? 'Cambiar a palabras' : 'Cambiar a deletreo'} kind="accent" onPress={() => setDact(d => !d)} />
        </Card>
      ) : (
        <>
          <Card>
            <H>Matriz braille · 6 puntos · Grado 1</H>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: 'row', gap: 8 }}>{cells.map((c, k) => {
              const d = dotsOf(c); return (
                <Pressable key={k} accessibilityLabel={`Celda braille ${k + 1}, ${d.length} puntos`} onPress={() => { Vibration.vibrate(d.length * 40); say(`Celda ${k + 1}: puntos ${d.join(', ') || 'ninguno'}`); }} style={s.cell}>
                  {[[1, 4], [2, 5], [3, 6]].map((r, y) => <View key={y} style={{ flexDirection: 'row', gap: 6 }}>{r.map(n => <View key={n} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d.includes(n) ? C.primary : '#c7c4d766' }} />)}</View>)}
                  <Text style={{ fontSize: 22, color: C.primary }}>{c}</Text></Pressable>);
            })}</View></ScrollView>
            <Text accessibilityLabel="Texto en braille" selectable style={s.braille}>{braille}</Text>
            <View style={s.row}><Btn label="Copiar" kind="soft" onPress={async () => { await Clipboard.setStringAsync(braille); say('Braille copiado'); }} style={{ flex: 1 }} /><Btn label="Compartir" kind="soft" onPress={() => shareText(braille)} style={{ flex: 1 }} /></View>
            <Btn label="Exploración háptica (vibración)" onPress={() => feel(braille)} />
          </Card>
          <Card><Text style={s.muted}>Línea braille Bluetooth: conéctala en los ajustes de accesibilidad del sistema y activa TalkBack o VoiceOver; esta pantalla le envía el texto.</Text></Card>
        </>)}
      {!!toast && <Text accessibilityLiveRegion="polite" style={s.toast}>{toast}</Text>}
    </Page>
  );
}

/* ---------- TRADUCIR ---------- */
const SPEECH: Record<string, string> = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', pt: 'pt-BR', ca: 'ca-ES', it: 'it-IT', de: 'de-DE', ja: 'ja-JP' };
export function Traducir() {
  const { text, setText, lang, setLang, setTab } = useApp();
  const [to, setTo] = useState('en'), [out, setOut] = useState(''), [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [talk, setTalk] = useState(false), [rate, setRate] = useState(1), [pitch, setPitch] = useState(1), [recent, setRecent] = useState<{ p: string; t: string }[]>([]);
  const src = LANGS.find(l => l.code === lang) ?? LANGS[0], dst = LANGS.find(l => l.code === to) ?? LANGS[1];
  const run = async () => {
    setBusy(true); setMsg('');
    try { 
      const r = await translate(text, src.ml, dst.ml, () => setMsg('Descargando idioma (solo la primera vez, requiere Wi-Fi)…')); 
      const resText = typeof r === 'string' ? r : String(r ?? '');
      setOut(resText); 
      setMsg(''); 
      setRecent(x => [{ p: `${lang.toUpperCase()} → ${to.toUpperCase()}`, t: resText }, ...x].slice(0, 4)); 
    }
    catch (e: any) { setMsg(Platform.OS === 'web' ? String(e?.message ?? e) : 'Primera vez: conecta a Wi-Fi para descargar el idioma. ' + (e?.message ?? '')); } finally { setBusy(false); }
  };
  const swap = () => { const o = out; setLang(to); setTo(lang); if (o) { setText(o); setOut(''); } };
  const speak = () => { if (talk) { Speech.stop(); setTalk(false); return; } setTalk(true); Speech.speak(out, { language: SPEECH[to], rate, pitch, onDone: () => setTalk(false), onStopped: () => setTalk(false), onError: () => setTalk(false) }); };
  const open = (nat: string, web: string) => { const u = (Platform.OS === 'web' ? web : nat) + encodeURIComponent(out); Linking.openURL(u).catch(() => shareText(out)); };
  useEffect(() => () => { Speech.stop(); }, []);
  return (
    <Page>
      <Card>
        <View style={s.rowB}><View><Text style={s.muted}>Origen</Text><Text style={[s.body, { fontWeight: '700' }]}>{src.name}</Text></View><Btn label="⇄ Intercambiar" kind="soft" onPress={swap} /><View><Text style={s.muted}>Destino</Text><Text style={[s.body, { fontWeight: '700' }]}>{dst.name}</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{LANGS.filter(l => l.code !== lang).map(l => <Chip key={l.code} label={l.name} on={to === l.code} onPress={() => { setTo(l.code); setOut(''); }} />)}</ScrollView>
      </Card>
      <Card><Text style={s.muted}>Texto transcrito original</Text><Text style={[s.body, { fontStyle: 'italic' }]}>{text || 'No hay texto. Graba o escribe uno primero.'}</Text>
        <Btn label={busy ? 'Traduciendo…' : 'Traducir en el teléfono'} onPress={run} disabled={!text || busy} />{!!msg && <Text style={s.muted}>{msg}</Text>}</Card>
      {!!out && <>
        <Card><H>Traducción</H><Text style={[s.body, { fontSize: 22, fontWeight: '600' }]} selectable>{out}</Text>
          <Btn label={talk ? 'Detener voz' : 'Reproducir voz'} onPress={speak} />
          <Text style={s.muted}>Velocidad</Text><View style={{ flexDirection: 'row' }}>{[0.8, 1, 1.2, 1.4].map(v => <Chip key={v} label={`${v}x`} on={rate === v} onPress={() => setRate(v)} />)}</View>
          <Text style={s.muted}>Tono</Text><View style={{ flexDirection: 'row' }}>{[['Grave', 0.7], ['Estándar', 1], ['Agudo', 1.3]].map(([n, v]) => <Chip key={n as string} label={n as string} on={pitch === v} onPress={() => setPitch(v as number)} />)}</View>
          <Text style={s.muted}>La voz usa las voces instaladas en tu teléfono; si falta el idioma, instálalo en Ajustes › Texto a voz.</Text>
        </Card>
        <Card>
          <Btn label="Copiar traducción" kind="accent" onPress={() => Clipboard.setStringAsync(out)} />
          <View style={s.row}><Btn label="WhatsApp" kind="soft" onPress={() => open('whatsapp://send?text=', 'https://wa.me/?text=')} style={{ flex: 1 }} /><Btn label="Telegram" kind="soft" onPress={() => open('tg://msg?text=', 'https://t.me/share/url?url=%20&text=')} style={{ flex: 1 }} /><Btn label="Más" kind="soft" onPress={() => shareText(out)} style={{ flex: 1 }} /></View>
          <Text style={s.muted}>Pasarelas de inclusión</Text>
          <Btn label="Ver en lengua de señas (deletreo)" kind="soft" onPress={() => { setText(out); setLang(to); setTab(2); }} />
          <Btn label="Ver en braille" kind="soft" onPress={() => { setText(out); setLang(to); setTab(2); }} />
        </Card></>}
      {recent.length > 0 && <Card><H>Traducciones recientes</H>{recent.map((r, k) => <Text key={k} style={s.body} numberOfLines={1}>{r.p} · {r.t}</Text>)}</Card>}
    </Page>
  );
}

const s = StyleSheet.create({
  rowB: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, badge: { backgroundColor: C.high, color: C.tertiary, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' },
  wave: { height: 84, flexDirection: 'row', alignItems: 'center', gap: 6 }, cell: { backgroundColor: C.low, borderRadius: 10, padding: 10, alignItems: 'center', gap: 4, minWidth: 52 },
  toast: { backgroundColor: C.dark, color: C.onDark, padding: 12, borderRadius: 10, overflow: 'hidden' },
  timer: { fontSize: 44, fontWeight: '700', color: C.text }, muted: { color: C.muted, fontSize: 14 }, body: { color: C.text, fontSize: 18, lineHeight: 28 },
  row: { flexDirection: 'row', gap: 8 }, input: { minHeight: 220, backgroundColor: C.low, borderRadius: 10, padding: 12, fontSize: 18, lineHeight: 28, color: C.text },
  braille: { fontSize: 28, lineHeight: 42, letterSpacing: 4, color: C.primary }, sign: { height: 160, borderRadius: 12, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' }, signL: { fontSize: 88, fontWeight: '700', color: C.secondaryFixed },
});