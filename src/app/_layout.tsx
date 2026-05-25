import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';
import { useUIStore } from '../stores/useUIStore';
import { useLibrary } from '../stores/useLibraryStore';
import { useAudioStore } from '../stores/useAudioStore';
import { useAIStore } from '../stores/useAIStore';
import { setupAudioService } from '../services/AudioService';
import { MINI_PLAYER_HEIGHT, TAB_BAR_HEIGHT } from '../utils/constants';

function NotificationToast() {
  const { notifications, dismissNotification } = useUIStore();
  const { accentColor } = useTheme();

  if (notifications.length === 0) return null;

  const notification = notifications[0];

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return accentColor;
    }
  };

  return (
    <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.toastText}>{notification.message}</Text>
      <Pressable onPress={() => dismissNotification(notification.id)}>
        <Text style={styles.toastClose}>✕</Text>
      </Pressable>
    </View>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const { refreshLibrary } = useLibrary();
  const { apiKey, setApiKey } = useAIStore();
  const { refreshLibrary: loadSettings } = useLibrary();

  useEffect(() => {
    const init = async () => {
      await setupAudioService();
      refreshLibrary();
      loadSettings();
    };
    init();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_bottom',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="track-detail"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="ai-pipeline"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <NotificationToast />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  toastClose: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    opacity: 0.8,
  },
});
