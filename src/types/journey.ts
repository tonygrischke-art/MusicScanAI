/**
 * Dream Playlist Generator - Type Definitions
 * MusicScanAI - Emotional Journey Engine
 */

import { Track as BaseTrack } from './index';

export interface MoodCoordinate {
  valence: number;  // 0-1 (sad → happy)
  energy: number;   // 0-1 (calm → intense)
  label: string;    // "melancholic", "euphoric", etc.
}

export interface JourneyRequest {
  start: MoodCoordinate;
  end: MoodCoordinate;
  waypoints?: MoodCoordinate[];  // Optional middle points
  durationMinutes: number;
  preferences: {
    libraryOnly: boolean;
    discoveryRatio: number;      // 0 = all familiar, 1 = all new
    excludedGenres: string[];
    maxBPMDelta?: number;        // Max BPM jump between tracks
    minConfidence?: number;      // Minimum mood confidence
  };
}

export interface JourneyTrack {
  track: Track;
  position: number;              // 0-1 along curve
  moodAtPoint: MoodCoordinate;
  transitionType: 'smooth' | 'step' | 'climax';
  bpmTarget: number;
  keySignature?: string;         // Camelot wheel notation
}

export interface DreamJourney {
  id: string;
  name: string;
  request: JourneyRequest;
  tracks: JourneyTrack[];
  createdAt: number;
  playCount: number;
  rating?: number;
  lastPlayedAt?: number;
}

export interface Track extends BaseTrack {
  // Extended with mood coordinates for journey generation
  moodCoordinate?: MoodCoordinate;
}

export interface JourneyTemplate {
  id: string;
  name: string;
  description: string;
  start: MoodCoordinate;
  end: MoodCoordinate;
  waypoints?: MoodCoordinate[];
  icon: string;
  color: string;
}

// Predefined mood coordinates
export const MOOD_PRESETS: Record<string, MoodCoordinate> = {
  melancholic: { valence: 0.25, energy: 0.2, label: 'Melancholic' },
  chill:       { valence: 0.65, energy: 0.25, label: 'Chill' },
  peaceful:    { valence: 0.7, energy: 0.15, label: 'Peaceful' },
  happy:       { valence: 0.8, energy: 0.6, label: 'Happy' },
  euphoric:    { valence: 0.9, energy: 0.9, label: 'Euphoric' },
  energetic:   { valence: 0.7, energy: 0.85, label: 'Energetic' },
  aggressive:  { valence: 0.3, energy: 0.9, label: 'Aggressive' },
  anxious:     { valence: 0.3, energy: 0.6, label: 'Anxious' },
  focused:     { valence: 0.5, energy: 0.4, label: 'Focused' },
  romantic:    { valence: 0.75, energy: 0.35, label: 'Romantic' },
};

// Curated journey templates
export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    id: 'heartbreak-healing',
    name: 'Heartbreak → Healing',
    description: 'From sorrow to self-love',
    start: MOOD_PRESETS.melancholic,
    end: MOOD_PRESETS.peaceful,
    icon: '💔',
    color: '#8B5CF6',
  },
  {
    id: 'slump-hype',
    name: 'Slump → Hype',
    description: 'Zero to hero energy',
    start: MOOD_PRESETS.chill,
    end: MOOD_PRESETS.euphoric,
    icon: '🔥',
    color: '#F59E0B',
  },
  {
    id: 'chaos-focus',
    name: 'Chaos → Focus',
    description: 'Anxious mind to flow state',
    start: MOOD_PRESETS.anxious,
    end: MOOD_PRESETS.focused,
    icon: '🧘',
    color: '#10B981',
  },
  {
    id: 'sunset-drive',
    name: 'Sunset Drive',
    description: 'Golden hour to midnight',
    start: MOOD_PRESETS.happy,
    end: MOOD_PRESETS.melancholic,
    waypoints: [MOOD_PRESETS.chill],
    icon: '🌅',
    color: '#F97316',
  },
  {
    id: 'heros-journey',
    name: "Hero's Journey",
    description: 'Ordinary to triumphant',
    start: MOOD_PRESETS.peaceful,
    end: MOOD_PRESETS.euphoric,
    waypoints: [MOOD_PRESETS.anxious, MOOD_PRESETS.aggressive],
    icon: '⚔️',
    color: '#EF4444',
  },
];