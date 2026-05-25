import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLibrary } from '../../hooks/useLibrary';
import { useAudio } from '../../hooks/useAudio';
import { useTheme, TrackRow, FilterChipGroup, EmptyState, Button, TrackRowSkeleton } from '../../components';
import { Track, GenreType, MoodType } from '../../types';
import { GENRES, MOODS, GENRE_COLORS, MOOD_COLORS } from '../../types';
import { TAB_BAR_HEIGHT } from '../../utils/constants';

const genreChips = GENRES.map(g => ({
  label: g,
  value: g,
  color: GENRE_COLORS[g],
}));

const moodChips = MOODS.map(m => ({
  label: m,
  value: m,
  color: MOOD_COLORS[m],
}));

type SortOption = 'title' | 'artist' | 'bpm' | 'energy' | 'dateAdded' | 'playCount';

const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Title', value: 'title' },
  { label: 'Artist', value: 'artist' },
  { label: 'BPM', value: 'bpm' },
  { label: 'Energy', value: 'energy' },
  { label: 'Added', value: 'dateAdded' },
  { label: 'Plays', value: 'playCount' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const { theme, accentColor } = useTheme();
  const {
    tracks,
    filteredTracks,
    filters,
    isMultiSelectMode,
    selectedTrackIds,
    search,
    applyGenreFilter,
    toggleMoodFilter,
    setSortBy,
    handleTrackPress,
    handleTrackLongPress,
    selectAll,
    clearSelection,
    addSelectedToQueue,
    createPlaylist,
    enterMultiSelectMode,
    exitMultiSelectMode,
  } = useLibrary();
  const { playQueue, currentTrack, isPlaying } = useAudio();

  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback((text: string) => {
    search(text);
  }, [search]);

  const handlePlayTrack = useCallback((track: Track, index: number) => {
    if (!isMultiSelectMode) {
      playQueue(filteredTracks, index);
    } else {
      handleTrackPress(track);
    }
  }, [isMultiSelectMode, playQueue, filteredTracks, handleTrackPress]);

  const handleTrackLongPressWrapper = useCallback((track: Track) => {
    handleTrackLongPress(track);
  }, [handleTrackLongPress]);

  const handleGenreToggle = useCallback((genre: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentGenres = filters.genres;
    if (currentGenres.includes(genre as GenreType)) {
      applyGenreFilter(currentGenres.filter(g => g !== genre));
    } else {
      applyGenreFilter([...currentGenres, genre as GenreType]);
    }
  }, [filters.genres, applyGenreFilter]);

  const handleMoodToggle = useCallback((mood: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleMoodFilter(mood as MoodType);
  }, [toggleMoodFilter]);

  const handleSortChange = useCallback((sort: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(sort);
    setShowSortModal(false);
  }, [setSortBy]);

  const handlePlaySelected = useCallback(() => {
    const selectedTracks = selectedTrackIds
      .map(id => tracks.find(t => t.id === id))
      .filter((t): t is Track => t !== undefined);
    playQueue(selectedTracks, 0);
    exitMultiSelectMode();
  }, [selectedTrackIds, tracks, playQueue, exitMultiSelectMode]);

  const handleAddToPlaylist = useCallback(() => {
    router.push('/playlists');
  }, [router]);

  const renderTrack = useCallback(({ item, index }: { item: Track; index: number }) => {
    return (
      <Animated.View
        entering={FadeIn.duration(200).delay(index * 20)}
        layout={Layout.springify()}
      >
        <TrackRow
          track={item}
          onPress={() => handlePlayTrack(item, index)}
          onLongPress={() => handleTrackLongPressWrapper(item)}
          isPlaying={currentTrack?.id === item.id && isPlaying}
          isSelected={selectedTrackIds.includes(item.id)}
        />
      </Animated.View>
    );
  }, [handlePlayTrack, handleTrackLongPressWrapper, currentTrack, isPlaying, selectedTrackIds]);

  const renderHeader = useCallback(() => (
    <View style={styles.listHeader}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tracks..."
          placeholderTextColor="#6B7280"
          value={filters.searchQuery}
          onChangeText={handleSearch}
        />
        {filters.searchQuery.length > 0 && (
          <Pressable onPress={() => handleSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        <Pressable
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>Filters</Text>
          {(filters.genres.length > 0 || filters.moods.length > 0) && (
            <View style={[styles.filterBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.filterBadgeText}>
                {filters.genres.length + filters.moods.length}
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Text style={styles.sortButtonText}>
            Sort: {sortOptions.find(s => s.value === filters.sortBy)?.label}
          </Text>
        </Pressable>
      </View>

      {showFilters && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.filtersPanel}>
          <Text style={styles.filterLabel}>Genres</Text>
          <FilterChipGroup
            chips={genreChips}
            selected={filters.genres}
            onToggle={handleGenreToggle}
            scrollable
          />
          <Text style={styles.filterLabel}>Moods</Text>
          <FilterChipGroup
            chips={moodChips}
            selected={filters.moods}
            onToggle={handleMoodToggle}
            scrollable
          />
        </Animated.View>
      )}

      {(filters.genres.length > 0 || filters.moods.length > 0 || filters.searchQuery) && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>
            Showing {filteredTracks.length} of {tracks.length} tracks
          </Text>
          <Pressable onPress={() => {
            search('');
            applyGenreFilter([]);
            filters.moods.forEach(m => toggleMoodFilter(m));
          }}>
            <Text style={[styles.clearFilters, { color: accentColor }]}>Clear</Text>
          </Pressable>
        </View>
      )}
    </View>
  ), [filters, showFilters, accentColor, handleSearch, handleGenreToggle, handleMoodToggle, filteredTracks.length, tracks.length]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          {[...Array(10)].map((_, i) => (
            <TrackRowSkeleton key={i} />
          ))}
        </View>
      );
    }

    if (tracks.length === 0) {
      return (
        <EmptyState
          icon="📂"
          title="No tracks yet"
          description="Scan your music library to start building your collection."
          actionLabel="Go to Home"
          onAction={() => router.push('/')}
        />
      );
    }

    return (
      <EmptyState
        icon="🔍"
        title="No results"
        description="Try adjusting your search or filters to find what you're looking for."
        actionLabel="Clear filters"
        onAction={() => {
          search('');
          applyGenreFilter([]);
          filters.moods.forEach(m => toggleMoodFilter(m));
        }}
      />
    );
  }, [isLoading, tracks.length]);

  if (isMultiSelectMode) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.multiSelectHeader}>
          <Pressable onPress={exitMultiSelectMode}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </Pressable>
          <Text style={styles.selectedCount}>
            {selectedTrackIds.length} selected
          </Text>
          <Pressable onPress={selectAll}>
            <Text style={[styles.selectAllButton, { color: accentColor }]}>Select All</Text>
          </Pressable>
        </View>

        <FlashList
          data={filteredTracks}
          renderItem={renderTrack}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.multiSelectActions}>
          <Pressable style={styles.actionButton} onPress={handlePlaySelected}>
            <Text style={styles.actionIcon}>▶</Text>
            <Text style={styles.actionLabel}>Play</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleAddToPlaylist}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionLabel}>Add to Playlist</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>{tracks.length} tracks</Text>
      </View>

      <FlashList
        data={filteredTracks}
        renderItem={renderTrack}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.sortModal, { backgroundColor: theme.surface }]}>
            <Text style={styles.sortModalTitle}>Sort By</Text>
            {sortOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.sortOption,
                  filters.sortBy === option.value && { backgroundColor: accentColor + '20' },
                ]}
                onPress={() => handleSortChange(option.value)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    filters.sortBy === option.value && { color: accentColor },
                  ]}
                >
                  {option.label}
                </Text>
                {filters.sortBy === option.value && (
                  <Text style={[styles.checkmark, { color: accentColor }]}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  listHeader: {
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    height: '100%',
  },
  clearIcon: {
    fontSize: 14,
    color: '#6B7280',
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filtersPanel: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  activeFiltersText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  clearFilters: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: TAB_BAR_HEIGHT + 80,
  },
  loadingContainer: {
    paddingTop: 20,
  },
  multiSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButton: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectAllButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  multiSelectActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModal: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sortOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
  },
});
