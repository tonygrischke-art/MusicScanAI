import { Track, GenreType, Playlist } from '../types';
import { AIService } from './AIService';
import { GENRES } from '../types';

// Normalize genre strings: "Hip-Hop" = "Hip Hop" = "hiphop" = "hip-hop"
function normalizeGenre(genre: string): string {
  return genre
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')
    .replace(/&/g, 'and')
    .trim();
}

// Map normalized genre to canonical GenreType
const GENRE_SYNONYMS: Record<string, GenreType> = {};
const synonymMap: Record<string, GenreType> = {
  'hip hop': 'hip-hop', 'hiphop': 'hip-hop', 'hip-hop': 'hip-hop',
  'rap': 'hip-hop', 'trap': 'hip-hop',
  'r&b': 'r&b', 'rb': 'r&b', 'rnb': 'r&b', 'rhythm and blues': 'r&b',
  'electronic': 'electronic', 'edm': 'electronic', 'techno': 'electronic',
  'house': 'electronic', 'trance': 'electronic', 'dubstep': 'electronic',
  'drum and bass': 'electronic', 'dnb': 'electronic',
  'rock': 'rock', 'alternative': 'rock', 'punk': 'rock',
  'pop': 'pop', 'synth pop': 'pop', 'indie pop': 'pop',
  'metal': 'metal', 'heavy metal': 'metal', 'death metal': 'metal',
  'indie': 'indie', 'indie rock': 'indie', 'indie folk': 'indie',
  'folk': 'folk', 'acoustic': 'folk',
  'jazz': 'jazz', 'smooth jazz': 'jazz',
  'classical': 'classical', 'orchestra': 'classical', 'symphony': 'classical',
  'blues': 'blues',
  'reggae': 'reggae', 'dub': 'reggae',
  'latin': 'latin', 'salsa': 'latin', 'reggaeton': 'latin',
  'country': 'country', 'bluegrass': 'country',
  'ambient': 'ambient', 'chillout': 'ambient', 'downtempo': 'ambient',
};

for (const [synonym, canonical] of Object.entries(synonymMap)) {
  GENRE_SYNONYMS[normalizeGenre(synonym)] = canonical;
}

export class GenreService {
  static detectGenre(track: Track): GenreType | null {
    if (track.genre) {
      const normalized = normalizeGenre(track.genre);
      // Check if it's already a valid GenreType
      if (GENRES.includes(track.genre as GenreType)) {
        return track.genre as GenreType;
      }
      // Check synonyms
      const mapped = GENRE_SYNONYMS[normalized];
      if (mapped) return mapped;
    }
    return null;
  }

  static async detectGenreWithAI(track: Track): Promise<GenreType | null> {
    const prompt = `What genre is "${track.title}" by ${track.artist}? Answer with exactly ONE of these genres: ${GENRES.join(', ')}. Only respond with the genre name, nothing else.`;

    try {
      const response = await AIService.chat(prompt);
      const cleaned = response.toLowerCase().trim();
      const match = GENRES.find(g => cleaned.includes(g));
      if (match) return match;
    } catch {
      // Fallback
    }
    return null;
  }

  static groupByGenre(tracks: Track[]): Map<string, Track[]> {
    const groups = new Map<string, Track[]>();

    for (const track of tracks) {
      const genre = this.detectGenre(track) || 'unknown';
      const existing = groups.get(genre) || [];
      existing.push(track);
      groups.set(genre, existing);
    }

    return groups;
  }

  static async autoDetectAndTag(
    tracks: Track[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, GenreType | null>> {
    const results = new Map<string, GenreType | null>();

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      let genre = this.detectGenre(track);

      if (!genre) {
        genre = await this.detectGenreWithAI(track);
      }

      results.set(track.id, genre);
      onProgress?.(i + 1, tracks.length);

      // Rate limit: max ~10 AI calls per second
      if (!genre || !this.detectGenre(track)) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    return results;
  }

  static createGenrePlaylist(genre: string, tracks: Track[]): Playlist {
    const genreTracks = this.groupByGenre(tracks).get(genre) || [];
    return {
      id: `genre_${genre}_${Date.now()}`,
      name: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Mix`,
      trackIds: genreTracks.map(t => t.id),
      type: 'manual',
      artworkCollage: genreTracks.slice(0, 4).map(t => t.artwork).filter(Boolean) as string[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  static createAllGenrePlaylists(tracks: Track[]): Playlist[] {
    const groups = this.groupByGenre(tracks);
    const playlists: Playlist[] = [];

    for (const [genre, genreTracks] of groups) {
      if (genre === 'unknown' || genreTracks.length < 2) continue;
      playlists.push(this.createGenrePlaylist(genre, tracks));
    }

    return playlists;
  }

  static getGenreStats(tracks: Track[]): { genre: string; count: number; percentage: number }[] {
    const groups = this.groupByGenre(tracks);
    const total = tracks.length;
    const stats: { genre: string; count: number; percentage: number }[] = [];

    for (const [genre, genreTracks] of groups) {
      stats.push({
        genre,
        count: genreTracks.length,
        percentage: total > 0 ? Math.round((genreTracks.length / total) * 100) : 0,
      });
    }

    stats.sort((a, b) => b.count - a.count);
    return stats;
  }

  // Pie chart colors for genres
  static getGenreColor(genre: string): string {
    const colors: Record<string, string> = {
      'pop': '#FF6B9D', 'rock': '#C92A2A', 'hip-hop': '#9B59B6',
      'electronic': '#00D9FF', 'classical': '#F4D03F', 'jazz': '#E67E22',
      'r&b': '#8E44AD', 'country': '#D35400', 'metal': '#2C3E50',
      'indie': '#1ABC9C', 'folk': '#27AE60', 'blues': '#3498DB',
      'reggae': '#2ECC71', 'latin': '#E74C3C', 'ambient': '#95A5A6',
      'unknown': '#666666',
    };
    return colors[genre] || '#666666';
  }
}
