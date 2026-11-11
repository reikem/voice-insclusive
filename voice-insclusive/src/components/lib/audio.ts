import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export class SafeAudioPlayer {
  private sound: any = null;
  private webAudio: HTMLAudioElement | null = null;

  async play(uri: string, onFinish?: () => void) {
    this.stop();

    if (Platform.OS === 'web') {
      try {
        this.webAudio = new window.Audio(uri);
        this.webAudio.onended = () => {
          onFinish?.();
        };
        await this.webAudio.play();
      } catch (e) {
        console.error('Error reproduciendo en web:', e);
      }
      return;
    }

    // Entorno móvil (iOS / Android)
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      this.sound = newSound;
      
      this.sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          onFinish?.();
        }
      });
    } catch (e) {
      console.error('Error reproduciendo en nativo:', e);
    }
  }

  async stop() {
    if (Platform.OS === 'web') {
      if (this.webAudio) {
        this.webAudio.pause();
        this.webAudio = null;
      }
      return;
    }

    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch {}
      this.sound = null;
    }
  }
}