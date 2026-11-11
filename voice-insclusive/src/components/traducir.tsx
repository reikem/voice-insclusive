import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Linking, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { C } from './theme';
import { Btn, Card, H, Chip } from './ui';
import { useApp } from './state';
import { shareText } from './lib/io';
import { LANGS, translate } from './lib/translate';

const Page = ({ children }: any) => (
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
    {children}
  </ScrollView>
);

/* ---------- TRADUCIR ---------- */
const SPEECH: Record<string, string> = { 
  es: 'es-ES', 
  en: 'en-US', 
  fr: 'fr-FR', 
  pt: 'pt-BR', 
  ca: 'ca-ES', 
  it: 'it-IT', 
  de: 'de-DE', 
  ja: 'ja-JP' 
};

export function Traducir() {
  const { text, setText, lang, setLang, setTab } = useApp();
  const [to, setTo] = useState('en');
  const [out, setOut] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [talk, setTalk] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [recent, setRecent] = useState<{ p: string; t: string }[]>([]);

  const src = LANGS.find(l => l.code === lang) ?? LANGS[0];
  const dst = LANGS.find(l => l.code === to) ?? LANGS[1];

  const run = async () => {
    setBusy(true);
    setMsg('');
    try {
      const r = await translate(text, src.ml, dst.ml, () => setMsg('Descargando idioma (solo la primera vez, requiere Wi-Fi)…'));
      const resText = typeof r === 'string' ? r : String(r ?? '');
      setOut(resText);
      setMsg('');
      setRecent(x => [{ p: `${lang.toUpperCase()} → ${to.toUpperCase()}`, t: resText }, ...x].slice(0, 4));
    } catch (e: any) {
      setMsg(Platform.OS === 'web' ? String(e?.message ?? e) : 'Primera vez: conecta a Wi-Fi para descargar el idioma. ' + (e?.message ?? ''));
    } finally {
      setBusy(false);
    }
  };

  const swap = () => {
    const o = out;
    setLang(to);
    setTo(lang);
    if (o) {
      setText(o);
      setOut('');
    }
  };

  const speak = () => {
    if (talk) {
      Speech.stop();
      setTalk(false);
      return;
    }
    setTalk(true);
    Speech.speak(out, {
      language: SPEECH[to],
      rate,
      pitch,
      onDone: () => setTalk(false),
      onStopped: () => setTalk(false),
      onError: () => setTalk(false),
    });
  };

  const open = (nat: string, web: string) => {
    const u = (Platform.OS === 'web' ? web : nat) + encodeURIComponent(out);
    Linking.openURL(u).catch(() => shareText(out));
  };

  useEffect(() => () => { Speech.stop(); }, []);

  return (
    <Page>
      <Card>
        <View style={s.rowB}>
          <View>
            <Text style={s.muted}>Origen</Text>
            <Text style={[s.body, { fontWeight: '700' }]}>{src.name}</Text>
          </View>
          <Btn label="⇄ Intercambiar" kind="soft" onPress={swap} />
          <View>
            <Text style={s.muted}>Destino</Text>
            <Text style={[s.body, { fontWeight: '700' }]}>{dst.name}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LANGS.filter(l => l.code !== lang).map(l => (
            <Chip key={l.code} label={l.name} on={to === l.code} onPress={() => { setTo(l.code); setOut(''); }} />
          ))}
        </ScrollView>
      </Card>

      <Card>
        <Text style={s.muted}>Texto transcrito original</Text>
        <Text style={[s.body, { fontStyle: 'italic' }]}>{text || 'No hay texto. Graba o escribe uno primero.'}</Text>
        <Btn label={busy ? 'Traduciendo…' : 'Traducir en el teléfono'} onPress={run} disabled={!text || busy} />
        {!!msg && <Text style={s.muted}>{msg}</Text>}
      </Card>

      {!!out && (
        <>
          <Card>
            <H>Traducción</H>
            <Text style={[s.body, { fontSize: 22, fontWeight: '600' }]} selectable>{out}</Text>
            <Btn label={talk ? 'Detener voz' : 'Reproducir voz'} onPress={speak} />
            <Text style={s.muted}>Velocidad</Text>
            <View style={{ flexDirection: 'row' }}>
              {[0.8, 1, 1.2, 1.4].map(v => (
                <Chip key={v} label={`${v}x`} on={rate === v} onPress={() => setRate(v)} />
              ))}
            </View>
            <Text style={s.muted}>Tono</Text>
            <View style={{ flexDirection: 'row' }}>
              {[
                ['Grave', 0.7],
                ['Estándar', 1],
                ['Agudo', 1.3],
              ].map(([n, v]) => (
                <Chip key={n as string} label={n as string} on={pitch === v} onPress={() => setPitch(v as number)} />
              ))}
            </View>
            <Text style={s.muted}>
              La voz usa las voces instaladas en tu teléfono; si falta el idioma, instálalo en Ajustes › Texto a voz.
            </Text>
          </Card>

          <Card>
            <Btn label="Copiar traducción" kind="accent" onPress={() => Clipboard.setStringAsync(out)} />
            <View style={s.row}>
              <Btn label="WhatsApp" kind="soft" onPress={() => open('whatsapp://send?text=', 'https://wa.me/?text=')} style={{ flex: 1 }} />
              <Btn label="Telegram" kind="soft" onPress={() => open('tg://msg?text=', 'https://t.me/share/url?url=%20&text=')} style={{ flex: 1 }} />
              <Btn label="Más" kind="soft" onPress={() => shareText(out)} style={{ flex: 1 }} />
            </View>
            
            <Text style={s.muted}>Enviar resultado a otras secciones</Text>
            <View style={s.row}>
              <Btn 
                label="Abrir en Editor" 
                kind="soft" 
                style={{ flex: 1 }}
                onPress={() => { 
                  setText(out); 
                  setTab(1); // Índice 1: Editor
                }} 
              />
              <Btn 
                label="Ir a Inclusión" 
                kind="soft" 
                style={{ flex: 1 }}
                onPress={() => { 
                  setText(out); 
                  setLang(to); 
                  setTab(2); // Índice 2: Inclusión
                }} 
              />
            </View>

            <Text style={s.muted}>Pasarelas de inclusión</Text>
            <Btn label="Ver en lengua de señas (deletreo)" kind="soft" onPress={() => { setText(out); setLang(to); setTab(2); }} />
            <Btn label="Ver en braille" kind="soft" onPress={() => { setText(out); setLang(to); setTab(2); }} />
          </Card>
        </>
      )}

      {recent.length > 0 && (
        <Card>
          <H>Traducciones recientes</H>
          {recent.map((r, k) => (
            <Text key={k} style={s.body} numberOfLines={1}>
              {r.p} · {r.t}
            </Text>
          ))}
        </Card>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  rowB: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { color: C.muted, fontSize: 14 },
  body: { color: C.text, fontSize: 18, lineHeight: 28 },
  row: { flexDirection: 'row', gap: 8 },
});