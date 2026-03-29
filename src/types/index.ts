export type MoodType = 'energetic' | 'chill' | 'melancholic' | 'euphoric' | 'aggressive' | 'romantic';

export type GenreType = 
  | 'pop' | 'rock' | 'hip-hop' | 'electronic' | 'classical' 
  | 'jazz' | 'r&b' | 'country' | 'metal' | 'indie'
  | 'folk' | 'blues' | 'reggae' | 'latin' | 'ambient';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: GenreType | null;
  year: number | null;
  duration: number;
  path: string;
  artwork: string | null;
  blurhash: string | null;
  colors: string[];
  waveformData: number[];
  bpm: number;
  key: string | null;
  energy: number;
  valence: number;
  mood: MoodType | null;
  confidence: number;
  isFavorite: boolean;
  rating: number;
  playCount: number;
  lastPlayed: string | null;
  dateAdded: string;
  bitrate: number | null;
  sampleRate: number | null;
  channels: number | null;
}

export interface SmartPlaylistRules {
  conditions: PlaylistCondition[];
  matchType: 'all' | 'any';
}

export interface PlaylistCondition {
  field: 'genre' | 'mood' | 'energy' | 'valence' | 'bpm' | 'year' | 'rating' | 'playCount' | 'isFavorite';
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';
  value: string | number | boolean;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  type: 'manual' | 'smart' | 'ai-generated';
  rules?: SmartPlaylistRules;
  artworkCollage: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScanProgress {
  isScanning: boolean;
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  percentage: number;
  error: string | null;
}

export interface AIAnalysisProgress {
  isAnalyzing: boolean;
  currentStep: string;
  progress: number;
  totalTracks: number;
  analyzedTracks: number;
  error: string | null;
}

export interface UserSettings {
  geminiApiKey: string;
  crossfadeDuration: number;
  sleepTimerMinutes: number | null;
  offlineMode: boolean;
  hapticFeedback: boolean;
  autoAnalyzeOnScan: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: 'off' | 'track' | 'queue';
  volume: number;
  rate: number;
}

export interface LibraryFilters {
  searchQuery: string;
  genres: GenreType[];
  moods: MoodType[];
  sortBy: 'title' | 'artist' | 'bpm' | 'energy' | 'dateAdded' | 'playCount';
  sortOrder: 'asc' | 'desc';
}

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
}

export type TabRoute = 'home' | 'library' | 'playlists' | 'player';

export interface QueueItem {
  id: string;
  track: Track;
  addedAt: number;
}

export interface ActivityLogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export type AIGenreColors = {
  [key in GenreType]: string;
};

export type AIMoodColors = {
  [key in MoodType]: string;
};

export const GENRE_COLORS: AIGenreColors = {
  pop: '#FF6B9D',
  rock: '#C92A2A',
  'hip-hop': '#9B59B6',
  electronic: '#00D9FF',
  classical: '#F4D03F',
  jazz: '#E67E22',
  'r&b': '#8E44AD',
  country: '#D35400',
  metal: '#2C3E50',
  indie: '#1ABC9C',
  folk: '#27AE60',
  blues: '#3498DB',
  reggae: '#2ECC71',
  latin: '#E74C3C',
  ambient: '#95A5A6',
};

export const MOOD_COLORS: AIMoodColors = {
  energetic: '#FF4757',
  chill: '#7BED9F',
  melancholic: '#5352ED',
  euphoric: '#FFA502',
  aggressive: '#FF6348',
  romantic: '#FD79A8',
};

export const GENRES: GenreType[] = [
  'pop', 'rock', 'hip-hop', 'electronic', 'classical',
  'jazz', 'r&b', 'country', 'metal', 'indie',
  'folk', 'blues', 'reggae', 'latin', 'ambient'
];

export const MOODS: MoodType[] = [
  'energetic', 'chill', 'melancholic', 'euphoric', 'aggressive', 'romantic'
];
