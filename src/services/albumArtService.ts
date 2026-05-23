import { Track } from '../types';

export interface AlbumArtResult {
  url: string;
  source: 'musicbrainz' | 'itunes' | 'lastfm';
  confidence: number;
}

export class AlbumArtService {
  static async fetchAlbumArt(track: Track): Promise<AlbumArtResult | null> {
    // Try sources in order: MusicBrainz → iTunes → Last.fm
    const sources = [
      () => this.fetchFromITunes(track),
      () => this.fetchFromMusicBrainz(track),
      () => this.fetchFromLastFm(track),
    ];

    for (const fetchFn of sources) {
      try {
        const result = await fetchFn();
        if (result) return result;
      } catch {
        // Try next source
      }
    }

    return null;
  }

  static async batchFetch(
    tracks: Track[],
    onProgress?: (current: number, total: number, track: Track) => void
  ): Promise<Map<string, AlbumArtResult>> {
    const results = new Map<string, AlbumArtResult>();

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (track.artwork) continue; // Skip tracks that already have art

      const result = await this.fetchAlbumArt(track);
      if (result) {
        results.set(track.id, result);
      }

      onProgress?.(i + 1, tracks.length, track);
      await new Promise(r => setTimeout(r, 300)); // Rate limit
    }

    return results;
  }

  private static async fetchFromITunes(track: Track): Promise<AlbumArtResult | null> {
    const query = `${track.artist} ${track.title}`.trim();
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const result = data.results?.[0];
      if (!result?.artworkUrl100) return null;

      // Get highest resolution available
      const artworkUrl = result.artworkUrl100
        .replace('100x100', '600x600')
        .replace('100x100bb', '600x600bb');

      return {
        url: artworkUrl,
        source: 'itunes',
        confidence: result.collectionName ? 0.9 : 0.7,
      };
    } catch {
      return null;
    }
  }

  private static async fetchFromMusicBrainz(track: Track): Promise<AlbumArtResult | null> {
    // First find the release via MusicBrainz API
    const query = `"${track.title}" ${track.artist || ''}`.trim();
    const searchUrl = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=1`;

    try {
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'MusicScanAI/1.0' },
      });
      if (!response.ok) return null;

      const data = await response.json();
      const releaseId = data.releases?.[0]?.id;
      if (!releaseId) return null;

      // Get cover art from Cover Art Archive
      const coverUrl = `https://coverartarchive.org/release/${releaseId}/front-500`;
      const headResponse = await fetch(coverUrl, { method: 'HEAD' });
      if (headResponse.ok) {
        return {
          url: coverUrl,
          source: 'musicbrainz',
          confidence: 0.85,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private static async fetchFromLastFm(track: Track): Promise<AlbumArtResult | null> {
    // Last.fm API is free but requires an API key
    // Using their public album.getInfo endpoint
    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(track.artist || '')}&track=${encodeURIComponent(track.title || '')}&format=json`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const images = data.track?.album?.image;
      if (!images || images.length === 0) return null;

      // Get the largest image
      const largestImg = images.find((img: any) => img.size === 'extralarge') || images[images.length - 1];
      if (!largestImg?.['#text']) return null;

      return {
        url: largestImg['#text'],
        source: 'lastfm',
        confidence: 0.7,
      };
    } catch {
      return null;
    }
  }

  static getTracksWithoutArt(tracks: Track[]): Track[] {
    return tracks.filter(t => !t.artwork);
  }
}
