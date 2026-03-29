import { Track, Playlist } from '../types';
import { GENRE_COLORS, MOOD_COLORS } from '../types';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTotalDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
};

export const formatPlayCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
};

export const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  const longerLength = longer.length;
  if (longerLength === 0) return 1;
  
  return (longerLength - editDistance(longer, shorter)) / longerLength;
};

const editDistance = (str1: string, str2: string): number => {
  const dp: number[][] = Array(str1.length + 1).fill(null)
    .map(() => Array(str2.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= str2.length; j++) dp[0][j] = j;
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[str1.length][str2.length];
};

export const findDuplicates = (tracks: Track[]): Track[][] => {
  const duplicates: Track[][] = [];
  const checked = new Set<string>();

  for (let i = 0; i < tracks.length; i++) {
    if (checked.has(tracks[i].id)) continue;
    
    const duplicateGroup: Track[] = [tracks[i]];
    
    for (let j = i + 1; j < tracks.length; j++) {
      if (checked.has(tracks[j].id)) continue;
      
      const titleSim = calculateSimilarity(tracks[i].title, tracks[j].title);
      const artistSim = calculateSimilarity(tracks[i].artist, tracks[j].artist);
      const durationSim = Math.abs(tracks[i].duration - tracks[j].duration) <= 5 ? 1 : 0;
      
      if (titleSim > 0.8 && artistSim > 0.8 && durationSim === 1) {
        duplicateGroup.push(tracks[j]);
        checked.add(tracks[j].id);
      }
    }
    
    if (duplicateGroup.length > 1) {
      duplicates.push(duplicateGroup);
      checked.add(tracks[i].id);
    }
  }

  return duplicates;
};

export const getGenreColor = (genre: string | null): string => {
  if (!genre) return '#6366F1';
  return GENRE_COLORS[genre as keyof typeof GENRE_COLORS] || '#6366F1';
};

export const getMoodColor = (mood: string | null): string => {
  if (!mood) return '#6366F1';
  return MOOD_COLORS[mood as keyof typeof MOOD_COLORS] || '#6366F1';
};

export const getPlaylistArtwork = (playlist: Playlist, tracks: Track[]): string[] => {
  const playlistTracks = playlist.trackIds
    .map(id => tracks.find(t => t.id === id))
    .filter((t): t is Track => t !== undefined && t.artwork !== null);
  
  return playlistTracks
    .slice(0, 4)
    .map(t => t.artwork)
    .filter((a): a is string => a !== null);
};

export const generateMockWaveform = (): number[] => {
  return Array.from({ length: 100 }, () => Math.random() * 0.8 + 0.2);
};

export const calculateStats = (tracks: Track[]) => {
  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);
  const totalPlays = tracks.reduce((acc, t) => acc + t.playCount, 0);
  const genres = new Set(tracks.filter(t => t.genre).map(t => t.genre));
  const moods = new Set(tracks.filter(t => t.mood).map(t => t.mood));
  
  return {
    trackCount: tracks.length,
    totalHours: Math.round(totalDuration / 3600 * 10) / 10,
    totalPlays,
    genreCount: genres.size,
    moodCount: moods.size,
  };
};

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const hex = (x: string) => parseInt(x, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));
  
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
