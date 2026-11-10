import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { deleteAudio, loadHist, saveHist } from './io';
export type Item = { id: string; title: string; text: string; secs: number; mode: string; at: number; audio?: string; ext?: string };
type Ctx = { text: string; setText: (t: string) => void; lang: string; setLang: (l: string) => void; tab: number; setTab: (n: number) => void; hist: Item[]; addHist: (i: Item) => void; delHist: (id: string) => void };
const X = createContext<Ctx>(null as any);
export const useApp = () => useContext(X);
export const Provider = ({ children }: any) => {
  const [text, setText] = useState(''); const [lang, setLang] = useState('es'); const [tab, setTab] = useState(0); const [hist, setHist] = useState<Item[]>([]);
  const ready = useRef(false);
  useEffect(() => { loadHist().then(h => { setHist(h); ready.current = true; }); }, []);
  useEffect(() => { if (ready.current) saveHist(hist); }, [hist]);
  const delHist = (id: string) => setHist(h => { const x = h.find(i => i.id === id); deleteAudio(x?.audio); return h.filter(i => i.id !== id); });
  return <X.Provider value={{ text, setText, lang, setLang, tab, setTab, hist, addHist: i => setHist(h => [i, ...h]), delHist }}>{children}</X.Provider>;
};
