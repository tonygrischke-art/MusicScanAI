/**
 * MoodCanvas Component - 2D Visual Interface
 * Interactive mood space with draggable start/end points
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Text,
} from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { MoodCoordinate, MOOD_PRESETS } from '../types/journey';

interface MoodCanvasProps {
  startMood: MoodCoordinate;
  endMood: MoodCoordinate;
  onStartMoodChange: (mood: MoodCoordinate) => void;
  onEndMoodChange: (mood: MoodCoordinate) => void;
  width?: number;
  height?: number;
}

export const MoodCanvas: React.FC<MoodCanvasProps> = ({
  startMood,
  endMood,
  onStartMoodChange,
  onEndMoodChange,
  width = 320,
  height = 320,
}) => {
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  
  // Convert mood coordinates to canvas position
  const moodToPosition = (mood: MoodCoordinate) => ({
    x: mood.valence * width,
    y: (1 - mood.energy) * height,  // Invert Y axis (higher energy = top)
  });

  const positionToMood = (x: number, y: number): MoodCoordinate => {
    const valence = Math.min(1, Math.max(0, x / width));
    const energy = Math.min(1, Math.max(0, 1 - y / height));
    return {
      valence,
      energy,
      label: getMoodLabel(valence, energy),
    };
  };

  const getMoodLabel = (valence: number, energy: number): string => {
    if (energy > 0.7) {
      if (valence > 0.7) return 'Euphoric';
      if (valence > 0.4) return 'Energetic';
      return 'Aggressive';
    } else if (energy > 0.4) {
      if (valence > 0.7) return 'Happy';
      if (valence > 0.4) return 'Focused';
      return 'Anxious';
    } else {
      if (valence > 0.7) return 'Peaceful';
      if (valence > 0.4) return 'Chill';
      return 'Melancholic';
    }
  };

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        const start = moodToPosition(startMood);
        const end = moodToPosition(endMood);

        // Determine which point is closer
        const distToStart = Math.hypot(locationX - start.x, locationY - start.y);
        const distToEnd = Math.hypot(locationX - end.x, locationY - end.y);

        setDragging(distToStart < distToEnd ? 'start' : 'end');
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (!dragging) return;

        const { moveX, moveY } = gestureState;
        const mood = positionToMood(moveX, moveY);

        if (dragging === 'start') {
          onStartMoodChange(mood);
        } else {
          onEndMoodChange(mood);
        }
      },
      onPanResponderRelease: () => {
        setDragging(null);
      },
    })
  ).current;

  const start = moodToPosition(startMood);
  const end = moodToPosition(endMood);

  // Generate bezier curve path
  const generateCurvePath = () => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2 - 50; // Curve upward
    
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  return (
    <View style={styles.container}>
      <View style={{ width, height }} {...panResponder.panHandlers}>
        <Svg width={width} height={height}>
          {/* Background quadrants */}
          <Path
            d={`M 0 0 L ${width / 2} 0 L ${width / 2} ${height / 2} L 0 ${height / 2} Z`}
            fill="rgba(239, 68, 68, 0.1)"
          />
          <Path
            d={`M ${width / 2} 0 L ${width} 0 L ${width} ${height / 2} L ${width / 2} ${height / 2} Z`}
            fill="rgba(34, 197, 94, 0.1)"
          />
          <Path
            d={`M 0 ${height / 2} L ${width / 2} ${height / 2} L ${width / 2} ${height} L 0 ${height} Z`}
            fill="rgba(59, 130, 246, 0.1)"
          />
          <Path
            d={`M ${width / 2} ${height / 2} L ${width} ${height / 2} L ${width} ${height} L ${width / 2} ${height} Z`}
            fill="rgba(251, 146, 60, 0.1)"
          />

          {/* Axis lines */}
          <Line
            x1={width / 2}
            y1={0}
            x2={width / 2}
            y2={height}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          <Line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="5,5"
          />

          {/* Labels */}
          <SvgText x={width - 40} y={height / 2 - 10} fill="#6B7280" fontSize="12">
            Happy
          </SvgText>
          <SvgText x={10} y={height / 2 - 10} fill="#6B7280" fontSize="12">
            Sad
          </SvgText>
          <SvgText x={width / 2 + 10} y={20} fill="#6B7280" fontSize="12">
            High Energy
          </SvgText>
          <SvgText x={width / 2 + 10} y={height - 10} fill="#6B7280" fontSize="12">
            Low Energy
          </SvgText>

          {/* Journey curve */}
          <Path
            d={generateCurvePath()}
            stroke="#8B5CF6"
            strokeWidth="3"
            fill="none"
            strokeDasharray={dragging ? 'none' : '10,5'}
          />

          {/* Start point */}
          <Circle
            cx={start.x}
            cy={start.y}
            r={dragging === 'start' ? 20 : 15}
            fill="#3B82F6"
            stroke="#fff"
            strokeWidth="3"
          />
          <SvgText
            x={start.x}
            y={start.y - 25}
            fill="#3B82F6"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            {startMood.label}
          </SvgText>

          {/* End point */}
          <Circle
            cx={end.x}
            cy={end.y}
            r={dragging === 'end' ? 20 : 15}
            fill="#EF4444"
            stroke="#fff"
            strokeWidth="3"
          />
          <SvgText
            x={end.x}
            y={end.y - 25}
            fill="#EF4444"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            {endMood.label}
          </SvgText>
        </Svg>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Start</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>End</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#6B7280',
    fontSize: 12,
  },
});