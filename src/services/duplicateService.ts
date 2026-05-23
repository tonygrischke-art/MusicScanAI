import { Track } from '../types';

export interface DuplicateGroup {
  tracks: Track[];
  reason: string;
}

export class DuplicateService {
  static findDuplicates(tracks: Track[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    const checked = new Set<string>();

    for (let i = 0; i < tracks.length; i++) {
      if (checked.has(tracks[i].id)) continue;
      const group: Track[] = [tracks[i]];

      for (let j = i + 1; j < tracks.length; j++) {
        if (checked.has(tracks[j].id)) continue;
        if (this.isDuplicate(tracks[i], tracks[j])) {
          group.push(tracks[j]);
          checked.add(tracks[j].id);
        }
      }

      if (group.length > 1) {
        checked.add(tracks[i].id);
        groups.push({
          tracks: group,
          reason: this.getDuplicateReason(group[0], group[1]),
        });
      }
    }

    return groups;
  }

  private static isDuplicate(a: Track, b: Track): boolean {
    const titleSim = this.stringSimilarity(
      a.title.toLowerCase().replace(/[^a-z0-9]/g, ''),
      b.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    const artistSim = this.stringSimilarity(
      a.artist.toLowerCase(),
      b.artist.toLowerCase()
    );
    const durationClose = Math.abs(a.duration - b.duration) <= 3;

    return titleSim > 0.85 && artistSim > 0.85 && durationClose;
  }

  private static getDuplicateReason(a: Track, b: Track): string {
    const titleMatch = a.title.toLowerCase() === b.title.toLowerCase();
    const artistMatch = a.artist.toLowerCase() === b.artist.toLowerCase();
    const durationMatch = Math.abs(a.duration - b.duration) <= 1;

    if (titleMatch && artistMatch && durationMatch) return 'Exact match';
    if (titleMatch && artistMatch) return 'Same title & artist';
    if (titleMatch) return 'Same title';
    return 'Similar metadata';
  }

  private static stringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (!a || !b) return 0;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.includes(shorter)) return shorter.length / longer.length;

    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : 1 + Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]);
      }
    }
    return 1 - matrix[b.length][a.length] / longer.length;
  }
}
