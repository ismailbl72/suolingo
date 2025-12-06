export enum ScreenName {
  HOME = 'HOME',
  TTS = 'TTS',
  STT = 'STT',
  HISTORY = 'HISTORY',
}

export interface HistoryItem {
  id: string;
  type: 'TTS' | 'STT';
  text: string;
  timestamp: number;
}

export enum AvatarMode {
  IDLE = 'IDLE',
  SPEAKING = 'SPEAKING',
  LISTENING = 'LISTENING',
}

export interface SpeechConfig {
  lang: string;
  pitch: number;
  rate: number;
}
