export interface LyricsResult {
  lyrics: string;
  source: string;
  isSynced: boolean;
}

export class LyricsService {
  static async fetchLyrics(title: string, artist: string): Promise<LyricsResult | null> {
    try {
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.lyrics) {
        return {
          lyrics: data.lyrics,
          source: 'lyrics.ovh',
          isSynced: false,
        };
      }
    } catch {
      // Fallback
    }
    return null;
  }

  static parseSyncedLyrics(lyrics: string): { time: number; text: string }[] {
    const lines = lyrics.split('\n');
    const synced: { time: number; text: string }[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = parseInt(match[3]);
        const time = minutes * 60 + seconds + ms / 1000;
        const text = line.replace(timeRegex, '').trim();
        if (text) synced.push({ time, text });
      }
    }

    return synced;
  }

  static getCurrentLine(synced: { time: number; text: string }[], position: number): string {
    if (synced.length === 0) return '';
    let current = synced[0].text;
    for (const line of synced) {
      if (line.time <= position) {
        current = line.text;
      } else {
        break;
      }
    }
    return current;
  }
}
