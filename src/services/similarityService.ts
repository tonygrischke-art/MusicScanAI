import { Track } from '../types';

export interface SimilarTrack {
  track: Track;
  score: number;
}

export class SimilarityService {
  private static WEIGHTS = {
    genre: 30,
    mood: 25,
    energy: 15,
    valence: 10,
    bpm: 10,
    key: 10,
  };

  static computeSimilarity(a: Track, b: Track): number {
    let score = 0;

    if (a.genre && b.genre && a.genre === b.genre) {
      score += this.WEIGHTS.genre;
    }

    if (a.mood && b.mood && a.mood === b.mood) {
      score += this.WEIGHTS.mood;
    }

    const energyDiff = Math.abs(a.energy - b.energy);
    score += this.WEIGHTS.energy * (1 - energyDiff);

    const valenceDiff = Math.abs((a.valence || 0) - (b.valence || 0));
    score += this.WEIGHTS.valence * (1 - valenceDiff);

    if (a.bpm && b.bpm) {
      const bpmDiff = Math.abs(a.bpm - b.bpm);
      const bpmScore = Math.max(0, 1 - bpmDiff / 50);
      score += this.WEIGHTS.bpm * bpmScore;
    }

    if (a.key && b.key && a.key === b.key) {
      score += this.WEIGHTS.key;
    }

    return Math.min(100, Math.round(score));
  }

  static findSimilar(
    seed: Track,
    library: Track[],
    count = 10,
    minScore = 20
  ): SimilarTrack[] {
    const results: SimilarTrack[] = [];

    for (const track of library) {
      if (track.id === seed.id) continue;
      const score = this.computeSimilarity(seed, track);
      if (score >= minScore) {
        results.push({ track, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, count);
  }

  static camelotKeyToNumber(key: string): number | null {
    const camelotMap: Record<string, number> = {
      '1A': 1, '1B': 1,
      '2A': 2, '2B': 2,
      '3A': 3, '3B': 3,
      '4A': 4, '4B': 4,
      '5A': 5, '5B': 5,
      '6A': 6, '6B': 6,
      '7A': 7, '7B': 7,
      '8A': 8, '8B': 8,
      '9A': 9, '9B': 9,
      '10A': 10, '10B': 10,
      '11A': 11, '11B': 11,
      '12A': 12, '12B': 12,
    };
    return camelotMap[key] || null;
  }

  static getCamelotWheel(playerKey: number): number[] {
    return [
      ((playerKey % 12) + 1),
      (((playerKey + 2) % 12) + 1),
      (((playerKey + 5) % 12) + 1),
      (((playerKey - 2 + 12) % 12) + 1),
    ];
  }
}
