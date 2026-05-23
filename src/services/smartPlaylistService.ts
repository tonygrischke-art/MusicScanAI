import { Track, Playlist, SmartPlaylistRules, MoodType, GenreType } from '../types';
import { AIService } from './AIService';

export class SmartPlaylistService {
  static async generateFromNaturalLanguage(
    input: string,
    library: Track[]
  ): Promise<{ playlist: Playlist | null; rules: SmartPlaylistRules; matchCount: number; explanation: string }> {
    const prompt = `Parse this music playlist request into structured filter rules.

Request: "${input}"

Available filters:
- mood: energetic, chill, melancholic, euphoric, aggressive, romantic
- genre: pop, rock, hip-hop, electronic, classical, jazz, r&b, country, metal, indie, folk, blues, reggae, latin, ambient
- bpm: number (e.g. "under 90 BPM" → lessThan 90)
- decade: number (e.g. "from the 90s" → year between 1990-1999)
- energy: 0.0-1.0 (e.g. "high energy" → greaterThan 0.7)
- valence: 0.0-1.0 (e.g. "happy" → greaterThan 0.6)
- isFavorite: boolean
- rating: 0-5

Return JSON:
{
  "playlistName": "short catchy name",
  "rules": {
    "conditions": [
      {"field": "mood", "operator": "equals", "value": "chill"},
      {"field": "genre", "operator": "equals", "value": "hip-hop"},
      {"field": "bpm", "operator": "lessThan", "value": 90},
      {"field": "year", "operator": "greaterThan", "value": 1989},
      {"field": "year", "operator": "lessThan", "value": 2000}
    ],
    "matchType": "all"
  },
  "explanation": "brief description of what this playlist contains"
}`;

    try {
      const response = await AIService.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const parsed = JSON.parse(jsonMatch[0]);
      const rules: SmartPlaylistRules = {
        conditions: parsed.rules?.conditions || [],
        matchType: parsed.rules?.matchType || 'all',
      };

      const matchingTracks = this.applyRules(library, rules);

      const playlist: Playlist = {
        id: `smart_${Date.now()}`,
        name: parsed.playlistName || input,
        trackIds: matchingTracks.map(t => t.id),
        type: 'smart',
        rules,
        artworkCollage: matchingTracks.slice(0, 4).map(t => t.artwork).filter(Boolean) as string[],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        playlist,
        rules,
        matchCount: matchingTracks.length,
        explanation: parsed.explanation || `${matchingTracks.length} tracks match your request`,
      };
    } catch (error) {
      // Fallback: simple keyword matching
      return this.fallbackGenerate(input, library);
    }
  }

  static applyRules(tracks: Track[], rules: SmartPlaylistRules): Track[] {
    return tracks.filter(track => {
      const results = rules.conditions.map(condition => this.evaluateCondition(track, condition));
      return rules.matchType === 'all'
        ? results.every(r => r)
        : results.some(r => r);
    });
  }

  private static evaluateCondition(
    track: Track,
    condition: { field: string; operator: string; value: any }
  ): boolean {
    const trackValue = (track as any)[condition.field];

    if (trackValue === undefined || trackValue === null) return false;

    switch (condition.operator) {
      case 'equals':
        return String(trackValue).toLowerCase() === String(condition.value).toLowerCase();
      case 'notEquals':
        return String(trackValue).toLowerCase() !== String(condition.value).toLowerCase();
      case 'greaterThan':
        return Number(trackValue) > Number(condition.value);
      case 'lessThan':
        return Number(trackValue) < Number(condition.value);
      case 'contains':
        return String(trackValue).toLowerCase().includes(String(condition.value).toLowerCase());
      default:
        return false;
    }
  }

  private static fallbackGenerate(
    input: string,
    library: Track[]
  ): { playlist: Playlist | null; rules: SmartPlaylistRules; matchCount: number; explanation: string } {
    const lower = input.toLowerCase();
    const conditions: SmartPlaylistRules['conditions'] = [];

    // Mood detection
    const moods: MoodType[] = ['energetic', 'chill', 'melancholic', 'euphoric', 'aggressive', 'romantic'];
    for (const mood of moods) {
      if (lower.includes(mood)) {
        conditions.push({ field: 'mood', operator: 'equals', value: mood });
      }
    }

    // Genre detection
    const genres: GenreType[] = ['pop', 'rock', 'hip-hop', 'electronic', 'classical', 'jazz', 'r&b', 'country', 'metal', 'indie', 'folk', 'blues', 'reggae', 'latin', 'ambient'];
    for (const genre of genres) {
      if (lower.includes(genre.replace('-', ' ')) || lower.includes(genre)) {
        conditions.push({ field: 'genre', operator: 'equals', value: genre });
      }
    }

    // BPM detection
    const bpmMatch = lower.match(/(?:under|below|less than|<)\s*(\d+)\s*(?:bpm)?/i);
    if (bpmMatch) {
      conditions.push({ field: 'bpm', operator: 'lessThan', value: parseInt(bpmMatch[1]) });
    }
    const bpmAboveMatch = lower.match(/(?:over|above|more than|>)\s*(\d+)\s*(?:bpm)?/i);
    if (bpmAboveMatch) {
      conditions.push({ field: 'bpm', operator: 'greaterThan', value: parseInt(bpmAboveMatch[1]) });
    }

    // Decade detection
    const decadeMatch = lower.match(/(\d{2})s/i);
    if (decadeMatch) {
      const decade = parseInt(decadeMatch[1]);
      const year = decade < 50 ? 2000 + decade : 1900 + decade;
      conditions.push({ field: 'year', operator: 'greaterThan', value: year - 1 });
      conditions.push({ field: 'year', operator: 'lessThan', value: year + 10 });
    }

    // Energy
    if (lower.includes('high energy') || lower.includes('energetic') || lower.includes('pump')) {
      conditions.push({ field: 'energy', operator: 'greaterThan', value: 0.7 });
    }
    if (lower.includes('low energy') || lower.includes('chill') || lower.includes('calm')) {
      conditions.push({ field: 'energy', operator: 'lessThan', value: 0.4 });
    }

    const rules: SmartPlaylistRules = { conditions, matchType: 'all' };
    const matchingTracks = this.applyRules(library, rules);

    const playlist: Playlist = {
      id: `smart_${Date.now()}`,
      name: input.slice(0, 40),
      trackIds: matchingTracks.map(t => t.id),
      type: 'smart',
      rules,
      artworkCollage: matchingTracks.slice(0, 4).map(t => t.artwork).filter(Boolean) as string[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      playlist,
      rules,
      matchCount: matchingTracks.length,
      explanation: `${matchingTracks.length} tracks match "${input}"`,
    };
  }

  static previewMatchCount(library: Track[], rules: SmartPlaylistRules): number {
    return this.applyRules(library, rules).length;
  }
}
