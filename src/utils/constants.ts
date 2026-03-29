import { ThemeColors } from '../types';

export const APP_NAME = 'MusicScan AI';
export const APP_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  TRACKS: 'music_tracks',
  PLAYLISTS: 'music_playlists',
  SETTINGS: 'app_settings',
  HISTORY: 'playback_history',
  FAVORITES: 'favorites',
  SCAN_STATE: 'scan_state',
  AI_STATE: 'ai_state',
} as const;

export const DEFAULT_SETTINGS = {
  geminiApiKey: '',
  crossfadeDuration: 3,
  sleepTimerMinutes: null,
  offlineMode: false,
  hapticFeedback: true,
  autoAnalyzeOnScan: true,
};

export const DEFAULT_THEME: ThemeColors = {
  background: '#0A0A0F',
  surface: '#151520',
  primary: '#6366F1',
  secondary: '#8B5CF6',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#27273A',
  accent: '#6366F1',
};

export const SLEEP_TIMER_OPTIONS = [15, 30, 60, null] as const;

export const WAVEFORM_SAMPLES = 100;
export const CROSSFADE_DURATION = 3;
export const PRELOAD_AHEAD_COUNT = 20;
export const AI_BATCH_SIZE = 50;

export const TRACK_PLAYER_CONFIG = {
  maxCacheSize: 1024 * 1024 * 100,
  autoHandleInterruptions: true,
  waitForBuffer: true,
};

export const ANIMATION_CONFIG = {
  springConfig: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  timingConfig: {
    duration: 300,
  },
};

export const AI_PROMPTS = {
  moodAnalysis: `Analyze the mood of this track based on its audio features. Categories: energetic, chill, melancholic, euphoric, aggressive, romantic. Return only the mood category.`,
  genreClassification: `Classify this track into one of these genres: pop, rock, hip-hop, electronic, classical, jazz, r&b, country, metal, indie, folk, blues, reggae, latin, ambient. Return only the genre.`,
  duplicateCheck: `Find potential duplicates based on title similarity, artist name, and duration (within 5 seconds). Return JSON array of duplicate pairs.`,
  smartPlaylist: `Generate a smart playlist based on the following natural language description. Return a JSON object with name and rules.`,
  trackInsight: `Provide a 3-sentence analysis of this track covering its mood, energy, and what makes it unique.`,
};

export const BUNDLE_ID = 'com.musicscanai.app';
export const SERVICE_NAME = 'MusicScanAIService';

export const PERMISSIONS = {
  mediaLibrary: 'expo-media-library',
  notifications: 'expo-notifications',
} as const;

export const IMAGE_FALLBACK = 'https://via.placeholder.com/300x300/151520/6366F1?text=No+Art';
export const WAVEFORM_HEIGHT = 60;
export const MINI_PLAYER_HEIGHT = 64;
export const TAB_BAR_HEIGHT = 80;
