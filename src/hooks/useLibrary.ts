import { useCallback, useMemo } from 'react';
import { useLibrary as useLibraryStore } from '../stores/useLibraryStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useUIStore } from '../stores/useUIStore';
import { Track, Playlist, GenreType, MoodType, LibraryFilters } from '../types';
import { calculateStats, getPlaylistArtwork } from '../utils/helpers';

export const useLibrary = () => {
  const {
    tracks,
    playlists,
    filters,
    selectedTrackIds,
    isMultiSelectMode,
    scanProgress,
    
    setSearchQuery,
    setGenreFilter,
    toggleGenreFilter,
    setMoodFilter,
    toggleMoodFilter,
    setSortBy,
    setSortOrder,
    clearFilters,
    
    setSelectedTrackIds,
    toggleTrackSelection,
    setMultiSelectMode,
    selectAll,
    clearSelection,
    
    getFilteredTracks,
    getTrackById,
    getPlaylistById,
    getPlaylistTracks,
    getFavoriteTracks,
    getRecentTracks,
    getTopPlayedTracks,
    
    toggleFavorite,
    updateRating,
    incrementPlayCount,
    
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
  } = useLibraryStore();

  const { addToHistory } = useAudioStore();
  const { updateActiveFilters, clearActiveFilters, showNotification } = useUIStore();

  const filteredTracks = useMemo(() => {
    const filtered = getFilteredTracks();
    
    const hasFilters = filters.searchQuery || filters.genres.length > 0 || filters.moods.length;
    if (hasFilters) {
      let description = '';
      if (filters.searchQuery) {
        description += `Search: "${filters.searchQuery}"`;
      }
      if (filters.genres.length > 0) {
        description += `${description ? ' | ' : ''}Genres: ${filters.genres.join(', ')}`;
      }
      if (filters.moods.length > 0) {
        description += `${description ? ' | ' : ''}Moods: ${filters.moods.join(', ')}`;
      }
      updateActiveFilters(description);
    } else {
      clearActiveFilters();
    }
    
    return filtered;
  }, [tracks, filters, getFilteredTracks, updateActiveFilters, clearActiveFilters]);

  const stats = useMemo(() => calculateStats(tracks), [tracks]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const applyGenreFilter = useCallback((genres: GenreType[]) => {
    setGenreFilter(genres);
  }, [setGenreFilter]);

  const applyMoodFilter = useCallback((moods: MoodType[]) => {
    setMoodFilter(moods);
  }, [setMoodFilter]);

  const sort = useCallback((sortBy: LibraryFilters['sortBy'], order?: 'asc' | 'desc') => {
    setSortBy(sortBy);
    if (order) {
      setSortOrder(order);
    }
  }, [setSortBy, setSortOrder]);

  const resetFilters = useCallback(() => {
    clearFilters();
    showNotification('Filters cleared', 'info');
  }, [clearFilters, showNotification]);

  const handleTrackPress = useCallback((track: Track) => {
    if (isMultiSelectMode) {
      toggleTrackSelection(track.id);
    } else {
      addToHistory(track);
    }
  }, [isMultiSelectMode, toggleTrackSelection, addToHistory]);

  const handleTrackLongPress = useCallback((track: Track) => {
    if (!isMultiSelectMode) {
      setMultiSelectMode(true);
    }
    toggleTrackSelection(track.id);
  }, [isMultiSelectMode, setMultiSelectMode, toggleTrackSelection]);

  const enterMultiSelectMode = useCallback(() => {
    setMultiSelectMode(true);
  }, [setMultiSelectMode]);

  const exitMultiSelectMode = useCallback(() => {
    setMultiSelectMode(false);
    clearSelection();
  }, [setMultiSelectMode, clearSelection]);

  const addSelectedToPlaylist = useCallback((playlistId: string) => {
    selectedTrackIds.forEach((trackId: string) => {
      addTrackToPlaylist(playlistId, trackId);
    });
    showNotification(`Added ${selectedTrackIds.length} tracks to playlist`, 'success');
    exitMultiSelectMode();
  }, [selectedTrackIds, addTrackToPlaylist, showNotification, exitMultiSelectMode]);

  const addSelectedToQueue = useCallback((queue: Track[]) => {
    const selectedTracks = selectedTrackIds
      .map((id: string) => tracks.find((t: Track) => t.id === id))
      .filter((t): t is Track => t !== undefined);
    
    showNotification(`Added ${selectedTracks.length} tracks to queue`, 'success');
    exitMultiSelectMode();
    return selectedTracks;
  }, [selectedTrackIds, tracks, showNotification, exitMultiSelectMode]);

  const deleteSelectedTracks = useCallback(() => {
    selectedTrackIds.forEach((trackId: string) => {
      // In a real app, you'd delete the track file here
    });
    showNotification(`Deleted ${selectedTrackIds.length} tracks`, 'success');
    exitMultiSelectMode();
  }, [selectedTrackIds, showNotification, exitMultiSelectMode]);

  const createNewPlaylist = useCallback((name: string, trackIds?: string[]) => {
    const playlist = createPlaylist(name, trackIds || selectedTrackIds);
    showNotification(`Created playlist "${name}"`, 'success');
    if (selectedTrackIds.length > 0) {
      exitMultiSelectMode();
    }
    return playlist;
  }, [createPlaylist, selectedTrackIds, showNotification, exitMultiSelectMode]);

  const updatePlaylistDetails = useCallback((playlistId: string, updates: Partial<Playlist>) => {
    updatePlaylist(playlistId, updates);
    showNotification('Playlist updated', 'success');
  }, [updatePlaylist, showNotification]);

  const removeTrackFromPlaylistById = useCallback((playlistId: string, trackId: string) => {
    removeTrackFromPlaylist(playlistId, trackId);
  }, [removeTrackFromPlaylist]);

  const reorderPlaylist = useCallback((playlistId: string, newOrder: string[]) => {
    reorderPlaylistTracks(playlistId, newOrder);
  }, [reorderPlaylistTracks]);

  const removePlaylist = useCallback((playlistId: string) => {
    deletePlaylist(playlistId);
    showNotification('Playlist deleted', 'info');
  }, [deletePlaylist, showNotification]);

  const getPlaylistWithArtwork = useCallback((playlistId: string) => {
    const playlist = getPlaylistById(playlistId);
    if (!playlist) return null;
    
    const playlistTracks = getPlaylistTracks(playlistId);
    const artwork = getPlaylistArtwork(playlist, playlistTracks);
    
    return {
      ...playlist,
      artworkCollage: artwork,
      totalDuration: playlistTracks.reduce((acc: number, t: Track) => acc + t.duration, 0),
      trackCount: playlistTracks.length,
    };
  }, [getPlaylistById, getPlaylistTracks]);

  return {
    tracks,
    filteredTracks,
    playlists,
    filters,
    selectedTrackIds,
    isMultiSelectMode,
    scanProgress,
    stats,
    
    search,
    applyGenreFilter,
    applyMoodFilter,
    toggleGenreFilter,
    toggleMoodFilter,
    setSortBy,
    sort,
    resetFilters,
    clearFilters,
    
    handleTrackPress,
    handleTrackLongPress,
    
    enterMultiSelectMode,
    exitMultiSelectMode,
    selectAll,
    clearSelection,
    addSelectedToPlaylist,
    addSelectedToQueue,
    deleteSelectedTracks,
    
    getTrackById,
    getPlaylistById,
    getPlaylistTracks,
    getFavoriteTracks,
    getRecentTracks,
    getTopPlayedTracks,
    getPlaylistWithArtwork,
    
    toggleFavorite,
    updateRating,
    incrementPlayCount,
    
    createPlaylist: createNewPlaylist,
    updatePlaylist: updatePlaylistDetails,
    deletePlaylist: removePlaylist,
    removePlaylist,
    addTrackToPlaylist: addTrackToPlaylist,
    removeTrackFromPlaylist: removeTrackFromPlaylistById,
    reorderPlaylist,
  };
};
