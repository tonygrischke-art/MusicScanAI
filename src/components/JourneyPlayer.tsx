/**
 * JourneyPlayer Component - Playback Experience
 * Visual journey progress with mood curve and track list
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { DreamJourney, JourneyTrack, MoodCoordinate } from '../types/journey';
import Svg, { Path, Circle, Line } from 'react-native-svg';

interface JourneyPlayerProps {
  journey: DreamJourney;
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
  onBack: () => void;
  isPlaying: boolean;
}

export const JourneyPlayer: React.FC<JourneyPlayerProps> = ({
  journey,
  currentTrackIndex,
  onTrackSelect,
  onBack,
  isPlaying,
}) => {
  const [progress, setProgress] = useState(0);

  // Calculate overall journey progress
  useEffect(() => {
    if (journey.tracks.length === 0) return;
    setProgress(currentTrackIndex / journey.tracks.length);
  }, [currentTrackIndex, journey.tracks.length]);

  // Generate curve path for visualization
  const generateCurvePath = () => {
    if (journey.tracks.length === 0) return '';
    
    const points = journey.tracks.map((jt, i) => {
      const x = jt.moodAtPoint.valence * 300;
      const y = (1 - jt.moodAtPoint.energy) * 200;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    return points.join(' ');
  };

  const renderTrack = ({ item, index }: { item: JourneyTrack; index: number }) => {
    const isCurrentTrack = index === currentTrackIndex;
    const isPastTrack = index < currentTrackIndex;

    return (
      <TouchableOpacity
        style={[
          styles.trackItem,
          isCurrentTrack && styles.currentTrack,
          isPastTrack && styles.pastTrack,
        ]}
        onPress={() => onTrackSelect(index)}
      >
        <View style={styles.trackNumber}>
          <Text style={[
            styles.trackNumberText,
            isCurrentTrack && styles.currentTrackText,
          ]}>
            {index + 1}
          </Text>
        </View>

        <View style={styles.trackInfo}>
          <Text style={[
            styles.trackTitle,
            isCurrentTrack && styles.currentTrackText,
          ]} numberOfLines={1}>
            {item.track.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.track.artist}
          </Text>
        </View>

        <View style={styles.trackMeta}>
          <Text style={[
            styles.moodLabel,
            { color: getMoodColor(item.moodAtPoint) },
          ]}>
            {item.moodAtPoint.label}
          </Text>
          {item.transitionType === 'climax' && (
            <Text style={styles.climaxBadge}>⚡</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getMoodColor = (mood: MoodCoordinate): string => {
    // Color gradient based on mood position
    const hue = mood.valence * 120; // 0-120 (red to green)
    const saturation = mood.energy * 100;
    return `hsl(${hue}, ${saturation}%, 60%)`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.journeyName}>{journey.name}</Text>
          <Text style={styles.journeyMeta}>
            {journey.tracks.length} tracks • {journey.request.durationMinutes}min
          </Text>
        </View>
      </View>

      {/* Journey Visualization */}
      <View style={styles.visualization}>
        <Svg width={300} height={200}>
          {/* Background grid */}
          <Line x1={150} y1={0} x2={150} y2={200} stroke="#374151" strokeWidth="1" />
          <Line x1={0} y1={100} x2={300} y2={100} stroke="#374151" strokeWidth="1" />

          {/* Journey path */}
          <Path
            d={generateCurvePath()}
            stroke="#8B5CF6"
            strokeWidth="3"
            fill="none"
          />

          {/* Progress indicator */}
          {journey.tracks.length > 0 && journey.tracks[currentTrackIndex] && (
            <Circle
              cx={journey.tracks[currentTrackIndex].moodAtPoint.valence * 300}
              cy={(1 - journey.tracks[currentTrackIndex].moodAtPoint.energy) * 200}
              r={8}
              fill="#F9FAFB"
              stroke="#8B5CF6"
              strokeWidth="3"
            />
          )}
        </Svg>

        <View style={styles.progressLabels}>
          <Text style={styles.startLabel}>{journey.request.start.label}</Text>
          <Text style={styles.endLabel}>{journey.request.end.label}</Text>
        </View>
      </View>

      {/* Current Track Banner */}
      {journey.tracks[currentTrackIndex] && (
        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingLabel}>
            {isPlaying ? '▶ Now Playing' : '⏸ Paused'}
          </Text>
          <Text style={styles.nowPlayingTitle}>
            {journey.tracks[currentTrackIndex].track.title}
          </Text>
          <Text style={styles.nowPlayingArtist}>
            {journey.tracks[currentTrackIndex].track.artist}
          </Text>
        </View>
      )}

      {/* Track List */}
      <FlatList
        data={journey.tracks}
        renderItem={renderTrack}
        keyExtractor={(item, index) => `${item.track.id}-${index}`}
        style={styles.trackList}
        contentContainerStyle={styles.trackListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
  },
  journeyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  journeyMeta: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  visualization: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    marginTop: 10,
  },
  startLabel: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  endLabel: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  nowPlaying: {
    backgroundColor: '#1F2937',
    padding: 15,
    margin: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  nowPlayingLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    marginBottom: 5,
  },
  nowPlayingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  nowPlayingArtist: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  trackList: {
    flex: 1,
  },
  trackListContent: {
    padding: 20,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  currentTrack: {
    backgroundColor: '#2D1B69',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  pastTrack: {
    opacity: 0.5,
  },
  trackNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackNumberText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  currentTrackText: {
    color: '#F9FAFB',
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 16,
    color: '#F9FAFB',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  trackMeta: {
    alignItems: 'flex-end',
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  climaxBadge: {
    fontSize: 16,
    marginTop: 4,
  },
});