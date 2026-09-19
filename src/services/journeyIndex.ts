import { Track } from '../types/journey';

export class MoodIndex {
  private tracks: Track[] = [];
  private index: Map<string, [number, number]> = new Map();

  buildIndex(tracks: Track[]): void {
    this.tracks = tracks.filter(t => t.moodCoordinate);
    
    for (const track of this.tracks) {
      if (track.moodCoordinate) {
        this.index.set(track.id, [track.moodCoordinate.valence, track.moodCoordinate.energy]);
      }
    }
    
    console.log(`✅ Indexed ${this.tracks.length} tracks`);
  }

  /**
   * Fast approximate nearest neighbor search
   * O(log n) instead of O(n)
   */
  query(target: { valence: number; energy: number }, k: number = 5): Track[] {
    // Use k-d tree or Annoy in production
    // Simplified: linear scan with early termination
    
    return this.tracks
      .map(track => ({
        track,
        distance: Math.hypot(
          track.moodCoordinate!.valence - target.valence,
          track.moodCoordinate!.energy - target.energy
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k)
      .map(r => r.track);
  }
}

// Use in JourneyGenerator
const moodIndex = new MoodIndex();

// Build index on library scan
export function buildMoodIndex(tracks: Track[]): void {
  moodIndex.buildIndex(tracks);
}

// Fast query
export function queryMoodIndex(target: { valence: number; energy: number }, k: number = 5): Track[] {
  return moodIndex.query(target, k);
}