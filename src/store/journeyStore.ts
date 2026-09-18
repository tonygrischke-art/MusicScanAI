/**
 * Journey Store - MMKV Persistence
 * Zustand store for dream journey state management
 */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { DreamJourney, JourneyRequest, Track } from '../types/journey';
import { generateDreamJourney } from '../services/journeyGenerator';

const storage = new MMKV();
const JOURNEY_STORAGE_KEY = '@musicscan_dream_journeys';

interface JourneyState {
  journeys: DreamJourney[];
  currentJourney: DreamJourney | null;
  isGenerating: boolean;
  error: string | null;

  // Actions
  generateJourney: (library: Track[], request: JourneyRequest) => Promise<void>;
  loadJourney: (id: string) => void;
  deleteJourney: (id: string) => void;
  rateJourney: (id: string, rating: number) => void;
  incrementPlayCount: (id: string) => void;
  clearError: () => void;
  setCurrentJourney: (journey: DreamJourney | null) => void;
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
  journeys: [],
  currentJourney: null,
  isGenerating: false,
  error: null,

  generateJourney: async (library, request) => {
    set({ isGenerating: true, error: null });

    try {
      const journey = await generateDreamJourney(library, request);
      
      // Save to store
      const updatedJourneys = [...get().journeys, journey];
      set({ 
        journeys: updatedJourneys,
        currentJourney: journey,
        isGenerating: false,
      });

      // Persist to MMKV
      storage.set(JOURNEY_STORAGE_KEY, JSON.stringify(updatedJourneys));
    } catch (error) {
      set({ 
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate journey',
      });
    }
  },

  loadJourney: (id) => {
    const journey = get().journeys.find(j => j.id === id);
    if (journey) {
      set({ currentJourney: journey });
    }
  },

  deleteJourney: (id) => {
    const updated = get().journeys.filter(j => j.id !== id);
    set({ journeys: updated });
    storage.set(JOURNEY_STORAGE_KEY, JSON.stringify(updated));
  },

  rateJourney: (id, rating) => {
    const updated = get().journeys.map(j =>
      j.id === id ? { ...j, rating } : j
    );
    set({ journeys: updated });
    storage.set(JOURNEY_STORAGE_KEY, JSON.stringify(updated));
  },

  incrementPlayCount: (id) => {
    const updated = get().journeys.map(j =>
      j.id === id 
        ? { ...j, playCount: j.playCount + 1, lastPlayedAt: Date.now() }
        : j
    );
    set({ journeys: updated });
    storage.set(JOURNEY_STORAGE_KEY, JSON.stringify(updated));
  },

  clearError: () => set({ error: null }),

  setCurrentJourney: (journey) => set({ currentJourney: journey }),
}));

// Load journeys from storage on app start
export function loadJourneysFromStorage() {
  try {
    const data = storage.getString(JOURNEY_STORAGE_KEY);
    if (data) {
      const journeys = JSON.parse(data);
      useJourneyStore.setState({ journeys });
    }
  } catch (error) {
    console.error('Failed to load journeys from storage:', error);
  }
}