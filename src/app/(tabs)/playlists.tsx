import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, FadeInUp, Layout, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useLibrary } from '../../hooks/useLibrary';
import { useAI } from '../../hooks/useAI';
import { useTheme, Button, EmptyState, PlaylistCardSkeleton } from '../../components';
import { Playlist } from '../../types';
import { formatTotalDuration } from '../../utils/helpers';
import { TAB_BAR_HEIGHT } from '../../utils/constants';

const AI_PRESETS = [
  { label: 'Chill Vibes', prompt: 'chill relaxed mood' },
  { label: 'Workout', prompt: 'high energy workout pump' },
  { label: 'Sleep', prompt: 'calm peaceful sleep' },
  { label: 'Party', prompt: 'dance party vibes' },
  { label: 'Feels', prompt: 'happy positive mood' },
  { label: 'Morning', prompt: 'morning wake up energy' },
];

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
  onLongPress: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = React.memo(({
  playlist,
  onPress,
  onLongPress,
}) => {
  const { accentColor } = useTheme();

  const collageColors = [
    playlist.artworkCollage[0] || '#151520',
    playlist.artworkCollage[1] || '#1E1E2E',
    playlist.artworkCollage[2] || '#2D2D44',
    playlist.artworkCollage[3] || '#3D3D54',
  ];

  return (
    <Animated.View
      entering={ZoomIn.duration(300)}
      exiting={FadeIn.duration(200)}
      layout={Layout.springify()}
      style={styles.cardContainer}
    >
      <Pressable
        style={styles.card}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={styles.collage}>
          {collageColors.map((color, index) => (
            <View
              key={index}
              style={[styles.collageItem, { backgroundColor: color }]}
            />
          ))}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={styles.cardMeta}>
            {playlist.trackIds.length} tracks • {playlist.type === 'ai-generated' ? '🤖' : playlist.type === 'smart' ? '⚡' : '📝'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default function PlaylistsScreen() {
  const router = useRouter();
  const { theme, accentColor } = useTheme();
  const {
    playlists,
    createPlaylist,
    removePlaylist,
    getPlaylistTracks,
    getPlaylistWithArtwork,
  } = useLibrary();
  const { createAIPlaylist, isAnalyzing } = useAI();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  const handleCreatePlaylist = useCallback(() => {
    if (newPlaylistName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateModal(false);
    }
  }, [newPlaylistName, createPlaylist]);

  const handleAIGenerate = useCallback(async () => {
    if (aiPrompt.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createAIPlaylist(aiPrompt.trim());
      setAiPrompt('');
      setShowAIModal(false);
    }
  }, [aiPrompt, createAIPlaylist]);

  const handlePresetPress = useCallback(async (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await createAIPlaylist(prompt);
    setShowAIModal(false);
  }, [createAIPlaylist]);

  const handlePlaylistPress = useCallback((playlist: Playlist) => {
    router.push(`/playlist-detail?id=${playlist.id}`);
  }, [router]);

  const handlePlaylistLongPress = useCallback((playlist: Playlist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Show options menu
  }, []);

  const renderPlaylist = useCallback(({ item }: { item: Playlist }) => {
    return (
      <PlaylistCard
        playlist={item}
        onPress={() => handlePlaylistPress(item)}
        onLongPress={() => handlePlaylistLongPress(item)}
      />
    );
  }, [handlePlaylistPress, handlePlaylistLongPress]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.actions}>
        <Button
          title="Create Playlist"
          onPress={() => setShowCreateModal(true)}
          variant="outline"
          size="medium"
          icon="➕"
        />
        <Button
          title="AI Generator"
          onPress={() => setShowAIModal(true)}
          variant="primary"
          size="medium"
          icon="🤖"
          disabled={isAnalyzing}
        />
      </View>

      <Text style={styles.sectionTitle}>Your Playlists</Text>
    </View>
  ), [isAnalyzing]);

  const renderEmpty = useCallback(() => (
    <EmptyState
      icon="🎶"
      title="No playlists yet"
      description="Create a playlist or use AI to generate one based on your mood."
      actionLabel="Create Playlist"
      onAction={() => setShowCreateModal(true)}
    />
  ), []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Playlists</Text>
        <Text style={styles.subtitle}>{playlists.length} playlists</Text>
      </View>

      <FlashList
        data={playlists}
        renderItem={renderPlaylist}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCreateModal(false)}
        >
          <Animated.View
            entering={ZoomIn.duration(300)}
            style={[styles.modal, { backgroundColor: theme.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Create Playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist name"
              placeholderTextColor="#6B7280"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowCreateModal(false)}
                variant="ghost"
                size="medium"
              />
              <Button
                title="Create"
                onPress={handleCreatePlaylist}
                variant="primary"
                size="medium"
                disabled={!newPlaylistName.trim()}
              />
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      <Modal
        visible={showAIModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAIModal(false)}
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.aiModal, { backgroundColor: theme.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.aiModalHandle} />
            
            <Text style={styles.modalTitle}>AI Playlist Generator</Text>
            <Text style={styles.aiSubtitle}>
              Describe the vibe or mood you want, and AI will create a playlist for you.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Upbeat songs for running"
              placeholderTextColor="#6B7280"
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
            />

            <Text style={styles.presetsLabel}>Quick presets:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presets}
            >
              {AI_PRESETS.map((preset) => (
                <Pressable
                  key={preset.label}
                  style={styles.presetButton}
                  onPress={() => handlePresetPress(preset.prompt)}
                >
                  <Text style={styles.presetText}>{preset.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Button
              title={isAnalyzing ? 'Generating...' : 'Generate Playlist'}
              onPress={handleAIGenerate}
              variant="primary"
              size="large"
              fullWidth
              disabled={!aiPrompt.trim() || isAnalyzing}
              loading={isAnalyzing}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
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
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: TAB_BAR_HEIGHT + 80,
  },
  cardContainer: {
    flex: 1,
    padding: 4,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  collage: {
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collageItem: {
    width: '50%',
    aspectRatio: 1,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    minHeight: 48,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  aiModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  aiModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  aiSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    textAlign: 'center',
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  presets: {
    gap: 8,
    marginBottom: 20,
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  presetText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
