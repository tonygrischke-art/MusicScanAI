import { Track, MoodType, GenreType, Playlist, SmartPlaylistRules } from '../types';
import { AI_PROMPTS } from '../utils/constants';

interface GeminiResponse {
  mood?: MoodType;
  genre?: GenreType;
  confidence?: number;
  insight?: string;
  duplicates?: [string, string][];
  playlistName?: string;
  rules?: SmartPlaylistRules;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AIService = {
  async callGemini(prompt: string, apiKey: string): Promise<string | null> {
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500,
              }
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
          throw new Error('No response from API');
        }

        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Failed after retries');
  },

  async analyzeMood(track: Track, apiKey: string): Promise<{ mood: MoodType; confidence: number }> {
    const prompt = `${AI_PROMPTS.moodAnalysis}

Track: ${track.title} by ${track.artist}
Energy: ${track.energy}/1
Valence: ${track.valence}/1
BPM: ${track.bpm}

Return only the mood category.`;

    if (!apiKey) {
      return { mood: this.fallbackMood(track), confidence: 0.5 };
    }

    try {
      const response = await this.callGemini(prompt, apiKey);
      if (response) {
        const moodMatch = response.match(/(energetic|chill|melancholic|euphoric|aggressive|romantic)/i);
        if (moodMatch) {
          return {
            mood: moodMatch[1].toLowerCase() as MoodType,
            confidence: 0.8,
          };
        }
      }
    } catch {
      // Fallback to rule-based
    }

    return { mood: this.fallbackMood(track), confidence: 0.5 };
  },

  async analyzeGenre(track: Track, apiKey: string): Promise<{ genre: GenreType | null; confidence: number }> {
    const prompt = `${AI_PROMPTS.genreClassification}

Track: ${track.title} by ${track.artist}
Album: ${track.album || 'Unknown'}
Energy: ${track.energy}/1
Valence: ${track.valence}/1

Return only the genre.`;

    if (!apiKey) {
      return { genre: null, confidence: 0 };
    }

    try {
      const response = await this.callGemini(prompt, apiKey);
      if (response) {
        const genreMatch = response.match(
          /(pop|rock|hip-hop|electronic|classical|jazz|r&b|country|metal|indie|folk|blues|reggae|latin|ambient)/i
        );
        if (genreMatch) {
          return {
            genre: genreMatch[1].toLowerCase().replace('r&b', 'r&b') as GenreType,
            confidence: 0.7,
          };
        }
      }
    } catch {
      // Fallback
    }

    return { genre: null, confidence: 0 };
  },

  async analyzeTrack(track: Track, apiKey: string): Promise<Partial<Track>> {
    const [moodResult, genreResult] = await Promise.all([
      this.analyzeMood(track, apiKey),
      this.analyzeGenre(track, apiKey),
    ]);

    return {
      mood: moodResult.mood,
      confidence: moodResult.confidence,
      genre: genreResult.genre || track.genre,
    };
  },

  async findDuplicates(tracks: Track[], apiKey: string): Promise<[string, string][]> {
    if (tracks.length === 0) return [];

    const prompt = `Find duplicate tracks based on title similarity, artist name, and duration (within 5 seconds).
Return JSON array of [id1, id2] pairs for duplicates.

Tracks:
${tracks.map(t => `{"id":"${t.id}","title":"${t.title}","artist":"${t.artist}","duration":${t.duration}}`).join('\n')}`;

    if (!apiKey) {
      return this.findDuplicatesFallback(tracks);
    }

    try {
      const response = await this.callGemini(prompt, apiKey);
      if (response) {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch {
      return this.findDuplicatesFallback(tracks);
    }

    return [];
  },

  async generatePlaylistFromPrompt(prompt: string, apiKey: string): Promise<{
    name: string;
    rules: SmartPlaylistRules;
  }> {
    const fullPrompt = `${AI_PROMPTS.smartPlaylist}

Description: ${prompt}

Available filters:
- genre: pop, rock, hip-hop, electronic, classical, jazz, r&b, country, metal, indie, folk, blues, reggae, latin, ambient
- mood: energetic, chill, melancholic, euphoric, aggressive, romantic
- energy: 0-1
- valence: 0-1
- year: number
- rating: 0-5
- playCount: number
- isFavorite: boolean

Return JSON with name and rules.`;

    if (!apiKey) {
      return this.generatePlaylistFallback(prompt);
    }

    try {
      const response = await this.callGemini(fullPrompt, apiKey);
      if (response) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            name: result.name || prompt,
            rules: result.rules || { conditions: [], matchType: 'all' },
          };
        }
      }
    } catch {
      return this.generatePlaylistFallback(prompt);
    }

    return this.generatePlaylistFallback(prompt);
  },

  async getTrackInsight(track: Track, apiKey: string): Promise<string> {
    const prompt = `${AI_PROMPTS.trackInsight}

Track: ${track.title} by ${track.artist}
Genre: ${track.genre || 'Unknown'}
Mood: ${track.mood || 'Unknown'}
Energy: ${track.energy}/1
Valence: ${track.valence}/1
BPM: ${track.bpm}`;

    if (!apiKey) {
      return `A ${track.genre || 'diverse'} track by ${track.artist}. ${track.mood ? `With a ${track.mood} mood.` : ''}`;
    }

    try {
      const response = await this.callGemini(prompt, apiKey);
      return response || 'No insight available.';
    } catch {
      return `A ${track.genre || 'diverse'} track by ${track.artist}.`;
    }
  },

  async getRecommendations(seedTrack: Track, allTracks: Track[], apiKey: string): Promise<Track[]> {
    const similarTracks = allTracks.filter(t => {
      if (t.id === seedTrack.id) return false;
      
      const energyDiff = Math.abs(t.energy - seedTrack.energy);
      const valenceDiff = Math.abs(t.valence - seedTrack.valence);
      const genreMatch = t.genre === seedTrack.genre;
      const moodMatch = t.mood === seedTrack.mood;
      
      return (energyDiff < 0.3 && valenceDiff < 0.3 && (genreMatch || moodMatch));
    });

    return similarTracks
      .sort((a, b) => {
        const aScore = (a.genre === seedTrack.genre ? 2 : 0) + (a.mood === seedTrack.mood ? 1 : 0);
        const bScore = (b.genre === seedTrack.genre ? 2 : 0) + (b.mood === seedTrack.mood ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 5);
  },

  fallbackMood(track: Track): MoodType {
    const { energy, valence } = track;
    
    if (energy > 0.7 && valence > 0.5) return 'euphoric';
    if (energy > 0.7 && valence < 0.3) return 'aggressive';
    if (energy < 0.4 && valence < 0.4) return 'melancholic';
    if (energy < 0.4 && valence > 0.5) return 'romantic';
    if (energy > 0.5) return 'energetic';
    return 'chill';
  },

  findDuplicatesFallback(tracks: Track[]): [string, string][] {
    const duplicates: [string, string][] = [];
    const checked = new Set<string>();

    for (let i = 0; i < tracks.length; i++) {
      if (checked.has(tracks[i].id)) continue;

      for (let j = i + 1; j < tracks.length; j++) {
        if (checked.has(tracks[j].id)) continue;

        const titleSim = this.stringSimilarity(tracks[i].title, tracks[j].title);
        const artistSim = this.stringSimilarity(tracks[i].artist, tracks[j].artist);
        const durationSim = Math.abs(tracks[i].duration - tracks[j].duration) <= 5;

        if (titleSim > 0.8 && artistSim > 0.8 && durationSim) {
          duplicates.push([tracks[i].id, tracks[j].id]);
          checked.add(tracks[i].id);
          checked.add(tracks[j].id);
        }
      }
    }

    return duplicates;
  },

  stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.includes(shorter)) return shorter.length / longer.length;

    return this.levenshteinSimilarity(s1, s2);
  },

  levenshteinSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2[i - 1] === str1[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  },

  generatePlaylistFallback(prompt: string): { name: string; rules: SmartPlaylistRules } {
    const lowerPrompt = prompt.toLowerCase();
    
    let conditions: SmartPlaylistRules['conditions'] = [];
    
    if (lowerPrompt.includes('chill') || lowerPrompt.includes('relax')) {
      conditions.push({ field: 'energy', operator: 'lessThan', value: 0.4 });
    }
    if (lowerPrompt.includes('workout') || lowerPrompt.includes('energy') || lowerPrompt.includes('pump')) {
      conditions.push({ field: 'energy', operator: 'greaterThan', value: 0.7 });
    }
    if (lowerPrompt.includes('party') || lowerPrompt.includes('dance')) {
      conditions.push({ field: 'valence', operator: 'greaterThan', value: 0.6 });
      conditions.push({ field: 'energy', operator: 'greaterThan', value: 0.5 });
    }
    if (lowerPrompt.includes('sleep') || lowerPrompt.includes('night')) {
      conditions.push({ field: 'energy', operator: 'lessThan', value: 0.3 });
      conditions.push({ field: 'valence', operator: 'lessThan', value: 0.5 });
    }
    if (lowerPrompt.includes('happy') || lowerPrompt.includes('feels')) {
      conditions.push({ field: 'valence', operator: 'greaterThan', value: 0.6 });
    }
    if (lowerPrompt.includes('morning') || lowerPrompt.includes('wake')) {
      conditions.push({ field: 'energy', operator: 'greaterThan', value: 0.4 });
      conditions.push({ field: 'valence', operator: 'greaterThan', value: 0.4 });
    }

    return {
      name: prompt,
      rules: {
        conditions,
        matchType: 'all',
      },
    };
  },
};

export default AIService;
