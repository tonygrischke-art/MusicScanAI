import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from './ThemeProvider';

interface WaveformVisualizerProps {
  data: number[];
  progress: number;
  isPlaying: boolean;
  height?: number;
  barWidth?: number;
  barGap?: number;
  style?: object;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = memo(({
  data,
  progress,
  isPlaying,
  height = 60,
  barWidth = 3,
  barGap = 2,
  style,
}) => {
  const { accentColor } = useTheme();
  const activeIndex = Math.floor((progress / 100) * data.length);

  return (
    <View style={[styles.container, { height }, style]}>
      {data.map((value, index) => (
        <WaveformBar
          key={index}
          value={value}
          index={index}
          height={height}
          barWidth={barWidth}
          isActive={index <= activeIndex}
          isPlaying={isPlaying}
          accentColor={accentColor}
        />
      ))}
    </View>
  );
});

interface WaveformBarProps {
  value: number;
  index: number;
  height: number;
  barWidth: number;
  isActive: boolean;
  isPlaying: boolean;
  accentColor: string;
}

const WaveformBar = memo(({
  value,
  index,
  height,
  barWidth,
  isActive,
  isPlaying,
  accentColor,
}: WaveformBarProps) => {
  const animatedHeight = useSharedValue(value * height);

  useEffect(() => {
    if (isPlaying) {
      animatedHeight.value = withRepeat(
        withSequence(
          withTiming(value * height * (0.7 + Math.random() * 0.3), {
            duration: 150 + index * 10,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(value * height * (0.5 + Math.random() * 0.5), {
            duration: 150 + index * 10,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      );
    } else {
      animatedHeight.value = withTiming(value * height, { duration: 300 });
    }
  }, [isPlaying, value, height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          width: barWidth,
          backgroundColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.2)',
          borderRadius: barWidth / 2,
        },
        animatedStyle,
      ]}
    />
  );
});

interface ProgressBarProps {
  progress: number;
  duration: number;
  waveformData: number[];
  onSeek?: (position: number) => void;
  height?: number;
}

export const WaveformProgressBar: React.FC<ProgressBarProps> = memo(({
  progress,
  duration,
  waveformData,
  onSeek,
  height = 60,
}) => {
  const { accentColor } = useTheme();
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <View style={[styles.progressContainer, { height }]}>
      <WaveformVisualizer
        data={waveformData}
        progress={progressPercent}
        isPlaying={false}
        height={height}
        style={styles.waveform}
      />
      <View
        style={[
          styles.progressOverlay,
          {
            width: `${progressPercent}%`,
            backgroundColor: accentColor + '40',
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    minHeight: 4,
  },
  progressContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
  },
  waveform: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});

export default WaveformVisualizer;
