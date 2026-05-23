import { Track } from '../types';

export class M3UExporter {
  static generateM3U(tracks: Track[], playlistName: string): string {
    let content = '#EXTM3U\n';
    content += `#PLAYLIST:${playlistName}\n`;

    for (const track of tracks) {
      const duration = Math.round(track.duration);
      const title = track.artist ? `${track.artist} - ${track.title}` : track.title;
      content += `#EXTINF:${duration},${title}\n`;
      content += `${track.path}\n`;
    }

    return content;
  }

  static async exportToFile(
    tracks: Track[],
    playlistName: string,
    directory = '/sdcard/Music/Playlists'
  ): Promise<string> {
    const content = this.generateM3U(tracks, playlistName);
    const fileName = `${playlistName.replace(/[^a-zA-Z0-9]/g, '_')}.m3u`;
    const filePath = `${directory}/${fileName}`;

    // Placeholder: In production, use RNFS.writeFile(filePath, content, 'utf8')
    // For now, return the path where it would be saved
    console.log(`Would export ${tracks.length} tracks to ${filePath}`);
    return filePath;
  }

  static parseM3U(content: string): string[] {
    const lines = content.split('\n');
    const paths: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        paths.push(trimmed);
      }
    }

    return paths;
  }
}
