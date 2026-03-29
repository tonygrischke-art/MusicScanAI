import { create } from 'zustand';
import { ThemeColors, Track } from '../types';
import { DEFAULT_THEME } from '../utils/constants';
import StorageService from '../services/StorageService';

type ModalType = 'trackDetail' | 'aiPipeline' | 'settings' | 'createPlaylist' | 'addToPlaylist' | null;

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface UIStore {
  theme: ThemeColors;
  accentColor: string | null;
  activeModal: ModalType;
  modalData: Record<string, unknown>;
  notifications: Notification[];
  isMiniPlayerExpanded: boolean;
  activeFilters: {
    hasActiveFilters: boolean;
    filterDescription: string;
  };
  
  setTheme: (theme: Partial<ThemeColors>) => void;
  setAccentColor: (color: string | null) => void;
  extractAccentFromArtwork: (artworkUrl: string | null) => string | null;
  
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  showNotification: (message: string, type?: Notification['type'], duration?: number) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  
  setMiniPlayerExpanded: (expanded: boolean) => void;
  toggleMiniPlayer: () => void;
  
  updateActiveFilters: (description: string) => void;
  clearActiveFilters: () => void;
  
  loadSettings: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  theme: DEFAULT_THEME,
  accentColor: null,
  activeModal: null,
  modalData: {},
  notifications: [],
  isMiniPlayerExpanded: false,
  activeFilters: {
    hasActiveFilters: false,
    filterDescription: '',
  },

  setTheme: (themeUpdate) => {
    set((state) => ({
      theme: { ...state.theme, ...themeUpdate }
    }));
  },

  setAccentColor: (color) => set({ accentColor: color }),

  extractAccentFromArtwork: (artworkUrl) => {
    if (!artworkUrl) {
      set({ accentColor: DEFAULT_THEME.accent });
      return DEFAULT_THEME.accent;
    }

    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
    const hash = artworkUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hash % colors.length];
    set({ accentColor: color });
    return color;
  },

  openModal: (modal, data = {}) => set({
    activeModal: modal,
    modalData: data,
  }),

  closeModal: () => set({
    activeModal: null,
    modalData: {},
  }),

  showNotification: (message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const notification: Notification = { id, message, type, duration };
    
    set((state) => ({
      notifications: [...state.notifications, notification]
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().dismissNotification(id);
      }, duration);
    }
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  setMiniPlayerExpanded: (expanded) => set({ isMiniPlayerExpanded: expanded }),

  toggleMiniPlayer: () => set((state) => ({
    isMiniPlayerExpanded: !state.isMiniPlayerExpanded
  })),

  updateActiveFilters: (description) => set({
    activeFilters: {
      hasActiveFilters: true,
      filterDescription: description,
    }
  }),

  clearActiveFilters: () => set({
    activeFilters: {
      hasActiveFilters: false,
      filterDescription: '',
    }
  }),

  loadSettings: () => {
    const settings = StorageService.getSettings();
    if (settings.geminiApiKey) {
      // Settings loaded elsewhere in AI store
    }
  },
}));
