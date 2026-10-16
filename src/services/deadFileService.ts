import { Track } from '../types';
import * as FileSystem from 'expo-file-system';

export interface DeadFile {
  track: Track;
  reason: string;
}

export class DeadFileService {
  /**
   * Real existence check via expo-file-system.
   * A track is dead when its file is missing OR present but empty (size 0).
   * Non-file:// URIs (e.g. content://) cannot be verified — treated as alive.
   */
  static async checkFileExists(filePath: string): Promise<boolean> {
    try {
      if (!filePath) return false;
      if (!filePath.startsWith('file://')) return true; // unknown scheme: cannot verify
      const info = await FileSystem.getInfoAsync(filePath);
      return info.exists === true && (info.size ?? 0) > 0;
    } catch {
      return false;
    }
  }

  static async findDeadFiles(tracks: Track[]): Promise<DeadFile[]> {
    const dead: DeadFile[] = [];

    for (const track of tracks) {
      const alive = await this.checkFileExists(track.path);
      if (!alive) {
        dead.push({ track, reason: 'File missing or empty on disk' });
      }
    }

    return dead;
  }
}
