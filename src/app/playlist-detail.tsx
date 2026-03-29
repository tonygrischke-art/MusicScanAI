import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLibrary } from '../hooks/useLibrary';
import { useAudio } from '../hooks/useAudio';
import { useTheme, Button, TrackRow } from '../components';
import { formatTotalDuration, getPlaylistArtwork } from '../utils/helpers';
import { Track } from '../types';

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, accentColor } = useTheme();
  const {
    getPlaylistById,
    getPlaylistTracks,
    updatePlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
  } = useLibrary();
  const { play, playQueue, currentTrack, isPlaying } = useAudio();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const playlist = getPlaylistById(id || '');
  const tracks = playlist ? getPlaylistTracks(playlist.id) : [];

  React.useEffect(() => {
    if (playlist) {
      setNewName(playlist.name);
    }
  }, [playlist?.id]);

  const handlePlay = useCallback(() => {
    if (tracks.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playQueue(tracks, 0);
    }
  }, [tracks, playQueue]);

  const handleShuffle = useCallback(() => {
    if (tracks.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playQueue(shuffled, 0);
    }
  }, [tracks, playQueue]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deletePlaylist(playlist!.id);
            router.back();
          },
        },
      ]
    );
  }, [playlist, deletePlaylist, router]);

  const handleSaveName = useCallback(() => {
    if (newName.trim() && playlist) {
      updatePlaylist(playlist.id, { name: newName.trim() });
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [newName, playlist, updatePlaylist]);

  const handleRemoveTrack = useCallback((trackId: string) => {
    if (playlist) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      removeTrackFromPlaylist(playlist.id, trackId);
    }
  }, [playlist, removeTrackFromPlaylist]);

  if (!playlist) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.errorText}>Playlist not found</Text>
      </View>
    );
  }

  const artworkColors = playlist.artworkCollage.length > 0
    ? playlist.artworkCollage
    : ['#151520', '#1E1E2E', '#2D2D44', '#3D3D54'];

  const collageColors = [
    artworkColors[0] || '#151520',
    artworkColors[1] || '#1E1E2E',
    artworkColors[2] || '#2D2D44',
    artworkColors[3] || '#3D3D54',
  ];

  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);

  const renderTrack = useCallback(({ item, index }: { item: Track; index: number }) => (
    <Animated.View entering={FadeIn.duration(200).delay(index * 20)} layout={Layout.springify()}>
      <TrackRow
        track={item}
        onPress={() => playQueue(tracks, index)}
        onLongPress={() => handleRemoveTrack(item.id)}
        isPlaying={currentTrack?.id === item.id && isPlaying}
      />
    </Animated.View>
  ), [tracks, playQueue, currentTrack, isPlaying, handleRemoveTrack]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={[styles.background, { backgroundColor: collageColors[0] }]} />

      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeIcon}>←</Text>
        </Pressable>
        <Pressable style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editIcon}>✎</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={styles.hero}>
          <View style={styles.collage}>
            {collageColors.map((color, index) => (
              <View key={index} style={[styles.collageItem, { backgroundColor: color }]}>
                {index === 0 && <Text style={styles.collageText}>{playlist.name.charAt(0)}</Text>}
              </View>
            ))}
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Playlist name"
                placeholderTextColor="#6B7280"
                autoFocus
              />
              <Button
                title="Save"
                onPress={handleSaveName}
                variant="primary"
                size="small"
              />
            </View>
          ) : (
            <Text style={styles.playlistName}>{playlist.name}</Text>
          )}

          <Text style={styles.playlistMeta}>
            {tracks.length} tracks • {formatTotalDuration(totalDuration)}
          </Text>

          {playlist.type === 'ai-generated' && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>🤖 AI Generated</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title="Play All"
              onPress={handlePlay}
              variant="primary"
              size="medium"
              icon="▶"
            />
            <Pressable style={styles.shuffleButton} onPress={handleShuffle}>
              <Text style={styles.shuffleIcon}>🔀</Text>
              <Text style={styles.shuffleLabel}>Shuffle</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(200)} style={styles.trackList}>
          {tracks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎵</Text>
              <Text style={styles.emptyText}>No tracks in this playlist</Text>
            </View>
          ) : (
            <FlashList
              data={tracks}
              renderItem={renderTrack}
              keyExtractor={(item) => item.id}
            />
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(300)} style={styles.dangerZone}>
          <Button
            title="Delete Playlist"
            onPress={handleDelete}
            variant="outline"
            size="medium"
            fullWidth
          />
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  collage: {
    width: 200,
    height: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  collageItem: {
    width: '50%',
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collageText: {
    fontSize: 80,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  playlistName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistMeta: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  aiBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  aiBadgeText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  shuffleIcon: {
    fontSize: 18,
  },
  shuffleLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  trackList: {
    minHeight: 300,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  dangerZone: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
  },
  bottomPadding: {
    height: 100,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
