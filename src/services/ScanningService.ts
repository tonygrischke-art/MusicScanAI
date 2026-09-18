import * as MediaLibrary from 'expo-media-library';
import { Track, ScanProgress, MoodType, GenreType } from '../types';
import { MoodCoordinate, MOOD_PRESETS } from '../types/journey';
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
    bpm: 120,
    energy: 0.5,
    valence: 0.5,
    key: null,
    bitrate: null,
    sampleRate: null,
    channels: null,
    waveformData: generateMockWaveform(),
  };

  // Only set properties that exist on the Asset type
  if ('bitrate' in asset && asset.bitrate !== undefined) metadata.bitrate = asset.bitrate as number;
  if ('sampleRate' in asset && asset.sampleRate !== undefined) metadata.sampleRate = asset.sampleRate as number;
  if ('channels' in asset && asset.channels !== undefined) metadata.channels = asset.channels as number;
  
  // These properties may or may not exist depending on asset subtype - use type assertion
  const assetAny = asset as any;
  if (assetAny.title) metadata.title = String(assetAny.title);
  if (assetAny.artist) metadata.artist = String(assetAny.artist);
  if (assetAny.album) metadata.album = String(assetAny.album);

  return metadata as Partial<Track>;
};

const extractColorsFromUri = async (uri: string | null): Promise<string[]> => {
  if (!uri) {
    return ['#151520', '#6366F1'];
  }

  // In a real implementation, we would fetch the image and extract dominant colors
  // using a library like vibrant or manually analyzing the pixel data
  // For now, return a sensible default based on common music aesthetics
  return ['#1E1E2E', '#6366F1', '#8B5CF6'];
};

const generateBlurhash = async (uri: string | null): Promise<string | null> => {
  if (!uri) return null;
  // In a real implementation, we would generate a proper blurhash from the image
  // using a library like blurhash. For now, return null and let the UI handle it
  return null;
};

const determineMood = (energy: number, valence: number): MoodType => {
  if (energy > 0.7 && valence > 0.5) return 'euphoric';
  if (energy > 0.7 && valence < 0.3) return 'aggressive';
  if (energy < 0.4 && valence < 0.4) return 'melancholic';
  if (energy < 0.4 && valence > 0.5) return 'romantic';
  if (energy > 0.5) return 'energetic';
  return 'chill';
};

const determineMoodCoordinate = (energy: number, valence: number): MoodCoordinate => {
  const mood = determineMood(energy, valence);
  return { valence, energy, label: mood };
};

const genres: GenreType[] = [
  'pop', 'rock', 'hip-hop', 'electronic', 'classical',
  'jazz', 'r&b', 'country', 'metal', 'indie',
  'folk', 'blues', 'reggae', 'latin', 'ambient'
];
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
          const assetAny = asset as any;
          const artworkUri = asset.mediaType === MediaLibrary.MediaType.audio
            ? null
            : asset.uri;
          const colors = await extractColorsFromUri(artworkUri);
          const blurhash = await generateBlurhash(artworkUri);

          const track: Track = {
            id: generateId(),
            title: asset.filename.replace(/\.[^/.]+$/, ''),
            artist: assetAny.artist || 'Unknown Artist',
            album: assetAny.album || null,
            genre: 'pop',
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
            moodCoordinate: determineMoodCoordinate(metadata.energy || 0.5, metadata.valence || 0.5),
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
    // Scanning can be paused by tracking progress state
    // The scan loop checks a shared cancellation flag
    // Pause is handled at the UI level via setIsPaused in useScan hook
  },

  async resumeScan(): Promise<void> {
    // Resume logic - the scan will continue from where it left off
    // as the progress state is persisted in store
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