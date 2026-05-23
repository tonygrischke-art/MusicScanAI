import { Track } from '../types';

export class BPMService {
  // Simple BPM estimation based on energy and spectral analysis
  // For production, use a proper audio analysis library
  static async detectBPM(filePath: string): Promise<number> {
    // Placeholder: In production, use a library like react-native-bpm
    // or analyze audio buffer for beat detection
    // For now, estimate from file metadata or return a default
    return 120;
  }

  static estimateBPMFromMetadata(track: Track): number {
    // Rough estimation based on genre and energy
    const genreBPM: Record<string, [number, number]> = {
      'pop': [100, 130],
      'rock': [110, 140],
      'hip-hop': [80, 110],
      'electronic': [120, 150],
      'classical': [60, 120],
      'jazz': [80, 140],
      'r&b': [70, 110],
      'country': [90, 130],
      'metal': [120, 180],
      'indie': [90, 140],
      'folk': [80, 120],
      'blues': [60, 100],
      'reggae': [70, 100],
      'latin': [90, 130],
      'ambient': [60, 90],
    };

    const range = genreBPM[track.genre || ''] || [80, 140];
    const energyFactor = track.energy || 0.5;
    return Math.round(range[0] + (range[1] - range[0]) * energyFactor);
  }

  static detectKey(filePath: string): string | null {
    // Placeholder: In production, use chroma analysis
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const modes = ['major', 'minor'];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    return `${key} ${mode}`;
  }

  static formatKey(key: string | null): string {
    if (!key) return '?';
    return key.replace('major', 'maj').replace('minor', 'min');
  }

  static getKeyColor(key: string | null): string {
    const colors: Record<string, string> = {
      'C': '#FF6B6B', 'C#': '#FF8E53', 'D': '#FFA502', 'D#': '#FFD93D',
      'E': '#6BCB77', 'F': '#4D96FF', 'F#': '#6C5CE7', 'G': '#A29BFE',
      'G': '#FD79A8', 'A': '#E17055', 'A#': '#00B894', 'B': '#0984E3',
    };
    if (!key) return '#666';
    const root = key.split(' ')[0];
    return colors[root] || '#666';
  }
}
