import { create } from 'zustand';

export const EQ_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const EQ_BAND_LABELS = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'] as const;
export const EQ_MIN_DB = -12;
export const EQ_MAX_DB = 12;

export interface EQPreset {
  name: string;
  bands: number[];
  isCustom?: boolean;
}

export const EQ_PRESETS: EQPreset[] = [
  { name: 'Flat',        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Bass Boost',  bands: [8, 7, 6, 3, 0, 0, 0, 0, 0, 0] },
  { name: 'Treble Boost',bands: [0, 0, 0, 0, 0, 2, 4, 6, 7, 8] },
  { name: 'Rock',        bands: [5, 4, 3, 0, -1, -1, 0, 3, 4, 5] },
  { name: 'Pop',         bands: [-1, 0, 2, 4, 4, 3, 2, 0, -1, -1] },
  { name: 'Jazz',        bands: [4, 3, 1, 2, -2, -2, 0, 1, 3, 4] },
  { name: 'Classical',   bands: [5, 4, 3, 2, -2, -2, 0, 2, 4, 5] },
  { name: 'Hip Hop',     bands: [6, 5, 2, 3, -1, -1, 2, 3, 2, 1] },
  { name: 'Electronic',  bands: [5, 4, 1, 0, -3, -2, 1, 4, 5, 6] },
  { name: 'Acoustic',    bands: [4, 3, 2, 1, 2, 3, 3, 2, 1, 0] },
  { name: 'Vocal',       bands: [-2, -1, 0, 3, 5, 5, 3, 1, 0, -1] },
  { name: 'Bass Reducer',bands: [-6, -5, -3, -1, 0, 0, 0, 0, 0, 0] },
  { name: 'Night Mode',  bands: [-3, -2, -1, 0, 2, 3, 3, 2, 1, 0] },
  { name: 'Stadium',     bands: [6, 5, 3, 0, -3, -3, 0, 3, 5, 6] },
  { name: 'Studio',      bands: [3, 2, 1, 0, -1, -1, 0, 1, 2, 3] },
];

export interface CustomPreset {
  id: string;
  name: string;
  bands: number[];
  createdAt: string;
}

interface EqualizerState {
  bands: number[];
  presetName: string;
  isEnabled: boolean;
  bassBoost: number;
  stereoWidener: boolean;
  customPresets: CustomPreset[];
  visualizerData: number[];

  setBand: (index: number, value: number) => void;
  setBands: (bands: number[]) => void;
  applyPreset: (preset: EQPreset) => void;
  setEnabled: (enabled: boolean) => void;
  setBassBoost: (value: number) => void;
  setStereoWidener: (enabled: boolean) => void;
  saveCustomPreset: (name: string) => void;
  loadCustomPreset: (id: string) => void;
  deleteCustomPreset: (id: string) => void;
  setVisualizerData: (data: number[]) => void;
  reset: () => void;
}

const defaultBands = [...EQ_PRESETS[0].bands];

export const useEqualizerStore = create<EqualizerState>((set, get) => ({
  bands: defaultBands,
  presetName: 'Flat',
  isEnabled: true,
  bassBoost: 0,
  stereoWidener: false,
  customPresets: [],
  visualizerData: new Array(20).fill(0),

  setBand: (index, value) => {
    const clamped = Math.max(EQ_MIN_DB, Math.min(EQ_MAX_DB, value));
    set((state) => {
      const bands = [...state.bands];
      bands[index] = clamped;
      return { bands, presetName: 'Custom' };
    });
  },

  setBands: (bands) => set({ bands, presetName: 'Custom' }),

  applyPreset: (preset) => set({
    bands: [...preset.bands],
    presetName: preset.name,
  }),

  setEnabled: (isEnabled) => set({ isEnabled }),

  setBassBoost: (bassBoost) => set({ bassBoost }),

  setStereoWidener: (stereoWidener) => set({ stereoWidener }),

  saveCustomPreset: (name) => {
    const { bands, customPresets } = get();
    const newPreset: CustomPreset = {
      id: `custom_${Date.now()}`,
      name,
      bands: [...bands],
      createdAt: new Date().toISOString(),
    };
    set({ customPresets: [...customPresets, newPreset] });
  },

  loadCustomPreset: (id) => {
    const { customPresets } = get();
    const preset = customPresets.find((p) => p.id === id);
    if (preset) {
      set({ bands: [...preset.bands], presetName: preset.name });
    }
  },

  deleteCustomPreset: (id) => {
    set((state) => ({
      customPresets: state.customPresets.filter((p) => p.id !== id),
    }));
  },

  setVisualizerData: (visualizerData) => set({ visualizerData }),

  reset: () => set({
    bands: defaultBands,
    presetName: 'Flat',
    isEnabled: true,
    bassBoost: 0,
    stereoWidener: false,
    visualizerData: new Array(20).fill(0),
  }),
}));
