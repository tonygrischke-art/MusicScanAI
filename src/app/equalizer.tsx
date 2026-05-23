import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Equalizer } from '../components/Equalizer';
import { useTheme } from '../components/ThemeProvider';
import { TAB_BAR_HEIGHT } from '../utils/constants';

export default function EqualizerScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
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
