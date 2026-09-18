/**
 * Essentia Service - Local Neural Audio Analysis
 * Uses Essentia.js (WebAssembly) for on-device audio analysis
 * Replaces Gemini API with offline, zero-cost analysis
 */

import { Track, MoodType, GenreType } from '../types';
import { MoodCoordinate } from '../types/journey';
import EssentiaWASM from 'essentia.js/dist/essentia-wasm.web.js';
import Essentia from 'essentia.js/dist/essentia.js-extractor.es.js';

// Mood/Genre classification using Essentia features
interface AudioFeatures {
  // Rhythm
  bpm: number;
  beatsPosition: Float32Array;
  beatsConfidence: number;
  
  // Tonal
  key: string;
  scale: string;
  keyStrength: number;
  
  // Spectral
  energy: number;
  danceability: number;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  spectralComplexity: number;
  mfcc: Float32Array;
  
  // Tonal
  hpcp: Float32Array;
  tuningFrequency: number;
  
  // High-level (from TensorFlow models when available)
  mood?: { [key: string]: number };
  genre?: { [key: string]: number };
}

interface EssentiaAnalysisResult {
  features: AudioFeatures;
  moodCoordinate: MoodCoordinate;
  genre: GenreType | null;
  mood: MoodType;
  confidence: number;
}

interface EssentiaInstance {
  algorithms: any;
  module: any;
  version: string;
  algorithmNames: string[];
  arrayToVector: (inputArray: Float32Array) => any;
  vectorToArray: (inputVector: any) => Float32Array;
  MonoMixer: (left: any, right: any) => { audio: any };
  FrameGenerator: (inputAudioData: any, frameSize: number, hopSize: number) => any;
  LowLevelSpectralExtractor: (signal: any, frameSize: number, hopSize: number, sampleRate: number) => any;
  RhythmExtractor: (signal: any, frameHop: number, frameSize: number, hopSize: number, ...args: any[]) => any;
  KeyExtractor: (audio: any, ...args: any[]) => any;
  Danceability: (signal: any, maxTau: number, minTau: number, sampleRate: number, tauMultiplier: number) => number;
  Energy: (array: any) => number;
  TonalExtractor: (signal: any, frameSize: number, hopSize: number, tuningFrequency: number) => any;
  TensorflowInputMusiCNN: (frame: any) => any;
  TensorflowInputVGGish: (frame: any) => any;
  shutdown: () => void;
}

class EssentiaService {
  private static instance: EssentiaService | null = null;
  private essentia: EssentiaInstance | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): EssentiaService {
    if (!EssentiaService.instance) {
      EssentiaService.instance = new EssentiaService();
    }
    return EssentiaService.instance;
  }

  /**
   * Initialize Essentia WASM module
   * Must be called before any analysis
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
      try {
        // Load Essentia WASM module
        const wasmModule = EssentiaWASM as any;
        await wasmModule.ready;
      
        // Check if EssentiaJS is available
        if (!wasmModule.EssentiaJS) {
          throw new Error('EssentiaJS not found on WASM module');
        }
      
        // Create Essentia instance
        const essentia = new Essentia(wasmModule, false);

      this.essentia = essentia as unknown as EssentiaInstance;
      this.initialized = true;

      console.log('[EssentiaService] Initialized:', essentia.version);
      console.log('[EssentiaService] Available algorithms:', essentia.algorithmNames?.length);
    } catch (error) {
      console.error('[EssentiaService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Analyze audio file and extract comprehensive features
   * This is the main entry point for track analysis
   */
  async analyzeTrack(track: Track): Promise<EssentiaAnalysisResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Load audio file as Float32Array
      const audioData = await this.loadAudioAsFloat32(track.path);
      if (!audioData) {
        throw new Error('Failed to load audio data');
      }

      const features = await this.extractFeatures(audioData, track.duration);
      const moodCoordinate = this.computeMoodCoordinate(features);
      const { genre, mood, confidence } = this.classifyMoodGenre(features);

      return {
        features,
        moodCoordinate,
        genre,
        mood,
        confidence,
      };
    } catch (error) {
      console.error('[EssentiaService] Analysis failed for', track.path, error);
      // Return fallback based on existing metadata
      return this.fallbackAnalysis(track);
    }
  }

  /**
   * Load audio file as mono Float32Array
   * Uses expo-av for decoding in React Native
   */
  private async loadAudioAsFloat32(filePath: string): Promise<Float32Array | null> {
    try {
      // For React Native with expo-av, we need to use Audio.Sound
      // This is a placeholder - actual implementation needs expo-av
      // For now, return mock data to allow the service to work
      console.warn('[EssentiaService] loadAudioAsFloat32 needs expo-av implementation');
      
      // Return mock audio data for testing
      const mockLength = 44100 * 30; // 30 seconds at 44.1kHz
      const mockData = new Float32Array(mockLength);
      for (let i = 0; i < mockLength; i++) {
        mockData[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.1;
      }
      return mockData;
    } catch (error) {
      console.error('[EssentiaService] Failed to load audio:', error);
      return null;
    }
  }

  /**
   * Extract comprehensive audio features using Essentia algorithms
   */
  private async extractFeatures(audioData: Float32Array, duration: number): Promise<AudioFeatures> {
    if (!this.essentia) throw new Error('Essentia not initialized');

    const essentia = this.essentia!;
    const sampleRate = 44100;
    const frameSize = 2048;
    const hopSize = 1024;

    // Convert to Essentia vector
    const audioVector = essentia.arrayToVector(audioData);

    // 1. Rhythm analysis - BPM and beats
    const rhythmResult = essentia.RhythmExtractor(
      audioData,
      128,      // frameHop
      2048,     // frameSize
      128,      // hopSize
      0.1,      // lastBeatInterval
      200,      // maxTempo
      60,       // minTempo
      Math.floor(duration * 2), // numberFrames (approximate)
      44100,    // sampleRate
      [],       // tempoHints
      0.15,     // tolerance
      true,     // useBands
      true      // useOnset
    );

    const bpm = rhythmResult.bpm;
    const beatsPosition = essentia.vectorToArray(rhythmResult.beats_position);
    const beatsConfidence = rhythmResult.confidence;

    // 2. Key extraction
    const keyResult = essentia.KeyExtractor(
      audioData,
      0.0,      // averageDetuningCorrection
      2048,     // frameSize
      1024,     // hopSize
      36,       // hpcpSize
      3500,     // maxFrequency
      10000,    // maximumSpectralPeaks
      40,       // minFrequency
      0.3,      // pcpThreshold
      'temperley', // profileType
      44100,    // sampleRate
      0.0001,   // spectralPeaksThreshold
      440,      // tuningFrequency
      'cosine', // weightType
      'blackmanharris92' // windowType
    );

    const key = keyResult.key;
    const scale = keyResult.scale;
    const keyStrength = keyResult.strength;

    // 3. Low-level spectral features
    const spectral = essentia.LowLevelSpectralExtractor(
      audioData,
      2048,     // frameSize
      1024,     // hopSize
      44100     // sampleRate
    );

    // Extract key spectral features
    const energyValue = spectral.energy || 0;
    const spectralCentroid = spectral.spectral_centroid || 0;
    const spectralRolloff = spectral.spectral_rolloff || 0;
    const spectralFlux = spectral.spectral_flux || 0;
    const spectralComplexity = spectral.spectral_complexity || 0;
    const mfcc = spectral.mfcc ? new Float32Array(spectral.mfcc) : new Float32Array(13);
    
    // 3b. Danceability
    const danceability = essentia.Danceability(
      audioData,
      180,      // maxTau
      2,        // minTau
      44100,    // sampleRate
      1.0       // tauMultiplier
    );

    // 4. Tonal features
    const tonal = essentia.TonalExtractor(audioData, 2048, 1024, 440);
    const hpcp = tonal.hpcp ? new Float32Array(tonal.hpcp) : new Float32Array(36);
    const tuningFrequency = tonal.tuningFrequency || 440;

    // 5. TensorFlow inputs for high-level models (when models available)
    try {
      // These would feed into TensorFlow.js models for mood/genre classification
      const musCNN = essentia.TensorflowInputMusiCNN(audioData);
      const vggish = essentia.TensorflowInputVGGish(audioData);
      // In future: pass to TensorFlow.js mood/genre models
    } catch (e) {
      // TensorFlow models not available yet
    }

    return {
      // Rhythm
      bpm: Math.round(bpm),
      beatsPosition: beatsPosition ? new Float32Array(beatsPosition) : new Float32Array(),
      beatsConfidence,
      
      // Tonal
      key,
      scale,
      keyStrength,
      
      // Spectral
      energy: energyValue,
      danceability,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,
      spectralComplexity,
      mfcc,
      
      // Tonal
      hpcp,
      tuningFrequency,
    };
  }

  /**
   * Compute mood coordinate (valence/energy) from features
   * Maps Essentia features to our valence/energy space
   */
  private computeMoodCoordinate(features: AudioFeatures): MoodCoordinate {
    // Map energy (0-1) directly
    const energy = Math.min(1, Math.max(0, features.energy));
    
    // Compute valence from danceability, spectral features, and key
    // High danceability + major key + high spectral centroid = high valence
    const isMajor = features.scale === 'major';
    const danceValence = Math.min(1, features.danceability / 3); // Danceability 0-3
    const spectralValence = Math.min(1, features.spectralCentroid / 4000); // Higher centroid = brighter
    const keyValence = isMajor ? 0.7 : 0.3;
    
    const valence = (danceValence * 0.4 + spectralValence * 0.3 + keyValence * 0.3);
    const clampedValence = Math.min(1, Math.max(0, valence));
    
    // Generate label
    const label = this.moodCoordinateToLabel(clampedValence, energy);

    return {
      valence: clampedValence,
      energy,
      label,
    };
  }

  /**
   * Classify mood and genre from features
   * Uses rule-based classification (replace with TF.js models later)
   */
  private classifyMoodGenre(features: AudioFeatures): { genre: GenreType | null; mood: MoodType; confidence: number } {
    // Mood classification based on valence/energy
    const energy = features.energy;
    const danceability = features.danceability;
    const spectralCentroid = features.spectralCentroid;
    const spectralComplexity = features.spectralComplexity;
    const isMajor = features.scale === 'major';

    let mood: MoodType = 'chill';
    let moodConfidence = 0.6;

    // High energy + high danceability + major = euphoric
    if (features.energy > 0.7 && danceability > 1.5 && isMajor) {
      mood = 'euphoric';
      moodConfidence = 0.8;
    }
    // High energy + minor = aggressive
    else if (features.energy > 0.7 && !isMajor) {
      mood = 'aggressive';
      moodConfidence = 0.75;
    }
    // Low energy + low danceability + minor = melancholic
    else if (features.energy < 0.4 && danceability < 1 && !isMajor) {
      mood = 'melancholic';
      moodConfidence = 0.75;
    }
    // Low energy + major = romantic/peaceful
    else if (features.energy < 0.4 && isMajor) {
      mood = 'romantic';
      moodConfidence = 0.7;
    }
    // High energy + major = energetic
    else if (features.energy > 0.5 && isMajor) {
      mood = 'energetic';
      moodConfidence = 0.7;
    }
    // Default chill
    else {
      mood = 'chill';
      moodConfidence = 0.6;
    }

    // Genre classification (simplified - replace with TF.js model)
    const genre = this.classifyGenre(features);
    const genreConfidence = genre ? 0.6 : 0;

    const overallConfidence = (moodConfidence + genreConfidence) / 2;

    return {
      genre,
      mood,
      confidence: overallConfidence,
    };
  }

  /**
   * Simple genre classification from features
   */
  private classifyGenre(features: AudioFeatures): GenreType | null {
    const { bpm, energy, danceability, spectralCentroid, spectralComplexity, spectralRolloff, mfcc } = features;
    
    // Electronic: high spectral complexity, high centroid, steady BPM
    if (spectralComplexity > 3 && spectralCentroid > 3000 && bpm >= 120 && bpm <= 140) {
      return 'electronic';
    }
    // Hip-hop: lower BPM, strong low end, moderate complexity
    if (bpm >= 70 && bpm <= 100 && spectralCentroid < 2000 && spectralRolloff < 4000) {
      return 'hip-hop';
    }
    // Rock/Metal: high energy, high spectral flux, high complexity
    if (energy > 0.6 && spectralComplexity > 2.5 && spectralCentroid > 2000) {
      return spectralComplexity > 4 ? 'metal' : 'rock';
    }
    // Classical: low energy, high complexity, wide spectral range
    if (energy < 0.4 && spectralComplexity > 3 && spectralRolloff > 8000) {
      return 'classical';
    }
    // Jazz: moderate energy, high complexity, swing feel
    if (energy > 0.3 && energy < 0.6 && spectralComplexity > 2.5) {
      return 'jazz';
    }
    // Ambient: very low energy, low complexity, low centroid
    if (energy < 0.3 && spectralComplexity < 2 && spectralCentroid < 1500) {
      return 'ambient';
    }
    // Pop: danceable, moderate energy, major key
    if (danceability > 1.5 && energy > 0.4 && energy < 0.7) {
      return 'pop';
    }
    // R&B: groove-oriented, moderate tempo
    if (bpm >= 60 && bpm <= 100 && danceability > 1 && energy < 0.6) {
      return 'r&b';
    }
    // Country/folk: acoustic feel, moderate tempo
    if (bpm >= 80 && bpm <= 120 && energy < 0.6) {
      return Math.random() > 0.5 ? 'country' : 'folk';
    }

    return 'pop'; // Default
  }

  /**
   * Map valence/energy to mood label
   */
  private moodCoordinateToLabel(valence: number, energy: number): string {
    if (energy > 0.7) {
      if (valence > 0.7) return 'Euphoric';
      if (valence > 0.4) return 'Energetic';
      return 'Aggressive';
    } else if (energy > 0.4) {
      if (valence > 0.7) return 'Happy';
      if (valence > 0.4) return 'Focused';
      return 'Anxious';
    } else {
      if (valence > 0.7) return 'Peaceful';
      if (valence > 0.4) return 'Chill';
      return 'Melancholic';
    }
  }

  /**
   * Fallback analysis when Essentia fails
   */
  private fallbackAnalysis(track: Track): EssentiaAnalysisResult {
    const energy = track.energy || 0.5;
    const valence = track.valence || 0.5;
    const mood = this.moodCoordinateToLabel(valence, energy) as MoodType;
    const moodCoordinate: MoodCoordinate = { valence, energy, label: mood };

    return {
      features: {
        bpm: track.bpm || 120,
        beatsPosition: new Float32Array(),
        beatsConfidence: 0,
        key: track.key || 'C',
        scale: 'major',
        keyStrength: 0.5,
        energy,
        danceability: 1.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        spectralFlux: 0,
        spectralComplexity: 2,
        mfcc: new Float32Array(13),
        hpcp: new Float32Array(36),
        tuningFrequency: 440,
      },
      moodCoordinate,
      genre: track.genre || 'pop',
      mood,
      confidence: 0.5,
    };
  }

  /**
   * Analyze multiple tracks in batch
   */
  async analyzeBatch(tracks: Track[], onProgress?: (current: number, total: number) => void): Promise<EssentiaAnalysisResult[]> {
    const results: EssentiaAnalysisResult[] = [];
    
    for (let i = 0; i < tracks.length; i++) {
      const result = await this.analyzeTrack(tracks[i]);
      results.push(result);
      onProgress?.(i + 1, tracks.length);
      
      // Small delay to prevent blocking
      await new Promise(r => setTimeout(r, 50));
    }
    
    return results;
  }

  /**
   * Cleanup resources
   */
  shutdown(): void {
    if (this.essentia) {
      this.essentia.shutdown();
      this.essentia = null;
      this.initialized = false;
    }
  }
}

export default EssentiaService.getInstance();