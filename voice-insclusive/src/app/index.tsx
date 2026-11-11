// src/app/index.tsx
import { Buffer } from 'buffer';
(globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;

import App from './App';

export default function Index() {
  return <App />;
}