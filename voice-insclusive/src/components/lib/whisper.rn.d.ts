declare module 'whisper.rn' {
    export interface WhisperContext {
      transcribeRealtime(options: {
        language: string;
        realtimeAudioSec?: number;
        realtimeAudioSliceSec?: number;
        audioOutputPath?: string;
      }): Promise<{
        stop: () => Promise<void>;
        subscribe: (callback: (e: { data?: { result?: string }; isCapturing: boolean }) => void) => void;
      }>;
      transcribe(uri: string, options: { language: string }): {
        promise: Promise<{ result: string }>;
      };
    }
  
    export function initWhisper(options: { filePath: any }): Promise<WhisperContext>;
  }