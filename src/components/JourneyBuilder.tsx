/**
 * JourneyBuilder Component - Main User Flow
 * Complete interface for creating dream playlists
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useDreamPlaylist } from '../hooks/useDreamPlaylist';
import { MoodCanvas } from './MoodCanvas';
import { MOOD_PRESETS, JOURNEY_TEMPLATES, DreamJourney } from '../types/journey';
import { Track } from '../types';

interface JourneyBuilderProps {
  library: Track[];
  onJourneyCreated: (journey: DreamJourney) => void;
  onCancel: () => void;
}

export const JourneyBuilder: React.FC<JourneyBuilderProps> = ({
  library,
  onJourneyCreated,
  onCancel,
}) => {
  const {
    isGenerating,
    error,
    currentJourney,
    startMood,
    endMood,
    duration,
    libraryOnly,
    discoveryRatio,
    setStartMood,
    setEndMood,
    setDuration,
    setLibraryOnly,
    setDiscoveryRatio,
    generateJourney,
    clearError,
    applyTemplate,
  } = useDreamPlaylist();

  const [journeyName, setJourneyName] = useState('');

  const handleGenerate = async () => {
    if (library.length === 0) {
      Alert.alert('Empty Library', 'You need tracks in your library to create a journey.');
      return;
    }

    await generateJourney(library);
    
    // Navigate to player on success
    if (!error && currentJourney) {
      onJourneyCreated(currentJourney);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Dream Playlist</Text>
        <Text style={styles.subtitle}>
          Craft an emotional journey from one mood to another
        </Text>
      </View>

      {/* Templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Templates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {JOURNEY_TEMPLATES.map(template => (
            <TouchableOpacity
              key={template.id}
              style={[styles.templateCard, { borderColor: template.color }]}
              onPress={() => applyTemplate(template.id)}
            >
              <Text style={styles.templateIcon}>{template.icon}</Text>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateDesc}>{template.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Mood Canvas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emotional Journey</Text>
        <Text style={styles.sectionDesc}>
          Drag the points to set your starting and ending moods
        </Text>
        <MoodCanvas
          startMood={startMood}
          endMood={endMood}
          onStartMoodChange={setStartMood}
          onEndMoodChange={setEndMood}
        />
      </View>

      {/* Duration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duration</Text>
        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>{duration} minutes</Text>
          <Slider
            style={styles.slider}
            minimumValue={15}
            maximumValue={240}
            step={15}
            value={duration}
            onValueChange={setDuration}
            minimumTrackTintColor="#8B5CF6"
            maximumTrackTintColor="#374151"
          />
          <View style={styles.durationLabels}>
            <Text style={styles.durationEndpoint}>15m</Text>
            <Text style={styles.durationEndpoint}>4h</Text>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Library Only</Text>
            <Text style={styles.preferenceDesc}>
              Use only tracks from your device
            </Text>
          </View>
          <Switch
            value={libraryOnly}
            onValueChange={setLibraryOnly}
            trackColor={{ false: '#374151', true: '#8B5CF6' }}
          />
        </View>

        {!libraryOnly && (
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Discovery Ratio</Text>
              <Text style={styles.preferenceDesc}>
                {Math.round(discoveryRatio * 100)}% new tracks
              </Text>
            </View>
            <Slider
              style={styles.smallSlider}
              minimumValue={0}
              maximumValue={1}
              step={0.1}
              value={discoveryRatio}
              onValueChange={setDiscoveryRatio}
              minimumTrackTintColor="#8B5CF6"
              maximumTrackTintColor="#374151"
            />
          </View>
        )}
      </View>

      {/* Journey Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Morning Motivation"
          placeholderTextColor="#6B7280"
          value={journeyName}
          onChangeText={setJourneyName}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={isGenerating}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.generateButton, isGenerating && styles.disabledButton]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Journey</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 15,
  },
  templateCard: {
    width: 140,
    padding: 15,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1F2937',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  durationContainer: {
    marginTop: 10,
  },
  durationLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  smallSlider: {
    width: 120,
    height: 40,
  },
  durationLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationEndpoint: {
    fontSize: 12,
    color: '#6B7280',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 15,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#F9FAFB',
    marginBottom: 2,
  },
  preferenceDesc: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#374151',
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FCA5A5',
    flex: 1,
  },
  errorDismiss: {
    color: '#F9FAFB',
    marginLeft: 10,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  cancelButtonText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#8B5CF6',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});