import { Track } from '../types';
import { AIService } from './AIService';

export interface MetadataFix {
  trackId: string;
  field: string;
  currentValue: any;
  proposedValue: any;
  confidence: number;
  source: 'ai' | 'musicbrainz';
}

export interface MetadataFixResult {
  track: Track;
  fixes: MetadataFix[];
  hasChanges: boolean;
}

export class MetadataFixerService {
  static findBrokenTracks(tracks: Track[]): Track[] {
    return tracks.filter(track => {
      return !track.title ||
             track.title === 'Unknown' ||
             !track.artist ||
             track.artist === 'Unknown' ||
             !track.album ||
             !track.genre ||
             !track.year ||
             !track.artwork;
    });
  }

  static async analyzeTrack(track: Track): Promise<MetadataFixResult> {
    const breaks: MetadataFix[] = [];

    const prompt = `Analyze this track's metadata and suggest fixes for missing or incorrect fields.

Current metadata:
- Title: "${track.title || 'MISSING'}"
- Artist: "${track.artist || 'MISSING'}"
- Album: "${track.album || 'MISSING'}"
- Genre: "${track.genre || 'MISSING'}"
- Year: "${track.year || 'MISSING'}"
- File path: "${track.path}"

Suggest fixes as JSON:
{
  "fixes": [
    {"field": "title", "value": "corrected title", "confidence": 0.9, "reason": "why"},
    {"field": "artist", "value": "corrected artist", "confidence": 0.95, "reason": "why"},
    {"field": "album", "value": "album name", "confidence": 0.8, "reason": "why"},
    {"field": "genre", "value": "genre name", "confidence": 0.85, "reason": "why"},
    {"field": "year", "value": 2020, "confidence": 0.7, "reason": "why"}
  ]
}

Only suggest fixes for fields that are missing or likely wrong. Use the filename and path as hints.`;

    try {
      const response = await AIService.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        for (const fix of (parsed.fixes || [])) {
          const currentValue = (track as any)[fix.field];
          if (!currentValue || String(currentValue).toLowerCase() === 'unknown' || String(currentValue) === 'MISSING') {
            breaks.push({
              trackId: track.id,
              field: fix.field,
              currentValue,
              proposedValue: fix.value,
              confidence: fix.confidence || 0.5,
              source: 'ai',
            });
          }
        }
      }
    } catch {
      // AI failed, try MusicBrainz fallback
    }

    // MusicBrainz fallback for missing metadata
    if (breaks.length === 0 && track.title && track.title !== 'Unknown') {
      try {
        const mbFixes = await this.searchMusicBrainz(track);
        breaks.push(...mbFixes);
      } catch {
        // MusicBrainz also failed
      }
    }

    return {
      track,
      fixes: breaks,
      hasChanges: breaks.length > 0,
    };
  }

  private static async searchMusicBrainz(track: Track): Promise<MetadataFix[]> {
    const fixes: MetadataFix[] = [];
    const query = `"${track.title}" ${track.artist || ''}`.trim();

    try {
      const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'MusicScanAI/1.0' },
      });
      if (!response.ok) return fixes;

      const data = await response.json();
      const recording = data.recordings?.[0];
      if (!recording) return fixes;

      // Extract metadata from MusicBrainz response
      if (!track.artist && recording['artist-credit']?.length > 0) {
        fixes.push({
          trackId: track.id,
          field: 'artist',
          currentValue: track.artist,
          proposedValue: recording['artist-credit'][0].name,
          confidence: 0.8,
          source: 'musicbrainz',
        });
      }

      if (!track.album && recording.releases?.length > 0) {
        fixes.push({
          trackId: track.id,
          field: 'album',
          currentValue: track.album,
          proposedValue: recording.releases[0].title,
          confidence: 0.7,
          source: 'musicbrainz',
        });
      }

      if (!track.year && recording.releases?.[0]?.date) {
        const year = parseInt(record.releases[0].date.slice(0, 4));
        if (!isNaN(year)) {
          fixes.push({
            trackId: track.id,
            field: 'year',
            currentValue: track.year,
            proposedValue: year,
            confidence: 0.7,
            source: 'musicbrainz',
          });
        }
      }
    } catch {
      // MusicBrainz lookup failed
    }

    return fixes;
  }

  static async batchAnalyze(
    tracks: Track[],
    onProgress?: (current: number, total: number, track: Track) => void
  ): Promise<MetadataFixResult[]> {
    const results: MetadataFixResult[] = [];

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const result = await this.analyzeTrack(track);
      if (result.hasChanges) {
        results.push(result);
      }
      onProgress?.(i + 1, tracks.length, track);

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }

    return results;
  }

  static applyFix(track: Track, fix: MetadataFix): Track {
    return {
      ...track,
      [fix.field]: fix.proposedValue,
    };
  }

  static applyFixes(track: Track, fixes: MetadataFix[]): Track {
    let updated = { ...track };
    for (const fix of fixes) {
      updated = { ...updated, [fix.field]: fix.proposedValue };
    }
    return updated;
  }

  static getMissingFields(track: Track): string[] {
    const missing: string[] = [];
    if (!track.title || track.title === 'Unknown') missing.push('title');
    if (!track.artist || track.artist === 'Unknown') missing.push('artist');
    if (!track.album) missing.push('album');
    if (!track.genre) missing.push('genre');
    if (!track.year) missing.push('year');
    if (!track.artwork) missing.push('artwork');
    return missing;
  }
}
