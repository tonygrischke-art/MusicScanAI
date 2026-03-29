import * as MediaLibrary from 'expo-media-library';
import { Track, ScanProgress, MoodType, GenreType } from '../types';
import { generateId, generateMockWaveform } from '../utils/helpers';
import { WAVEFORM_SAMPLES } from '../utils/constants';

interface ScanCallbacks {
  onProgress: (progress: ScanProgress) => void;
  onTrackFound: (track: Track) => void;
  onError: (error: string) => void;
}

const extractMetadata = async (asset: MediaLibrary.Asset): Promise<Partial<Track>> => {
  const metadata: Partial<Track> = {
    duration: asset.duration || 0,
    bpm: Math.floor(Math.random() * 80) + 80,
    energy: Math.random(),
    valence: Math.random(),
    key: null,
    bitrate: null,
    sampleRate: null,
    channels: null,
    waveformData: generateMockWaveform(),
  };

  if (asset.mediaType === MediaLibrary.MediaType.audio) {
    metadata.bitrate = 320;
    metadata.sampleRate = 44100;
    metadata.channels = 2;
  }

  return metadata as Partial<Track>;
};

const extractColorsFromUri = async (uri: string | null): Promise<string[]> => {
  if (!uri) {
    return ['#151520', '#6366F1'];
  }
  
  const colors = [
    ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
    ['#1E1E2E', '#2D2D44', '#4A4A6A'],
  ];
  
  return colors[Math.random() > 0.5 ? 0 : 1];
};

const generateBlurhash = async (uri: string | null): Promise<string | null> => {
  if (!uri) return null;
  return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
};

const determineMood = (energy: number, valence: number): MoodType => {
  if (energy > 0.7 && valence > 0.5) return 'euphoric';
  if (energy > 0.7 && valence < 0.3) return 'aggressive';
  if (energy < 0.4 && valence < 0.4) return 'melancholic';
  if (energy < 0.4 && valence > 0.5) return 'romantic';
  if (energy > 0.5) return 'energetic';
  return 'chill';
};

const genres: GenreType[] = ['pop', 'rock', 'hip-hop', 'electronic', 'classical', 'jazz', 'r&b', 'country', 'metal', 'indie'];
const getRandomGenre = (): GenreType => genres[Math.floor(Math.random() * genres.length)];

export const ScanningService = {
  async checkPermissions(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  },

  async scanLibrary(callbacks: ScanCallbacks): Promise<Track[]> {
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      callbacks.onError('Media library permission denied');
      return [];
    }

    const progress: ScanProgress = {
      isScanning: true,
      currentFile: '',
      currentIndex: 0,
      totalFiles: 0,
      percentage: 0,
      error: null,
    };

    callbacks.onProgress(progress);

    try {
      const { assets, totalCount } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
        sortBy: [MediaLibrary.SortBy.default],
      });

      progress.totalFiles = totalCount;
      callbacks.onProgress({ ...progress });

      const tracks: Track[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        progress.currentIndex = i + 1;
        progress.currentFile = asset.filename;
        progress.percentage = Math.round(((i + 1) / assets.length) * 100);
        
        callbacks.onProgress({ ...progress });

        try {
          const metadata = await extractMetadata(asset);
          const artworkUri = asset.mediaType === MediaLibrary.MediaType.audio 
            ? null 
            : asset.uri;
          const colors = await extractColorsFromUri(artworkUri);
          const blurhash = await generateBlurhash(artworkUri);

          const track: Track = {
            id: generateId(),
            title: asset.filename.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown Artist',
            album: null,
            genre: getRandomGenre(),
            year: null,
            duration: metadata.duration || 0,
            path: asset.uri,
            artwork: artworkUri,
            blurhash,
            colors,
            waveformData: metadata.waveformData || generateMockWaveform(),
            bpm: metadata.bpm || 120,
            key: metadata.key ?? null,
            energy: metadata.energy || 0.5,
            valence: metadata.valence || 0.5,
            mood: determineMood(metadata.energy || 0.5, metadata.valence || 0.5),
            confidence: 0,
            isFavorite: false,
            rating: 0,
            playCount: 0,
            lastPlayed: null,
            dateAdded: new Date().toISOString(),
            bitrate: metadata.bitrate ?? null,
            sampleRate: metadata.sampleRate ?? null,
            channels: metadata.channels ?? null,
          };

          tracks.push(track);
          callbacks.onTrackFound(track);
        } catch (error) {
          console.error(`Error processing asset ${asset.filename}:`, error);
        }
      }

      progress.isScanning = false;
      progress.percentage = 100;
      callbacks.onProgress({ ...progress });

      return tracks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      callbacks.onError(errorMessage);
      callbacks.onProgress({
        ...progress,
        isScanning: false,
        error: errorMessage,
      });
      return [];
    }
  },

  async pauseScan(): Promise<void> {
    // Implementation for pausing scan
  },

  async resumeScan(): Promise<void> {
    // Implementation for resuming scan
  },

  generateWaveformData(durationSeconds: number): number[] {
    const samples: number[] = [];
    const samplesPerSecond = WAVEFORM_SAMPLES / durationSeconds;
    
    for (let i = 0; i < WAVEFORM_SAMPLES; i++) {
      const noise = Math.random() * 0.3;
      const wave = Math.sin(i * 0.1) * 0.3;
      const envelope = Math.sin((i / WAVEFORM_SAMPLES) * Math.PI) * 0.2;
      samples.push(Math.max(0.1, Math.min(1, 0.5 + noise + wave + envelope)));
    }
    
    return samples;
  },

  async getAudioInfo(uri: string): Promise<{
    duration: number;
    bitrate: number;
    sampleRate: number;
    channels: number;
  } | null> {
    try {
      return {
        duration: Math.floor(Math.random() * 300) + 60,
        bitrate: 320,
        sampleRate: 44100,
        channels: 2,
      };
    } catch {
      return null;
    }
  },
};

export default ScanningService;
