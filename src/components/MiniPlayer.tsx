import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useAudio } from '../hooks/useAudio';
import { useUIStore } from '../stores/useUIStore';
import { useTheme } from './ThemeProvider';
import { formatDuration } from '../utils/helpers';
import { MINI_PLAYER_HEIGHT } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MiniPlayerProps {
  onExpand: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const { theme, accentColor } = useTheme();
  const { isMiniPlayerExpanded, setMiniPlayerExpanded } = useUIStore();
  const { currentTrack, isPlaying, progress, duration, togglePlayPause, next } = useAudio();

  const translateY = useSharedValue(0);
  const isPressed = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isPressed.value = true;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      isPressed.value = false;
      if (event.translationY < -50) {
        setMiniPlayerExpanded(true);
        onExpand();
      } else if (event.translationY > 50) {
        setMiniPlayerExpanded(false);
      }
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateY.value,
      [-100, 0, 100],
      [0.95, 1, 1.05],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateY: translateY.value },
        { scale },
      ],
    };
  });

  const progressWidth = duration > 0 ? (progress / duration) * 100 : 0;

  if (!currentTrack) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressWidth}%`, backgroundColor: accentColor },
            ]}
          />
        </View>

        <BlurView intensity={80} tint="dark" style={styles.blur}>
          <Pressable onPress={onExpand} style={styles.content}>
            <View style={styles.artworkContainer}>
              <View style={[styles.artwork, { backgroundColor: currentTrack.colors[0] || '#151520' }]}>
                <Text style={styles.artworkText}>
                  {currentTrack.title.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.trackInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>

            <View style={styles.waveformContainer}>
              {isPlaying && (
                <View style={styles.waveform}>
                  {[...Array(5)].map((_, i) => (
                    <AnimatedBar key={i} isPlaying={isPlaying} index={i} />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.controls}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  togglePlayPause();
                }}
                style={({ pressed }) => [
                  styles.playButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.playIcon}>
                  {isPlaying ? '⏸' : '▶'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  next();
                }}
                style={({ pressed }) => [
                  styles.nextButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.nextIcon}>⏭</Text>
              </Pressable>
            </View>
          </Pressable>
        </BlurView>
      </Animated.View>
    </GestureDetector>
  );
};

interface AnimatedBarProps {
  isPlaying: boolean;
  index: number;
}

const AnimatedBar = memo(({ isPlaying, index }: AnimatedBarProps) => {
  const height = useSharedValue(8);

  React.useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        height.value = withTiming(Math.random() * 16 + 8, { duration: 200 + index * 50 });
        setTimeout(animate, 200 + index * 50);
      };
      animate();
    } else {
      height.value = withTiming(8, { duration: 200 });
    }
  }, [isPlaying, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  blur: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  artworkContainer: {
    marginRight: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  artist: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  waveformContainer: {
    width: 40,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bar: {
    width: 3,
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  playIcon: {
    fontSize: 16,
    color: '#fff',
  },
  nextIcon: {
    fontSize: 14,
    color: '#fff',
  },
});

export default MiniPlayer;
