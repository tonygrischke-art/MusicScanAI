/**
 * Journey Generator - Playlist Construction Algorithm
 * Builds emotional journeys from mood coordinates
 */

import { 
  MoodCoordinate, 
  Track, 
  JourneyRequest, 
  JourneyTrack, 
  DreamJourney,
  BezierCurve,
  moodDistance,
  calculateBPMTarget,
  findNearestTracks,
  areKeysCompatible,
} from '../services/moodEngine';
import { v4 as uuidv4 } from 'uuid';

export class JourneyGenerator {
  private library: Track[];
  private request: JourneyRequest;

  constructor(library: Track[], request: JourneyRequest) {
    this.library = library;
    this.request = request;
  }

  /**
   * Generate complete dream journey
   */
  async generate(): Promise<DreamJourney> {
    // Create bezier curve from request
    const curve = new BezierCurve(
      this.request.start,
      this.request.end,
      this.request.waypoints
    );

    // Calculate number of tracks needed
    const avgTrackDuration = 240; // 4 minutes
    const trackCount = Math.ceil((this.request.durationMinutes * 60) / avgTrackDuration);

    // Sample points along curve
    const curvePoints = curve.getPoints(trackCount);

    // Select tracks for each point
    const journeyTracks = await this.selectTracksForCurve(curvePoints, curve);

    // Optimize sequence (BPM flow, key compatibility)
    const optimizedTracks = this.optimizeSequence(journeyTracks);

    return {
      id: uuidv4(),
      name: this.generateJourneyName(),
      request: this.request,
      tracks: optimizedTracks,
      createdAt: Date.now(),
      playCount: 0,
    };
  }

  /**
   * Select tracks for each point on curve
   */
  private async selectTracksForCurve(
    curvePoints: MoodCoordinate[],
    curve: BezierCurve
  ): Promise<JourneyTrack[]> {
    const selected: JourneyTrack[] = [];
    const usedTrackIds = new Set<string>();

    for (let i = 0; i < curvePoints.length; i++) {
      const point = curvePoints[i];
      const t = i / (curvePoints.length - 1);

      // Find candidate tracks
      const candidates = this.library.filter(track => {
        // Skip already used tracks
        if (usedTrackIds.has(track.id)) return false;

        // Skip excluded genres
        if (this.request.preferences.excludedGenres.includes(track.genre || '')) {
          return false;
        }

        // Check confidence threshold
        if (track.confidence && track.confidence < (this.request.preferences.minConfidence || 0)) {
          return false;
        }

        return true;
      });

      // Find nearest tracks to this mood point
      const nearest = findNearestTracks(
        point,
        candidates,
        5,
        0.35 // Max mood distance
      );

      if (nearest.length === 0) {
        console.warn(`No tracks found for mood point ${i}, using fallback`);
        continue;
      }

      // Select best track (prefer higher confidence, closer mood match)
      const bestTrack = nearest.reduce((best, current) => {
        const bestScore = this.scoreTrack(best, point, selected[selected.length - 1]);
        const currentScore = this.scoreTrack(current, point, selected[selected.length - 1]);
        return currentScore > bestScore ? current : best;
      });

      usedTrackIds.add(bestTrack.id);

      // Detect transition type
      const isClimax = curve.isClimax(t, 0.6);
      const prevTrack = selected[selected.length - 1];
      const bpmJump = prevTrack && bestTrack.bpm && prevTrack.track.bpm
        ? Math.abs(bestTrack.bpm - prevTrack.track.bpm)
        : 0;

      const transitionType = isClimax ? 'climax' : bpmJump > 20 ? 'step' : 'smooth';

      selected.push({
        track: bestTrack,
        position: t,
        moodAtPoint: point,
        transitionType,
        bpmTarget: calculateBPMTarget(t, 0, 0, curve),
        keySignature: bestTrack.key || undefined,
      });
    }

    return selected;
  }

  /**
   * Score track for selection
   * Higher score = better fit
   */
  private scoreTrack(
    track: Track,
    targetMood: MoodCoordinate,
    prevJourneyTrack?: JourneyTrack
  ): number {
    let score = 0;

    // Mood match (0-50 points)
    if (track.moodCoordinate) {
      const distance = moodDistance(targetMood, track.moodCoordinate);
      score += (1 - distance) * 50;
    }

    // Confidence (0-20 points)
    if (track.confidence) {
      score += track.confidence * 20;
    }

    // BPM compatibility (0-20 points)
    if (prevJourneyTrack?.track.bpm && track.bpm) {
      const bpmDiff = Math.abs(prevJourneyTrack.track.bpm - track.bpm);
      const maxDelta = this.request.preferences.maxBPMDelta || 30;
      if (bpmDiff <= maxDelta) {
        score += (1 - bpmDiff / maxDelta) * 20;
      }
    }

    // Key compatibility (0-10 points)
    if (prevJourneyTrack?.track.key && track.key) {
      if (areKeysCompatible(prevJourneyTrack.track.key, track.key)) {
        score += 10;
      }
    }

    // Prefer library tracks over discoveries
    if (!this.request.preferences.libraryOnly && Math.random() < this.request.preferences.discoveryRatio) {
      score += 5; // Slight boost for discoveries
    }

    return score;
  }

  /**
   * Optimize track sequence for better flow
   */
  private optimizeSequence(tracks: JourneyTrack[]): JourneyTrack[] {
    // Simple 2-opt improvement: try swapping adjacent tracks
    let improved = true;
    let iterations = 0;
    const maxIterations = 10;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 0; i < tracks.length - 1; i++) {
        const current = tracks[i];
        const next = tracks[i + 1];

        // Calculate "flow score" for current order
        const currentFlow = this.calculateFlowScore([current, next]);

        // Try swapped order
        const swappedFlow = this.calculateFlowScore([next, current]);

        if (swappedFlow > currentFlow) {
          // Swap
          tracks[i] = next;
          tracks[i + 1] = current;
          improved = true;
        }
      }
    }

    return tracks;
  }

  /**
   * Calculate flow score for track sequence
   * Higher = better transition
   */
  private calculateFlowScore(tracks: JourneyTrack[]): number {
    if (tracks.length < 2) return 0;

    let score = 0;
    for (let i = 0; i < tracks.length - 1; i++) {
      const a = tracks[i].track;
      const b = tracks[i + 1].track;

      // BPM continuity
      if (a.bpm && b.bpm) {
        const bpmDiff = Math.abs(a.bpm - b.bpm);
        score += Math.max(0, 20 - bpmDiff);
      }

      // Key compatibility
      if (a.key && b.key && areKeysCompatible(a.key, b.key)) {
        score += 10;
      }

      // Avoid same artist back-to-back
      if (a.artist !== b.artist) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Generate human-readable journey name
   */
  private generateJourneyName(): string {
    const startLabel = this.request.start.label;
    const endLabel = this.request.end.label;
    return `${startLabel} to ${endLabel}`;
  }
}

/**
 * Convenience function to generate journey
 */
export async function generateDreamJourney(
  library: Track[],
  request: JourneyRequest
): Promise<DreamJourney> {
  const generator = new JourneyGenerator(library, request);
  return generator.generate();
}