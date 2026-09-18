/**
 * Mood Engine - Core Mathematical Operations
 * Bezier curves, interpolation, and mood space calculations
 */

import { MoodCoordinate, Track, JourneyRequest, JourneyTrack, DreamJourney } from '../types/journey';

// Re-export types for consumers
export type { MoodCoordinate, Track, JourneyRequest, JourneyTrack, DreamJourney };

/**
 * Cubic Bezier curve interpolation
 * Creates smooth, natural emotional arcs
 */
export class BezierCurve {
  private p0: MoodCoordinate;
  private p1: MoodCoordinate;  // Control point 1
  private p2: MoodCoordinate;  // Control point 2
  private p3: MoodCoordinate;

  constructor(
    start: MoodCoordinate,
    end: MoodCoordinate,
    waypoints: MoodCoordinate[] = []
  ) {
    this.p0 = start;
    this.p3 = end;

    // Generate control points for natural curve shape
    if (waypoints.length > 0) {
      // Multi-point journey: use waypoints as control points
      this.p1 = waypoints[0];
      this.p2 = waypoints[waypoints.length - 1] || this.generateControlPoint(end, 0.8);
    } else {
      // Simple journey: generate smooth control points
      this.p1 = this.generateControlPoint(start, 0.3);
      this.p2 = this.generateControlPoint(end, 0.7);
    }
  }

  /**
   * Generate control point offset from anchor
   */
  private generateControlPoint(anchor: MoodCoordinate, factor: number): MoodCoordinate {
    return {
      valence: Math.min(1, Math.max(0, anchor.valence + (0.5 - anchor.valence) * 0.2)),
      energy: Math.min(1, Math.max(0, anchor.energy + (factor - 0.5) * 0.3)),
      label: 'control',
    };
  }

  /**
   * Get point on curve at position t (0-1)
   * Uses cubic bezier formula: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
   */
  getPoint(t: number): MoodCoordinate {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const valence =
      uuu * this.p0.valence +
      3 * uu * t * this.p1.valence +
      3 * u * tt * this.p2.valence +
      ttt * this.p3.valence;

    const energy =
      uuu * this.p0.energy +
      3 * uu * t * this.p1.energy +
      3 * u * tt * this.p2.energy +
      ttt * this.p3.energy;

    return {
      valence: Math.min(1, Math.max(0, valence)),
      energy: Math.min(1, Math.max(0, energy)),
      label: this.getMoodLabel(valence, energy),
    };
  }

  /**
   * Get multiple points along curve
   */
  getPoints(count: number): MoodCoordinate[] {
    const points: MoodCoordinate[] = [];
    for (let i = 0; i < count; i++) {
      points.push(this.getPoint(i / (count - 1)));
    }
    return points;
  }

  /**
   * Get tangent (direction) at point t
   * Useful for transition type detection
   */
  getTangent(t: number): { dx: number; dy: number } {
    const u = 1 - t;
    const dx =
      3 * u * u * (this.p1.valence - this.p0.valence) +
      6 * u * t * (this.p2.valence - this.p1.valence) +
      3 * t * t * (this.p3.valence - this.p2.valence);
    const dy =
      3 * u * u * (this.p1.energy - this.p0.energy) +
      6 * u * t * (this.p2.energy - this.p1.energy) +
      3 * t * t * (this.p3.energy - this.p2.energy);
    return { dx, dy };
  }

  /**
   * Detect if point is a climax (steep change)
   */
  isClimax(t: number, threshold: number = 0.5): boolean {
    const tangent = this.getTangent(t);
    const magnitude = Math.sqrt(tangent.dx * tangent.dx + tangent.dy * tangent.dy);
    return magnitude > threshold;
  }

  /**
   * Generate human-readable mood label from coordinates
   */
  private getMoodLabel(valence: number, energy: number): string {
    // Quadrant-based labeling
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
  }
}

/**
 * Calculate Euclidean distance between two mood coordinates
 */
export function moodDistance(a: MoodCoordinate, b: MoodCoordinate): number {
  const dv = a.valence - b.valence;
  const de = a.energy - b.energy;
  return Math.sqrt(dv * dv + de * de);
}

/**
 * Calculate BPM target at position t along curve
 * Interpolates BPM based on energy level
 */
export function calculateBPMTarget(
  t: number,
  startBPM: number,
  endBPM: number,
  curve: BezierCurve
): number {
  const point = curve.getPoint(t);
  // Higher energy = higher BPM (roughly 60-180 range)
  const targetBPM = 60 + point.energy * 120;
  return Math.round(targetBPM);
}

/**
 * Find nearest tracks to mood coordinate
 */
export function findNearestTracks(
  target: MoodCoordinate,
  tracks: Track[],
  count: number = 5,
  maxDistance: number = 0.3
): Track[] {
  return tracks
    .map(track => ({
      track,
      distance: track.moodCoordinate ? moodDistance(target, track.moodCoordinate) : Infinity,
    }))
    .filter(item => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(item => item.track);
}

/**
 * Calculate harmonic compatibility (Camelot wheel)
 */
export function areKeysCompatible(key1: string, key2: string): boolean {
  // Simplified: same key or adjacent on Camelot wheel
  if (key1 === key2) return true;
  
  const camelot1 = keyToCamelot(key1);
  const camelot2 = keyToCamelot(key2);
  
  if (!camelot1 || !camelot2) return true; // Unknown keys = compatible
  
  // Same number or adjacent (±1)
  const diff = Math.abs(camelot1.number - camelot2.number);
  return diff <= 1 || diff === 11; // 11 and 1 are adjacent (wrap around)
}

function keyToCamelot(key: string): { number: number; letter: 'A' | 'B' } | null {
  const map: Record<string, { number: number; letter: 'A' | 'B' }> = {
    'C': { number: 8, letter: 'B' },
    'Am': { number: 8, letter: 'A' },
    'G': { number: 9, letter: 'B' },
    'Em': { number: 9, letter: 'A' },
    'D': { number: 10, letter: 'B' },
    'Bm': { number: 10, letter: 'A' },
    'A': { number: 11, letter: 'B' },
    'F#m': { number: 11, letter: 'A' },
    'E': { number: 12, letter: 'B' },
    'C#m': { number: 12, letter: 'A' },
    'B': { number: 1, letter: 'B' },
    'G#m': { number: 1, letter: 'A' },
    'F#': { number: 2, letter: 'B' },
    'D#m': { number: 2, letter: 'A' },
    'C#': { number: 3, letter: 'B' },
    'A#m': { number: 3, letter: 'A' },
    'G#': { number: 4, letter: 'B' },
    'Fm': { number: 4, letter: 'A' },
    'D#': { number: 5, letter: 'B' },
    'Cm': { number: 5, letter: 'A' },
    'A#': { number: 6, letter: 'B' },
    'Gm': { number: 6, letter: 'A' },
    'F': { number: 7, letter: 'B' },
    'Dm': { number: 7, letter: 'A' },
  };
  return map[key] || null;
}