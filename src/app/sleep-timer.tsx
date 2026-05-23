import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SleepTimer } from '../components/SleepTimer';
import { useTheme } from '../components/ThemeProvider';
import { useAudioStore } from '../stores/useAudioStore';
import { TAB_BAR_HEIGHT } from '../utils/constants';

export default function SleepTimerScreen() {
  const { theme, accentColor } = useTheme();
  const { sleepTimerRemaining } = useAudioStore();
  const [showTimer, setShowTimer] = useState(true);

  const formatRemaining = (seconds: number | null) => {
    if (!seconds) return 'No timer set';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')} remaining`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Sleep Timer</Text>
      </View>

      <View style={styles.content}>
        {sleepTimerRemaining !== null ? (
          <View style={[styles.activeCard, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.remaining, { color: accentColor }]}>
              {formatRemaining(sleepTimerRemaining)}
            </Text>
            <Text style={[styles.sublabel, { color: theme.textSecondary }]}>
              Music will fade out and stop
            </Text>
          </View>
        ) : (
          <View style={styles.inactiveCard}>
            <Text style={[styles.inactiveText, { color: theme.textSecondary }]}>
              No sleep timer active
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setShowTimer(true)}
          style={[styles.setBtn, { backgroundColor: accentColor }]}
        >
          <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>
            {sleepTimerRemaining !== null ? 'Change Timer' : 'Set Timer'}
          </Text>
        </Pressable>
      </View>

      <SleepTimer visible={showTimer} onClose={() => setShowTimer(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: TAB_BAR_HEIGHT,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  activeCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  remaining: {
    fontSize: 36,
    fontWeight: '800',
  },
  sublabel: {
    fontSize: 14,
  },
  inactiveCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inactiveText: {
    fontSize: 16,
  },
  setBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
});
