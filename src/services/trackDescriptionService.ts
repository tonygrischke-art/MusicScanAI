import { Track } from '../types';
import { AIService } from './AIService';

export class TrackDescriptionService {
  static async getDescription(track: Track): Promise<string> {
    const context = [
      track.artist && `Artist: ${track.artist}`,
      track.album && `Album: ${track.album}`,
      track.genre && `Genre: ${track.genre}`,
      track.year && `Year: ${track.year}`,
      track.bpm && `BPM: ${track.bpm}`,
      track.key && `Key: ${track.key}`,
      track.energy !== undefined && `Energy: ${Math.round(track.energy * 100)}%`,
    ].filter(Boolean).join(', ');

    const prompt = `In one sentence (under 20 words), describe the vibe of this track: "${track.title}" by ${track.artist}. Context: ${context || 'none'}. Make it evocative and specific.`;

    try {
      const desc = await AIService.chat(prompt);
      return desc.replace(/^["']|["']$/g, '').trim();
    } catch {
      return `${track.genre ? track.genre.charAt(0).toUpperCase() + track.genre.slice(1) : 'Musical'} track${track.bpm ? ` at ${track.bpm} BPM` : ''}.`;
    }
  }
}
