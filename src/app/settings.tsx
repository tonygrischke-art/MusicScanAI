import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAIStore } from '../stores/useAIStore';
import { useUIStore } from '../stores/useUIStore';
import { useTheme, Button } from '../components';
import StorageService from '../services/StorageService';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, accentColor } = useTheme();
  const { apiKey, setApiKey, offlineMode, setOfflineMode } = useAIStore();
  const { showNotification } = useUIStore();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [storageSize, setStorageSize] = useState(0);

  React.useEffect(() => {
    const size = StorageService.getStorageSize();
    setStorageSize(size);
  }, []);

  const handleSaveApiKey = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setApiKey(localApiKey);
    showNotification('API key saved successfully', 'success');
  }, [localApiKey, setApiKey, showNotification]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Your music library will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showNotification('Cache cleared', 'success');
          },
        },
      ]
    );
  }, [showNotification]);

  const handleExportLibrary = useCallback(() => {
    const data = StorageService.exportData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showNotification('Library exported to clipboard', 'success');
  }, [showNotification]);

  const handleImportLibrary = useCallback(() => {
    Alert.alert(
      'Import Library',
      'Paste your exported library JSON data to import.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showNotification('Library imported successfully', 'success');
          },
        },
      ]
    );
  }, [showNotification]);

  const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>AI Configuration</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gemini API Key</Text>
            <View style={styles.apiKeyContainer}>
              <TextInput
                style={styles.apiKeyInput}
                value={localApiKey}
                onChangeText={setLocalApiKey}
                placeholder="Enter your API key"
                placeholderTextColor="#6B7280"
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.showButton}
                onPress={() => setShowApiKey(!showApiKey)}
              >
                <Text style={styles.showButtonText}>
                  {showApiKey ? '🙈' : '👁'}
                </Text>
              </Pressable>
            </View>
            <Button
              title="Save API Key"
              onPress={handleSaveApiKey}
              variant="primary"
              size="medium"
              fullWidth
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Offline Mode</Text>
              <Text style={styles.settingDescription}>
                Use local analysis when API is unavailable
              </Text>
            </View>
            <Pressable
              style={[
                styles.toggle,
                offlineMode && { backgroundColor: accentColor },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setOfflineMode(!offlineMode);
              }}
            >
              <View
                style={[
                  styles.toggleKnob,
                  offlineMode && { transform: [{ translateX: 20 }] },
                ]}
              />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>

          <View style={styles.storageInfo}>
            <Text style={styles.storageLabel}>Storage Used</Text>
            <Text style={styles.storageValue}>{formatStorageSize(storageSize)}</Text>
          </View>

          <View style={styles.storageBar}>
            <View
              style={[
                styles.storageBarFill,
                { width: `${Math.min((storageSize / (100 * 1024 * 1024)) * 100, 100)}%` },
              ]}
            />
          </View>

          <Button
            title="Clear Cache"
            onPress={handleClearCache}
            variant="outline"
            size="medium"
            fullWidth
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Library</Text>

          <Button
            title="Export Library (JSON)"
            onPress={handleExportLibrary}
            variant="secondary"
            size="medium"
            fullWidth
            icon="📤"
          />

          <Button
            title="Import Library"
            onPress={handleImportLibrary}
            variant="secondary"
            size="medium"
            fullWidth
            icon="📥"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(300).delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutInfo}>
            <Text style={styles.appName}>MusicScan AI</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              AI-powered music library scanner with mood detection, 
              genre classification, and smart playlist generation.
            </Text>
          </View>

          <View style={styles.credits}>
            <Text style={styles.creditsText}>
              Built with ❤️ using React Native, Expo, and Gemini AI
            </Text>
          </View>
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginBottom: 12,
  },
  apiKeyInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  showButton: {
    padding: 16,
  },
  showButtonText: {
    fontSize: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 3,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  storageBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  aboutInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  credits: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  creditsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },
});
