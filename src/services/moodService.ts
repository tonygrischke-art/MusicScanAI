import { Track, MoodType } from '../types';
import { AIService } from './AIService';

export interface MoodAnalysis {
  mood: MoodType;
  confidence: number;
  keywords: string[];
}

export class MoodService {
  private static moodKeywords: Record<MoodType, string[]> = {
    energetic: ['energetic', 'upbeat', 'fast', 'pump', 'hype', 'workout', 'run', 'dance', 'party', 'drive'],
    chill: ['chill', 'relax', 'calm', 'peaceful', 'mellow', 'lofi', 'lo-fi', 'ambient', 'sleep', 'study'],
    melancholic: ['sad', 'melancholy', 'rain', 'night', 'lonely', 'heartbreak', 'cry', 'dark', 'depressed'],
    euphoric: ['happy', 'joy', 'euphoric', 'uplifting', 'feel good', 'sunshine', 'bright', 'celebration'],
    aggressive: ['angry', 'aggressive', 'heavy', 'intense', 'fight', 'rage', 'hard', 'metal', 'scream'],
    romantic: ['love', 'romantic', 'date', 'kiss', 'heart', 'valentine', 'slow', 'intimate', 'passion'],
  };

  static analyzeText(text: string): MoodAnalysis {
    const lower = text.toLowerCase();
    let bestMood: MoodType = 'chill';
    let bestScore = 0;
    const matchedKeywords: string[] = [];

    for (const [mood, keywords] of Object.entries(this.moodKeywords)) {
      let score = 0;
      const found: string[] = [];
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          score += 1;
          found.push(kw);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMood = mood as MoodType;
        matchedKeywords.length = 0;
        matchedKeywords.push(...found);
      }
    }

    return {
      mood: bestMood,
      confidence: Math.min(1, bestScore / 3),
      keywords: matchedKeywords,
    };
  }

  static async analyzeTextWithAI(text: string): Promise<MoodAnalysis> {
    try {
      const prompt = `Analyze the mood of this music request: "${text}". Respond with JSON: {"mood": "energetic|chill|melancholic|euphoric|aggressive|romantic", "confidence": 0-1, "keywords": ["word1", "word2"]}`;
      const response = await AIService.chat(prompt);
      const json = JSON.parse(response);
      return {
        mood: json.mood || 'chill',
        confidence: json.confidence || 0.5,
        keywords: json.keywords || [],
      };
    } catch {
      return this.analyzeText(text);
    }
  }

  static scoreTrackForMood(track: Track, targetMood: MoodType): number {
    let score = 0;

    if (track.mood === targetMood) score += 40;
    if (track.energy !== undefined) {
      const energyMap: Record<MoodType, [number, number]> = {
        energetic: [0.7, 1.0],
        chill: [0.1, 0.4],
        melancholic: [0.1, 0.5],
        euphoric: [0.6, 1.0],
        aggressive: [0.7, 1.0],
        romantic: [0.2, 0.6],
      };
      const [min, max] = energyMap[targetMood];
      if (track.energy >= min && track.energy <= max) score += 30;
    }
    if (track.bpm) {
      const bpmMap: Record<MoodType, [number, number]> = {
        energetic: [120, 180],
        chill: [60, 100],
        melancholic: [60, 100],
        euphoric: [100, 140],
        aggressive: [130, 200],
        romantic: [70, 110],
      };
      const [min, max] = bpmMap[targetMood];
      if (track.bpm >= min && track.bpm <= max) score += 30;
    }

    return score;
  }

  static async generateMoodPlaylist(
    text: string,
    library: Track[],
    maxTracks = 30
  ): Promise<{ tracks: Track[]; analysis: MoodAnalysis }> {
    const analysis = await this.analyzeTextWithAI(text);
    const scored = library.map((track) => ({
      track,
      score: this.scoreTrackForMood(track, analysis.mood),
    }));
    scored.sort((a, b) => b.score - a.score);
    return {
      tracks: scored.slice(0, maxTracks).map((s) => s.track),
      analysis,
    };
  }
}
