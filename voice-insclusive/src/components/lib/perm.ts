import { Audio } from 'expo-av';
import { Linking, Platform } from 'react-native';
import { notify } from './io';

// Pide el permiso de micrófono en Android, iOS y web. Devuelve true si se puede grabar.
export async function ensureMic(): Promise<boolean> {
  try {
    let p = await Audio.getPermissionsAsync();
    if (!p.granted && p.canAskAgain) p = await Audio.requestPermissionsAsync();
    if (p.granted) return true;
    if (Platform.OS === 'web') notify('Micrófono bloqueado', 'Permite el micrófono desde el candado de la barra de direcciones y recarga. La página debe abrirse con https o localhost.');
    else { notify('Micrófono bloqueado', 'Activa el permiso del micrófono en Ajustes para grabar.'); if (!p.canAskAgain) Linking.openSettings(); }
  } catch (e: any) { notify('No se pudo pedir el permiso', String(e?.message ?? e)); }
  return false;
}
