import { create } from 'zustand';
import { Track, Playlist, ScanProgress, LibraryFilters, GenreType, MoodType } from '../types';
import StorageService from '../services/StorageService';
import { generateId, findDuplicates, getPlaylistArtwork } from '../utils/helpers';

interface LibraryStore {
  tracks: Track[];
  playlists: Playlist[];
  scanProgress: ScanProgress;
  filters: LibraryFilters;
  selectedTrackIds: string[];
  isMultiSelectMode: boolean;
  
  setTracks: (tracks: Track[]) => void;
  addTrack: (track: Track) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  removeTrack: (trackId: string) => void;
  
  setPlaylists: (playlists: Playlist[]) => void;
  createPlaylist: (name: string, trackIds?: string[]) => Playlist;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, trackIds: string[]) => void;
  
  setScanProgress: (progress: Partial<ScanProgress>) => void;
  resetScanProgress: () => void;
  
  setSearchQuery: (query: string) => void;
  setGenreFilter: (genres: GenreType[]) => void;
  toggleGenreFilter: (genre: GenreType) => void;
  setMoodFilter: (moods: MoodType[]) => void;
  toggleMoodFilter: (mood: MoodType) => void;
  setSortBy: (sortBy: LibraryFilters['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  clearFilters: () => void;
  
  setSelectedTrackIds: (ids: string[]) => void;
  toggleTrackSelection: (trackId: string) => void;
  setMultiSelectMode: (enabled: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  getFilteredTracks: () => Track[];
  getTrackById: (id: string) => Track | undefined;
  getPlaylistById: (id: string) => Playlist | undefined;
  getPlaylistTracks: (playlistId: string) => Track[];
  getFavoriteTracks: () => Track[];
  getRecentTracks: (limit?: number) => Track[];
  getTopPlayedTracks: (limit?: number) => Track[];
  
  toggleFavorite: (trackId: string) => void;
  updateRating: (trackId: string, rating: number) => void;
  incrementPlayCount: (trackId: string) => void;
  
  checkForDuplicates: () => Track[][];
  refreshLibrary: () => void;
}

const initialFilters: LibraryFilters = {
  searchQuery: '',
  genres: [],
  moods: [],
  sortBy: 'title',
  sortOrder: 'asc',
};

const initialScanProgress: ScanProgress = {
  isScanning: false,
  currentFile: '',
  currentIndex: 0,
  totalFiles: 0,
  percentage: 0,
  error: null,
};

export const useLibrary = create<LibraryStore>((set, get) => ({
  tracks: [],
  playlists: [],
  scanProgress: initialScanProgress,
  filters: initialFilters,
  selectedTrackIds: [],
  isMultiSelectMode: false,

  setTracks: (tracks) => {
    set({ tracks });
    StorageService.saveTracks(tracks);
  },

  addTrack: (track) => {
    const tracks = [...get().tracks, track];
    set({ tracks });
    StorageService.saveTracks(tracks);
  },

  updateTrack: (trackId, updates) => {
    const tracks = get().tracks.map(t =>
      t.id === trackId ? { ...t, ...updates } : t
    );
    set({ tracks });
    StorageService.saveTracks(tracks);
  },

  removeTrack: (trackId) => {
    const tracks = get().tracks.filter(t => t.id !== trackId);
    const playlists = get().playlists.map(p => ({
      ...p,
      trackIds: p.trackIds.filter(id => id !== trackId),
    }));
    set({ tracks, playlists });
    StorageService.saveTracks(tracks);
    StorageService.savePlaylists(playlists);
  },

  setPlaylists: (playlists) => {
    set({ playlists });
    StorageService.savePlaylists(playlists);
  },

  createPlaylist: (name, trackIds = []) => {
    const newPlaylist: Playlist = {
      id: generateId(),
      name,
      trackIds,
      type: 'manual',
      artworkCollage: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const playlists = [...get().playlists, newPlaylist];
    set({ playlists });
    StorageService.savePlaylists(playlists);
    return newPlaylist;
  },

  updatePlaylist: (playlistId, updates) => {
    const playlists = get().playlists.map(p =>
      p.id === playlistId
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    );
    set({ playlists });
    StorageService.savePlaylists(playlists);
  },

  deletePlaylist: (playlistId) => {
    const playlists = get().playlists.filter(p => p.id !== playlistId);
    set({ playlists });
    StorageService.savePlaylists(playlists);
  },

  addTrackToPlaylist: (playlistId, trackId) => {
    const playlists = get().playlists.map(p => {
      if (p.id === playlistId && !p.trackIds.includes(trackId)) {
        const updatedTrackIds = [...p.trackIds, trackId];
        const tracks = get().tracks;
        return {
          ...p,
          trackIds: updatedTrackIds,
          artworkCollage: getPlaylistArtwork({ ...p, trackIds: updatedTrackIds }, tracks),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    set({ playlists });
    StorageService.savePlaylists(playlists);
  },

  removeTrackFromPlaylist: (playlistId, trackId) => {
    const playlists = get().playlists.map(p => {
      if (p.id === playlistId) {
        const updatedTrackIds = p.trackIds.filter(id => id !== trackId);
        const tracks = get().tracks;
        return {
          ...p,
          trackIds: updatedTrackIds,
          artworkCollage: getPlaylistArtwork({ ...p, trackIds: updatedTrackIds }, tracks),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    set({ playlists });
    StorageService.savePlaylists(playlists);
  },

  reorderPlaylistTracks: (playlistId, trackIds) => {
    const playlists = get().playlists.map(p =>
      p.id === playlistId
        ? { ...p, trackIds, updatedAt: new Date().toISOString() }
        : p
    );
    set({ playlists });
    StorageService.savePlaylists(playlists);
  },

  setScanProgress: (progress) => {
    const current = get().scanProgress;
    const updated = { ...current, ...progress };
    set({ scanProgress: updated });
    StorageService.saveScanState(updated);
  },

  resetScanProgress: () => {
    set({ scanProgress: initialScanProgress });
    StorageService.clearScanState();
  },

  setSearchQuery: (query) => set((state) => ({
    filters: { ...state.filters, searchQuery: query }
  })),

  setGenreFilter: (genres) => set((state) => ({
    filters: { ...state.filters, genres }
  })),

  toggleGenreFilter: (genre) => set((state) => {
    const genres = state.filters.genres.includes(genre)
      ? state.filters.genres.filter(g => g !== genre)
      : [...state.filters.genres, genre];
    return { filters: { ...state.filters, genres } };
  }),

  setMoodFilter: (moods) => set((state) => ({
    filters: { ...state.filters, moods }
  })),

  toggleMoodFilter: (mood) => set((state) => {
    const moods = state.filters.moods.includes(mood)
      ? state.filters.moods.filter(m => m !== mood)
      : [...state.filters.moods, mood];
    return { filters: { ...state.filters, moods } };
  }),

  setSortBy: (sortBy) => set((state) => ({
    filters: { ...state.filters, sortBy }
  })),

  setSortOrder: (order) => set((state) => ({
    filters: { ...state.filters, sortOrder: order }
  })),

  clearFilters: () => set({ filters: initialFilters }),

  setSelectedTrackIds: (ids) => set({ selectedTrackIds: ids }),

  toggleTrackSelection: (trackId) => set((state) => {
    const ids = state.selectedTrackIds.includes(trackId)
      ? state.selectedTrackIds.filter(id => id !== trackId)
      : [...state.selectedTrackIds, trackId];
    return { selectedTrackIds: ids };
  }),

  setMultiSelectMode: (enabled) => set({
    isMultiSelectMode: enabled,
    selectedTrackIds: enabled ? [] : []
  }),

  selectAll: () => {
    const filtered = get().getFilteredTracks();
    set({ selectedTrackIds: filtered.map(t => t.id) });
  },

  clearSelection: () => set({ selectedTrackIds: [], isMultiSelectMode: false }),

  getFilteredTracks: () => {
    const { tracks, filters } = get();
    let filtered = [...tracks];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        (t.album && t.album.toLowerCase().includes(query))
      );
    }

    if (filters.genres.length > 0) {
      filtered = filtered.filter(t => t.genre && filters.genres.includes(t.genre));
    }

    if (filters.moods.length > 0) {
      filtered = filtered.filter(t => t.mood && filters.moods.includes(t.mood));
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist);
          break;
        case 'bpm':
          comparison = a.bpm - b.bpm;
          break;
        case 'energy':
          comparison = a.energy - b.energy;
          break;
        case 'dateAdded':
          comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
        case 'playCount':
          comparison = a.playCount - b.playCount;
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  },

  getTrackById: (id) => get().tracks.find(t => t.id === id),

  getPlaylistById: (id) => get().playlists.find(p => p.id === id),

  getPlaylistTracks: (playlistId) => {
    const playlist = get().getPlaylistById(playlistId);
    if (!playlist) return [];
    return playlist.trackIds
      .map(id => get().getTrackById(id))
      .filter((t): t is Track => t !== undefined);
  },

  getFavoriteTracks: () => get().tracks.filter(t => t.isFavorite),

  getRecentTracks: (limit = 10) => {
    const tracksWithPlayed = get().tracks
      .filter(t => t.lastPlayed)
      .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime());
    return tracksWithPlayed.slice(0, limit);
  },

  getTopPlayedTracks: (limit = 10) => {
    return [...get().tracks]
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  },

  toggleFavorite: (trackId) => {
    const track = get().getTrackById(trackId);
    if (track) {
      get().updateTrack(trackId, { isFavorite: !track.isFavorite });
    }
  },

  updateRating: (trackId, rating) => {
    get().updateTrack(trackId, { rating: Math.max(0, Math.min(5, rating)) });
  },

  incrementPlayCount: (trackId) => {
    const track = get().getTrackById(trackId);
    if (track) {
      get().updateTrack(trackId, {
        playCount: track.playCount + 1,
        lastPlayed: new Date().toISOString()
      });
    }
  },

  checkForDuplicates: () => findDuplicates(get().tracks),

  refreshLibrary: () => {
    const tracks = StorageService.getTracks();
    const playlists = StorageService.getPlaylists();
    set({ tracks, playlists });
  },
}));
