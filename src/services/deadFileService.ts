import { Track } from '../types';

export interface DeadFile {
  track: Track;
  reason: string;
}

export class DeadFileService {
  // In a real implementation, this would check if the file exists
  // using react-native-fs or expo-file-system
  static async findDeadFiles(tracks: Track[]): Promise<DeadFile[]> {
    const dead: DeadFile[] = [];

    for (const track of tracks) {
      // Placeholder: In production, use RNFS.exists(track.path) or similar
      // For now, flag tracks with suspicious paths
      if (!track.path || track.path.length < 5) {
        dead.push({ track, reason: 'Invalid file path' });
      } else if (track.path.startsWith('/storage/emulated/') && !track.path.includes('/Music/') && !track.path.includes('/Download/') && !track.path.includes('/media/')) {
        dead.push({ track, reason: 'Unusual file location' });
      }
    }

    return dead;
  }

  static async checkFileExists(filePath: string): Promise<boolean> {
    // Placeholder: In production, use RNFS.exists(filePath)
    return true;
  }
}
