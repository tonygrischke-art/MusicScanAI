import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../hooks/useAudio';
import { useAI } from '../hooks/useAI';
import { useLibrary } from '../hooks/useLibrary';
import { useTheme, WaveformVisualizer, Button } from '../components';
import { formatDuration, getGenreColor, getMoodColor } from '../utils/helpers';
import { SLEEP_TIMER_OPTIONS } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 80;

export default function PlayerScreen() {
  const router = useRouter();
  const { theme, accentColor, extractAccentFromArtwork } = useTheme();
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    shuffle,
    repeat,
    togglePlayPause,
    next,
    previous,
    seek,
    toggleShuffle,
    cycleRepeat,
    setSleepTimer,
    sleepTimerRemaining,
  } = useAudio();
  const { getSimilarTracks } = useAI();
  const { tracks } = useLibrary();

  const [showQueue, setShowQueue] = useState(false);
  const [similarTracks, setSimilarTracks] = useState<any[]>([]);
  const [showSleepTimer, setShowSleepTimer] = useState(false);

  const translateY = useSharedValue(0);
  const progressWidth = duration > 0 ? (progress / duration) * 100 : 0;

  useEffect(() => {
    if (currentTrack?.artwork) {
      extractAccentFromArtwork(currentTrack.artwork);
    }
  }, [currentTrack?.artwork]);

  useEffect(() => {
    const loadSimilar = async () => {
      if (currentTrack) {
        const similar = await getSimilarTracks(currentTrack);
        setSimilarTracks(similar);
      }
    };
    loadSimilar();
  }, [currentTrack?.id]);

  const handleSeek = useCallback((position: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    seek(position * duration);
  }, [duration, seek]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150) {
        runOnJS(() => { router.back(); })();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(
      translateY.value,
      [0, SCREEN_HEIGHT / 2],
      [1, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  const dismissGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(() => { router.back(); })();
    });

  if (!currentTrack) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="🎵"
          title="Nothing Playing"
          description="Select a track from your library to start playing."
        />
      </View>
    );
  }

  const backgroundColor = currentTrack.colors[0] || '#151520';

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <GestureDetector gesture={dismissGesture}>
        <View style={[styles.dismissArea]} />
      </GestureDetector>

      <Animated.View style={[styles.container, animatedStyle]}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={[styles.background, { backgroundColor }]} />

        <GestureDetector gesture={panGesture}>
          <View style={styles.content}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeIcon}>↓</Text>
            </Pressable>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.artworkContainer}
              >
                <View style={[styles.artwork, { backgroundColor: currentTrack.colors[1] || backgroundColor }]}>
                  <Text style={styles.artworkText}>
                    {currentTrack.title.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </Animated.View>

              <View style={styles.trackInfo}>
                <Text style={styles.title} numberOfLines={2}>
                  {currentTrack.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
                {currentTrack.album && (
                  <Text style={styles.album} numberOfLines={1}>
                    {currentTrack.album} {currentTrack.year ? `• ${currentTrack.year}` : ''}
                  </Text>
                )}

                <View style={styles.badges}>
                  {currentTrack.mood && (
                    <View style={[styles.badge, { backgroundColor: getMoodColor(currentTrack.mood) + '30' }]}>
                      <Text style={[styles.badgeText, { color: getMoodColor(currentTrack.mood) }]}>
                        {currentTrack.mood}
                      </Text>
                    </View>
                  )}
                  {currentTrack.genre && (
                    <View style={[styles.badge, { backgroundColor: getGenreColor(currentTrack.genre) + '30' }]}>
                      <Text style={[styles.badgeText, { color: getGenreColor(currentTrack.genre) }]}>
                        {currentTrack.genre}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.waveformContainer}>
                <WaveformVisualizer
                  data={currentTrack.waveformData}
                  progress={progressWidth}
                  isPlaying={isPlaying}
                  height={80}
                  barWidth={3}
                />
              </View>

              <View style={styles.progressContainer}>
                <Pressable
                  style={styles.progressBar}
                  onPress={(e) => {
                    const x = e.nativeEvent.locationX;
                    const width = SCREEN_WIDTH - 80;
                    const position = Math.max(0, Math.min(1, x / width));
                    handleSeek(position);
                  }}
                >
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressWidth}%`, backgroundColor: accentColor },
                      ]}
                    />
                  </View>
                </Pressable>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatDuration(progress)}</Text>
                  <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                </View>
              </View>

              <View style={styles.controls}>
                <Pressable
                  style={[styles.controlButton, shuffle && { backgroundColor: accentColor + '30' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleShuffle();
                  }}
                >
                  <Text style={[styles.controlIcon, shuffle && { color: accentColor }]}>🔀</Text>
                </Pressable>

                <Pressable
                  style={styles.controlButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    previous();
                  }}
                >
                  <Text style={styles.controlIcon}>⏮</Text>
                </Pressable>

                <Pressable
                  style={[styles.playButton, { backgroundColor: accentColor }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    togglePlayPause();
                  }}
                >
                  <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
                </Pressable>

                <Pressable
                  style={styles.controlButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    next();
                  }}
                >
                  <Text style={styles.controlIcon}>⏭</Text>
                </Pressable>

                <Pressable
                  style={[styles.controlButton, repeat !== 'off' && { backgroundColor: accentColor + '30' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    cycleRepeat();
                  }}
                >
                  <Text style={[styles.controlIcon, repeat !== 'off' && { color: accentColor }]}>
                    {repeat === 'track' ? '🔂' : '🔁'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.secondaryControls}>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryIcon}>❤️</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryIcon}>➕</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryIcon}>🔊</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setShowSleepTimer(!showSleepTimer)}
                >
                  <Text style={styles.secondaryIcon}>😴</Text>
                </Pressable>
              </View>

              {showSleepTimer && (
                <View style={styles.sleepTimerContainer}>
                  <Text style={styles.sleepTimerLabel}>Sleep Timer</Text>
                  <View style={styles.sleepTimerOptions}>
                    {SLEEP_TIMER_OPTIONS.map((minutes) => (
                      <Pressable
                        key={minutes ?? 'off'}
                        style={[
                          styles.sleepTimerOption,
                          sleepTimerRemaining !== null && minutes === Math.ceil(sleepTimerRemaining / 60) && {
                            backgroundColor: accentColor + '30',
                          },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSleepTimer(minutes);
                          setShowSleepTimer(false);
                        }}
                      >
                        <Text style={styles.sleepTimerText}>
                          {minutes ? `${minutes} min` : 'Off'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Track Stats</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{currentTrack.bpm}</Text>
                    <Text style={styles.statLabel}>BPM</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{currentTrack.key || 'N/A'}</Text>
                    <Text style={styles.statLabel}>Key</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{Math.round(currentTrack.energy * 100)}%</Text>
                    <Text style={styles.statLabel}>Energy</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{Math.round(currentTrack.valence * 100)}%</Text>
                    <Text style={styles.statLabel}>Valence</Text>
                  </View>
                </View>
              </View>

              <View style={styles.moreLikeThis}>
                <Text style={styles.sectionTitle}>More Like This</Text>
                <Text style={styles.moreSubtitle}>AI-powered recommendations</Text>
                {similarTracks.slice(0, 5).map((track) => (
                  <Pressable key={track.id} style={styles.similarTrack}>
                    <View style={[styles.similarArtwork, { backgroundColor: track.colors[0] }]}>
                      <Text style={styles.similarArtworkText}>
                        {track.title.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.similarInfo}>
                      <Text style={styles.similarTitle} numberOfLines={1}>{track.title}</Text>
                      <Text style={styles.similarArtist} numberOfLines={1}>{track.artist}</Text>
                    </View>
                    <Text style={styles.similarDuration}>{formatDuration(track.duration)}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>
          </View>
        </GestureDetector>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  dismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  artworkText: {
    fontSize: 120,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  album: {
    fontSize: 14,
    color: '#6B7280',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  waveformContainer: {
    marginBottom: 16,
    paddingHorizontal: -20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 40,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryIcon: {
    fontSize: 18,
  },
  sleepTimerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  sleepTimerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sleepTimerOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sleepTimerOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  sleepTimerText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  moreLikeThis: {
    marginBottom: 32,
  },
  moreSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  similarTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  similarArtwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarArtworkText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  similarInfo: {
    flex: 1,
  },
  similarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  similarArtist: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  similarDuration: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 60,
  },
});

const EmptyState = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
    <Text style={{ fontSize: 60, marginBottom: 16 }}>{icon}</Text>
    <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' }}>
      {title}
    </Text>
    <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>{description}</Text>
  </View>
);
