import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const BAR_WIDTH = 3;
const BAR_GAP = 2;
const WAVEFORM_HEIGHT = 80;

interface WaveformScrubberProps {
  waveformData: number[];
  progress: number; // 0-1
  duration: number; // seconds
  onSeek: (progress: number) => void;
  accentColor: string;
}

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  waveformData,
  progress,
  duration,
  onSeek,
  accentColor,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<View>(null);
  const containerWidth = useRef(0);

  const barCount = Math.floor((Dimensions.get('window').width - 40) / (BAR_WIDTH + BAR_GAP));
  const sampledData = React.useMemo(() => {
    if (waveformData.length >= barCount) {
      const step = waveformData.length / barCount;
      return Array.from({ length: barCount }, (_, i) =>
        waveformData[Math.floor(i * step)] || 0
      );
    }
    return Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.1);
  }, [waveformData, barCount]);

  const progressX = (Dimensions.get('window').width - 40) * progress;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const x = evt.nativeEvent.locationX;
        const newProgress = Math.max(0, Math.min(1, x / (Dimensions.get('window').width - 40)));
        onSeek(newProgress);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const newProgress = Math.max(0, Math.min(1, x / (Dimensions.get('window').width - 40)));
        onSeek(newProgress);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTime = progress * duration;

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      <View
        ref={containerRef}
        style={styles.waveformContainer}
        {...panResponder.panHandlers}
      >
        <View style={styles.barsContainer}>
          {sampledData.map((value, i) => {
            const barProgress = i / sampledData.length;
            const isPast = barProgress <= progress;
            const barHeight = Math.max(4, value * WAVEFORM_HEIGHT);
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isPast ? accentColor : 'rgba(255,255,255,0.2)',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Playhead */}
        <View style={[styles.playhead, { left: progressX }]}>
          <View style={[styles.playheadDot, { backgroundColor: accentColor }]} />
          <View style={[styles.playheadLine, { backgroundColor: accentColor }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  waveformContainer: {
    height: WAVEFORM_HEIGHT,
    position: 'relative',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: WAVEFORM_HEIGHT,
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 1.5,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    alignItems: 'center',
  },
  playheadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: -4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playheadLine: {
    width: 2,
    flex: 1,
    opacity: 0.5,
  },
});
