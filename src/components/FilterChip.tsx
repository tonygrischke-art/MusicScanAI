import React, { memo } from 'react';
import { Text, Pressable, StyleSheet, ScrollView, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeProvider';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

export const FilterChip: React.FC<FilterChipProps> = memo(({
  label,
  selected,
  onPress,
  color,
}) => {
  const { accentColor } = useTheme();
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, 100);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor = selected
    ? color || accentColor
    : 'rgba(255, 255, 255, 0.08)';

  const borderColor = selected
    ? color || accentColor
    : 'rgba(255, 255, 255, 0.15)';

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.chip,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        <Text style={[
          styles.label,
          { color: selected ? '#FFFFFF' : '#9CA3AF' },
        ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

interface FilterChipGroupProps {
  chips: { label: string; value: string; color?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  scrollable?: boolean;
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = memo(({
  chips,
  selected,
  onToggle,
  scrollable = false,
}) => {
  const content = (
    <>
      {chips.map((chip) => (
        <FilterChip
          key={chip.value}
          label={chip.label}
          selected={selected.includes(chip.value)}
          onPress={() => onToggle(chip.value)}
          color={chip.color}
        />
      ))}
    </>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {chips.map((chip) => (
        <FilterChip
          key={chip.value}
          label={chip.label}
          selected={selected.includes(chip.value)}
          onPress={() => onToggle(chip.value)}
          color={chip.color}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default FilterChip;
