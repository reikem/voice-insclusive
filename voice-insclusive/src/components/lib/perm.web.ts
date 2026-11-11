// src/components/lib/perm.web.ts
import { notify } from './io';

export async function ensureMic(): Promise<boolean> {
  try {
    if (!navigator?.mediaDevices?.getUserMedia) {
      notify('Micrófono no soportado', 'Tu navegador no permite acceso al micrófono.');
      return false;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Liberamos el stream de prueba inmediatamente
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (e: any) {
    notify('Micrófono bloqueado', 'Permite el micrófono desde el candado de la barra de direcciones y recarga.');
    return false;
  }
}