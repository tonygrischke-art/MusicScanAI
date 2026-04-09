import { MMKV } from 'react-native-mmkv';
import { Track, Playlist, UserSettings, ScanProgress, AIAnalysisProgress } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants';

const storage = new MMKV({ id: 'musicscan-storage' });

export const StorageService = {
  getTracks(): Track[] {
    const data = storage.getString(STORAGE_KEYS.TRACKS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveTracks(tracks: Track[]): void {
    storage.set(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
  },

  getPlaylists(): Playlist[] {
    const data = storage.getString(STORAGE_KEYS.PLAYLISTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  savePlaylists(playlists: Playlist[]): void {
    storage.set(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
  },

  getSettings(): UserSettings {
    const data = storage.getString(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getHistory(): string[] {
    const data = storage.getString(STORAGE_KEYS.HISTORY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveHistory(history: string[]): void {
    storage.set(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  getScanState(): ScanProgress | null {
    const data = storage.getString(STORAGE_KEYS.SCAN_STATE);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveScanState(state: ScanProgress): void {
    storage.set(STORAGE_KEYS.SCAN_STATE, JSON.stringify(state));
  },

  clearScanState(): void {
    storage.delete(STORAGE_KEYS.SCAN_STATE);
  },

  getAIState(): AIAnalysisProgress | null {
    const data = storage.getString(STORAGE_KEYS.AI_STATE);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveAIState(state: AIAnalysisProgress): void {
    storage.set(STORAGE_KEYS.AI_STATE, JSON.stringify(state));
  },

  clearAIState(): void {
    storage.delete(STORAGE_KEYS.AI_STATE);
  },

  clearAll(): void {
    storage.clearAll();
  },

  getStorageSize(): number {
    const allKeys = storage.getAllKeys();
    let size = 0;
    for (const key of allKeys) {
      const value = storage.getString(key);
      if (value) {
        size += value.length * 2;
      }
    }
    return size;
  },

  exportData(): string {
    const data = {
      tracks: this.getTracks(),
      playlists: this.getPlaylists(),
      settings: this.getSettings(),
      history: this.getHistory(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.tracks) this.saveTracks(data.tracks);
      if (data.playlists) this.savePlaylists(data.playlists);
      if (data.settings) this.saveSettings(data.settings);
      if (data.history) this.saveHistory(data.history);
      return true;
    } catch {
      return false;
    }
  },
};

export default StorageService;
