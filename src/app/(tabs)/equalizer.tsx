import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Equalizer } from '../../components/Equalizer';
import { useTheme } from '../../components/ThemeProvider';
import { TAB_BAR_HEIGHT } from '../../utils/constants';

export default function EqualizerTab() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Equalizer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: TAB_BAR_HEIGHT,
  },
});
