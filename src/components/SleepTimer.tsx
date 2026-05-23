import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAudioStore } from '../stores/useAudioStore';
import { useTheme } from './ThemeProvider';

const TIMER_OPTIONS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
  { label: '90 min', minutes: 90 },
];

interface SleepTimerProps {
  visible: boolean;
  onClose: () => void;
}

export const SleepTimer: React.FC<SleepTimerProps> = ({ visible, onClose }) => {
  const { theme, accentColor } = useTheme();
  const { sleepTimerRemaining, setSleepTimer, isPlaying } = useAudioStore();
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      useAudioStore.getState().updateSleepTimerRemaining();
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleSetTimer = useCallback((minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSleepTimer(minutes);
    setSelectedMinutes(minutes);
    onClose();
  }, [setSleepTimer, onClose]);

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSleepTimer(null);
    setSelectedMinutes(null);
    onClose();
  }, [setSleepTimer, onClose]);

  const formatRemaining = (seconds: number | null) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={60} tint="dark" style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Sleep Timer</Text>

          {sleepTimerRemaining !== null && (
            <View style={styles.activeTimer}>
              <Text style={[styles.remaining, { color: accentColor }]}>
                {formatRemaining(sleepTimerRemaining)} remaining
              </Text>
              <Pressable onPress={handleCancel} style={[styles.cancelBtn, { backgroundColor: '#FF444430' }]}>
                <Text style={{ color: '#FF4444', fontWeight: '700' }}>Cancel Timer</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.options}>
            {TIMER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.minutes}
                onPress={() => handleSetTimer(opt.minutes)}
                style={[
                  styles.option,
                  selectedMinutes === opt.minutes && { backgroundColor: accentColor + '30', borderColor: accentColor },
                ]}
              >
                <Text style={[styles.optionText, { color: selectedMinutes === opt.minutes ? accentColor : theme.text }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={{ color: theme.textSecondary }}>Close</Text>
          </Pressable>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 300,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  activeTimer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  remaining: {
    fontSize: 24,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  options: {
    gap: 8,
    marginBottom: 16,
  },
  option: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
