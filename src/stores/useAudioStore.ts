import { create } from 'zustand';
import { Track, PlaybackState } from '../types';
import StorageService from '../services/StorageService';

interface AudioStore extends PlaybackState {
  sleepTimerEndTime: number | null;
  sleepTimerRemaining: number | null;
  
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setQueue: (queue: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: 'off' | 'track' | 'queue') => void;
  setVolume: (volume: number) => void;
  setRate: (rate: number) => void;
  addToHistory: (track: Track) => void;
  setSleepTimer: (minutes: number | null) => void;
  updateSleepTimerRemaining: () => void;
  reset: () => void;
}

const initialState: PlaybackState & { sleepTimerEndTime: number | null; sleepTimerRemaining: number | null } = {
  isPlaying: false,
  currentTrack: null,
  queue: [],
  history: [],
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: 'off',
  volume: 1,
  rate: 1,
  sleepTimerEndTime: null,
  sleepTimerRemaining: null,
};

export const useAudioStore = create<AudioStore>((set, get) => ({
  ...initialState,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  setQueue: (queue) => set({ queue }),
  
  addToQueue: (track) => set((state) => ({
    queue: [...state.queue, track]
  })),
  
  removeFromQueue: (trackId) => set((state) => ({
    queue: state.queue.filter((t) => t.id !== trackId)
  })),
  
  clearQueue: () => set({ queue: [] }),
  
  setProgress: (progress) => set({ progress }),
  
  setDuration: (duration) => set({ duration }),
  
  setShuffle: (shuffle) => set({ shuffle }),
  
  setRepeat: (repeat) => set({ repeat }),
  
  setVolume: (volume) => set({ volume }),
  
  setRate: (rate) => set({ rate }),
  
  addToHistory: (track) => {
    const history = get().history;
    const updatedHistory = [track, ...history.filter(t => t.id !== track.id)].slice(0, 50);
    set({ history: updatedHistory });
    StorageService.saveHistory(updatedHistory.map(t => t.id));
  },
  
  setSleepTimer: (minutes) => {
    if (minutes === null) {
      set({ sleepTimerEndTime: null, sleepTimerRemaining: null });
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      set({ sleepTimerEndTime: endTime, sleepTimerRemaining: minutes * 60 });
    }
  },
  
  updateSleepTimerRemaining: () => {
    const { sleepTimerEndTime } = get();
    if (sleepTimerEndTime) {
      const remaining = Math.max(0, Math.floor((sleepTimerEndTime - Date.now()) / 1000));
      set({ sleepTimerRemaining: remaining });
      if (remaining === 0) {
        set({ sleepTimerEndTime: null, isPlaying: false });
      }
    }
  },
  
  reset: () => set(initialState),
}));
