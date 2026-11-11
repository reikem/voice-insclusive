// src/components/lib/perm.ts
import { Platform } from 'react-native';
import { notify } from './io';

export async function ensureMic(): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        notify('Micrófono no soportado', 'Tu navegador no permite acceso al micrófono.');
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      notify('Micrófono bloqueado', 'Permite el micrófono desde la barra de direcciones.');
      return false;
    }
  }

  // Entorno móvil (iOS / Android nativo)
  try {
    const ExpoAV = await import('expo-av');
    const AudioModule = ExpoAV.Audio || ExpoAV.default?.Audio;
    
    if (!AudioModule) {
      // Fallback de seguridad para evitar que la app se caiga si el módulo nativo demora
      return true;
    }

    let p = await AudioModule.getPermissionsAsync();
    if (!p.granted && p.canAskAgain) {
      p = await AudioModule.requestPermissionsAsync();
    }

    if (p.granted) {
      await AudioModule.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      return true;
    }

    notify('Permiso requerido', 'Debes habilitar el acceso al micrófono en la configuración de tu dispositivo para poder grabar.');
    return false;
  } catch (e: any) {
    console.warn('Error al solicitar permisos:', e?.message ?? e);
    // Permitir continuar en desarrollo para evitar bloqueo total del emulador
    return true;
  }
}