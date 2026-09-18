/**
 * useDreamPlaylist Hook - React State Management
 * Manages dream playlist generation and playback
 */

import { useState, useCallback, useEffect } from 'react';
import { useJourneyStore } from '../store/journeyStore';
import { JourneyRequest, MoodCoordinate, Track, DreamJourney } from '../types/journey';
import { MOOD_PRESETS, JOURNEY_TEMPLATES } from '../types/journey';

interface UseDreamPlaylistReturn {
  // State
  isGenerating: boolean;
  error: string | null;
  currentJourney: DreamJourney | null;
  
  // Builder state
  startMood: MoodCoordinate;
  endMood: MoodCoordinate;
  duration: number;
  libraryOnly: boolean;
  discoveryRatio: number;
  
  // Actions
  setStartMood: (mood: MoodCoordinate) => void;
  setEndMood: (mood: MoodCoordinate) => void;
  setDuration: (minutes: number) => void;
  setLibraryOnly: (value: boolean) => void;
  setDiscoveryRatio: (ratio: number) => void;
  generateJourney: (library: Track[]) => Promise<void>;
  clearError: () => void;
  resetBuilder: () => void;
  
  // Templates
  applyTemplate: (templateId: string) => void;
}

export function useDreamPlaylist(): UseDreamPlaylistReturn {
  const {
    isGenerating,
    error,
    currentJourney,
    generateJourney: storeGenerateJourney,
    clearError: storeClearError,
  } = useJourneyStore();

  // Builder state
  const [startMood, setStartMood] = useState<MoodCoordinate>(MOOD_PRESETS.chill);
  const [endMood, setEndMood] = useState<MoodCoordinate>(MOOD_PRESETS.euphoric);
  const [duration, setDuration] = useState(45);
  const [libraryOnly, setLibraryOnly] = useState(true);
  const [discoveryRatio, setDiscoveryRatio] = useState(0.2);

  const generateJourney = useCallback(async (library: Track[]) => {
    const request: JourneyRequest = {
      start: startMood,
      end: endMood,
      durationMinutes: duration,
      preferences: {
        libraryOnly,
        discoveryRatio,
        excludedGenres: [],
        maxBPMDelta: 30,
        minConfidence: 0.6,
      },
    };

    await storeGenerateJourney(library, request);
  }, [startMood, endMood, duration, libraryOnly, discoveryRatio, storeGenerateJourney]);

  const clearError = useCallback(() => {
    storeClearError();
  }, [storeClearError]);

  const resetBuilder = useCallback(() => {
    setStartMood(MOOD_PRESETS.chill);
    setEndMood(MOOD_PRESETS.euphoric);
    setDuration(45);
    setLibraryOnly(true);
    setDiscoveryRatio(0.2);
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    const template = JOURNEY_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setStartMood(template.start);
      setEndMood(template.end);
    }
  }, []);

  return {
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
    resetBuilder,
    applyTemplate,
  };
}