import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import MMKV from 'react-native-mmkv';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string | null;
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
  mood: string | null;
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

interface ScanResult {
  artist: string;
  album: string;
  year: number;
  tracks: string[];
}

interface MusicStore {
  tracks: Track[];
  currentTrack: Track | null;
  isScanning: boolean;
  scanResult: ScanResult | null;
  
  addTrack: (track: Track) => void;
  setCurrentTrack: (track: Track | null) => void;
  setScanResult: (result: ScanResult | null) => void;
  setIsScanning: (isScanning: boolean) => void;
}

const storage = new MMKV();

export const useStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      tracks: [],
      currentTrack: null,
      isScanning: false,
      scanResult: null,
      
      addTrack: (track) => set((state) => ({
        tracks: [...state.tracks, track]
      })),
      
      setCurrentTrack: (track) => set((state) => ({
        currentTrack: track,
        isPlaying: track ? state.isPlaying : false
      })),
      
      setScanResult: (result) => set((state) => ({
        scanResult: result
      })),
      
      setIsScanning: (isScanning) => set((state) => ({
        isScanning
      }))
    }),
    {
      name: 'music-store',
      storage: {
        getItem: (name) => {
          const value = storage.getString(name);
          return value ? value : null;
        },
        setItem: (name, value) => {
          storage.set(name, value);
        },
        removeItem: (name) => {
          storage.delete(name);
        }
      }
    }
  )
);