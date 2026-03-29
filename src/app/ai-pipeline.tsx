import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAI } from '../hooks/useAI';
import { useLibrary } from '../hooks/useLibrary';
import { useTheme, Button } from '../components';

export default function AIPipelineScreen() {
  const router = useRouter();
  const { theme, accentColor } = useTheme();
  const {
    isAnalyzing,
    progress,
    activityLog,
    runAnalysis,
    cancelAnalysis,
    checkDuplicates,
    clearLog,
  } = useAI();
  const { tracks } = useLibrary();

  const handleRunAnalysis = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await runAnalysis();
  };

  const handleCheckDuplicates = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await checkDuplicates();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelAnalysis();
  };

  const handleClose = () => {
    if (!isAnalyzing) {
      router.back();
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.title}>AI Pipeline</Text>
        <Pressable
          style={[styles.closeButton, isAnalyzing && styles.closeButtonDisabled]}
          onPress={handleClose}
          disabled={isAnalyzing}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {isAnalyzing ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.progressSection}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{Math.round(progress.progress)}%</Text>
            </View>
            <Text style={styles.progressLabel}>{progress.currentStep}</Text>
            <Text style={styles.progressSubLabel}>
              {progress.analyzedTracks} of {progress.totalTracks} tracks analyzed
            </Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress.progress}%`, backgroundColor: accentColor },
                ]}
              />
            </View>

            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="outline"
              size="medium"
              fullWidth
            />
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInUp.duration(300)} style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Analysis Options</Text>

              <View style={styles.actionCard}>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Full Analysis</Text>
                  <Text style={styles.actionDescription}>
                    Analyze all tracks for mood, genre, and audio features.
                  </Text>
                  <Text style={styles.actionMeta}>{tracks.length} tracks available</Text>
                </View>
                <Button
                  title="Start"
                  onPress={handleRunAnalysis}
                  variant="primary"
                  size="small"
                />
              </View>

              <View style={styles.actionCard}>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Duplicate Detection</Text>
                  <Text style={styles.actionDescription}>
                    Find potential duplicate tracks in your library.
                  </Text>
                </View>
                <Button
                  title="Run"
                  onPress={handleCheckDuplicates}
                  variant="secondary"
                  size="small"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(300).delay(100)} style={styles.logSection}>
              <View style={styles.logHeader}>
                <Text style={styles.sectionTitle}>Activity Log</Text>
                {activityLog.length > 0 && (
                  <Pressable onPress={clearLog}>
                    <Text style={[styles.clearLog, { color: accentColor }]}>Clear</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView style={styles.logContainer} showsVerticalScrollIndicator={false}>
                {activityLog.length === 0 ? (
                  <Text style={styles.emptyLog}>No activity yet. Start an analysis to see logs.</Text>
                ) : (
                  activityLog.map((entry, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeIn.duration(200)}
                      style={styles.logEntry}
                    >
                      <Text style={styles.logTime}>{formatTime(entry.timestamp)}</Text>
                      <Text style={styles.logIcon}>{getLogIcon(entry.type)}</Text>
                      <Text style={styles.logMessage}>{entry.message}</Text>
                    </Animated.View>
                  ))
                )}
              </ScrollView>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(300).delay(200)} style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>Tips</Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>
                  AI analysis works best with accurate Gemini API key. Without it, 
                  fallback analysis uses audio features only.
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Text style={styles.tipIcon}>⚡</Text>
                <Text style={styles.tipText}>
                  Processing happens in batches of 50 tracks to ensure smooth 
                  performance even with large libraries.
                </Text>
              </View>
            </Animated.View>
          </>
        )}
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  closeIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 4,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressPercentage: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressSubLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  actionInfo: {
    flex: 1,
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  actionMeta: {
    fontSize: 11,
    color: '#6B7280',
  },
  logSection: {
    flex: 1,
    marginBottom: 24,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearLog: {
    fontSize: 14,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    maxHeight: 300,
  },
  emptyLog: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  logTime: {
    fontSize: 11,
    color: '#6B7280',
    minWidth: 50,
  },
  logIcon: {
    fontSize: 12,
  },
  logMessage: {
    flex: 1,
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 18,
  },
  tipsSection: {
    marginBottom: 32,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
});
