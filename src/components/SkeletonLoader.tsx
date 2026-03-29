import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const Skeleton: React.FC<SkeletonProps> = memo(({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        animatedStyle,
        style,
      ]}
    />
  );
});

interface TrackRowSkeletonProps {
  showArtwork?: boolean;
  showBadges?: boolean;
}

export const TrackRowSkeleton: React.FC<TrackRowSkeletonProps> = memo(({
  showArtwork = true,
  showBadges = true,
}) => {
  return (
    <View style={styles.trackRow}>
      {showArtwork && (
        <Skeleton width={48} height={48} borderRadius={8} style={styles.artwork} />
      )}
      <View style={styles.info}>
        <Skeleton width="80%" height={16} style={styles.title} />
        <Skeleton width="50%" height={14} style={styles.artist} />
        {showBadges && (
          <View style={styles.badges}>
            <Skeleton width={50} height={16} borderRadius={8} />
            <Skeleton width={60} height={16} borderRadius={8} />
          </View>
        )}
      </View>
      <Skeleton width={40} height={14} />
    </View>
  );
});

interface PlaylistCardSkeletonProps {
  count?: number;
}

export const PlaylistCardSkeleton: React.FC<PlaylistCardSkeletonProps> = memo(({
  count = 6,
}) => {
  return (
    <View style={styles.grid}>
      {[...Array(count)].map((_, i) => (
        <View key={i} style={styles.playlistCard}>
          <Skeleton width="100%" height={0} borderRadius={12} style={styles.playlistArtwork} />
          <Skeleton width="80%" height={14} style={styles.playlistTitle} />
          <Skeleton width="50%" height={12} />
        </View>
      ))}
    </View>
  );
});

interface StatsSkeletonProps {}

export const StatsSkeleton: React.FC<StatsSkeletonProps> = memo(() => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Skeleton width={60} height={32} borderRadius={8} />
        <Skeleton width={40} height={12} style={styles.statLabel} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={60} height={32} borderRadius={8} />
        <Skeleton width={40} height={12} style={styles.statLabel} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={60} height={32} borderRadius={8} />
        <Skeleton width={40} height={12} style={styles.statLabel} />
      </View>
      <View style={styles.statItem}>
        <Skeleton width={60} height={32} borderRadius={8} />
        <Skeleton width={40} height={12} style={styles.statLabel} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  artwork: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    marginBottom: 6,
  },
  artist: {
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  playlistCard: {
    width: '50%',
    padding: 4,
  },
  playlistArtwork: {
    aspectRatio: 1,
    marginBottom: 8,
  },
  playlistTitle: {
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    marginTop: 8,
  },
});

export default Skeleton;
