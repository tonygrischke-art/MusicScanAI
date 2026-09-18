/**
 * Fingerprint Service - Acoustic Fingerprinting
 * Uses Chromaprint algorithm for true duplicate detection
 * Detects duplicates by audio content, not metadata
 */

import { Track } from '../types';

interface FingerprintResult {
  fingerprint: string;        // Base64 encoded Chromaprint fingerprint
  duration: number;           // Track duration in seconds
  trackId: string;
}

interface DuplicateMatch {
  trackId1: string;
  trackId2: string;
  similarity: number;         // 0-1 similarity score
  matchType: 'exact' | 'remaster' | 'live_vs_studio' | 'different_pressing';
  details: {
    durationDiff: number;     // Duration difference in seconds
    fingerprintSimilarity: number;
    metadataMatch: boolean;
  };
}

interface FingerprintIndex {
  [fingerprint: string]: string[]; // fingerprint -> trackIds
}

/**
 * Chromaprint implementation for React Native
 * Port of the Chromaprint algorithm for acoustic fingerprinting
 */
class FingerprintService {
  private static instance: FingerprintService | null = null;
  private fingerprintCache: Map<string, FingerprintResult> = new Map();
  private index: FingerprintIndex = {};
  
  // Chromaprint parameters
  private readonly SAMPLE_RATE = 11025;    // Chromaprint works at 11025 Hz
  private readonly FRAME_SIZE = 4096;
  private readonly HOP_SIZE = 2048;
  private readonly NUM_COEFFS = 32;        // Chromaprint uses 32 coefficients
  
  // Silence detection
  private readonly SILENCE_THRESHOLD = 0.01;
  private readonly MIN_FINGERPRINT_DURATION = 10; // seconds

  private constructor() {}

  static getInstance(): FingerprintService {
    if (!FingerprintService.instance) {
      FingerprintService.instance = new FingerprintService();
    }
    return FingerprintService.instance;
  }

  /**
   * Generate Chromaprint fingerprint for a track
   * Returns base64 encoded fingerprint string
   */
  async generateFingerprint(track: Track): Promise<FingerprintResult | null> {
    // Check cache first
    const cacheKey = `${track.id}-${track.path}`;
    if (this.fingerprintCache.has(cacheKey)) {
      return this.fingerprintCache.get(cacheKey)!;
    }

    try {
      // Load audio data
      const audioData = await this.loadAudioForFingerprint(track.path);
      if (!audioData || audioData.length === 0) {
        console.warn('[FingerprintService] No audio data for', track.path);
        return null;
      }

      // Resample to 11025 Hz if needed
      const resampled = this.resampleAudio(audioData, 44100, this.SAMPLE_RATE);
      
      // Generate chromaprint fingerprint
      const fingerprint = this.computeChromaprint(resampled);
      if (!fingerprint) {
        return null;
      }

      const result: FingerprintResult = {
        fingerprint: this.encodeBase64(fingerprint),
        duration: track.duration,
        trackId: track.id,
      };

      // Cache and index
      this.fingerprintCache.set(cacheKey, result);
      this.addToIndex(result);

      return result;
    } catch (error) {
      console.error('[FingerprintService] Failed to generate fingerprint:', error);
      return null;
    }
  }

  /**
   * Find duplicates in the library
   * Returns pairs of tracks with similarity scores
   */
  async findDuplicates(tracks: Track[]): Promise<DuplicateMatch[]> {
    const matches: DuplicateMatch[] = [];
    const fingerprints: FingerprintResult[] = [];

    // Generate fingerprints for all tracks
    for (const track of tracks) {
      const fp = await this.generateFingerprint(track);
      if (fp) fingerprints.push(fp);
    }

    // Compare all pairs
    for (let i = 0; i < fingerprints.length; i++) {
      for (let j = i + 1; j < fingerprints.length; j++) {
        const similarity = this.compareFingerprints(fingerprints[i], fingerprints[j]);
        
        if (similarity > 0.85) { // High similarity threshold
          const track1 = tracks.find(t => t.id === fingerprints[i].trackId)!;
          const track2 = tracks.find(t => t.id === fingerprints[j].trackId)!;
          
          const matchType = this.classifyMatchType(track1, track2, similarity);
          const durationDiff = Math.abs(track1.duration - track2.duration);
          const metadataMatch = this.metadataMatches(track1, track2);

          matches.push({
            trackId1: fingerprints[i].trackId,
            trackId2: fingerprints[j].trackId,
            similarity,
            matchType,
            details: {
              durationDiff,
              fingerprintSimilarity: similarity,
              metadataMatch,
            },
          });
        }
      }
    }

    // Sort by similarity (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);
    
    return matches;
  }

  /**
   * Compare two fingerprints using Hamming distance
   * Returns similarity score 0-1
   */
  private compareFingerprints(fp1: FingerprintResult, fp2: FingerprintResult): number {
    try {
      const fp1Decoded = this.decodeBase64(fp1.fingerprint);
      const fp2Decoded = this.decodeBase64(fp2.fingerprint);

      if (!fp1Decoded || !fp2Decoded || fp1Decoded.length !== fp2Decoded.length) {
        return 0;
      }

      // Calculate Hamming distance
      let hammingDistance = 0;
      for (let i = 0; i < fp1Decoded.length; i++) {
        const xor = fp1Decoded[i] ^ fp2Decoded[i];
        // Count set bits (Brian Kernighan's algorithm)
        let n = xor;
        while (n) {
          n &= n - 1;
          hammingDistance++;
        }
      }

      // Normalize to 0-1 similarity
      const maxDistance = fp1Decoded.length * 8; // bits per byte
      const similarity = 1 - hammingDistance / maxDistance;
      
      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      console.error('[FingerprintService] Comparison failed:', error);
      return 0;
    }
  }

  /**
   * Classify the type of duplicate match
   */
  private classifyMatchType(
    track1: Track, 
    track2: Track, 
    similarity: number
  ): 'exact' | 'remaster' | 'live_vs_studio' | 'different_pressing' {
    const durationDiff = Math.abs(track1.duration - track2.duration);
    const metadataMatch = this.metadataMatches(track1, track2);

    // Exact match: same duration, same metadata, very high similarity
    if (similarity > 0.98 && durationDiff < 1 && metadataMatch) {
      return 'exact';
    }

    // Different pressing: same metadata, very high similarity, small duration diff
    if (similarity > 0.95 && durationDiff < 5 && metadataMatch) {
      return 'different_pressing';
    }

    // Live vs studio: same title/artist, different duration, lower similarity
    if (track1.title === track2.title && track1.artist === track2.artist && durationDiff > 10) {
      return 'live_vs_studio';
    }

    // Remaster: same title/artist, different audio characteristics
    if (track1.title === track2.title && track1.artist === track2.artist) {
      return 'remaster';
    }

    return 'different_pressing';
  }

  /**
   * Check if metadata matches between two tracks
   */
  private metadataMatches(track1: Track, track2: Track): boolean {
    return (
      track1.title.toLowerCase().trim() === track2.title.toLowerCase().trim() &&
      track1.artist.toLowerCase().trim() === track2.artist.toLowerCase().trim() &&
      (track1.album?.toLowerCase().trim() === track2.album?.toLowerCase().trim() || 
       !track1.album || !track2.album)
    );
  }

  /**
   * Compute Chromaprint fingerprint from audio data
   * Implementation based on Chromaprint algorithm
   */
  private computeChromaprint(audioData: Float32Array): Uint8Array | null {
    try {
      const frameSize = this.FRAME_SIZE;
      const hopSize = this.HOP_SIZE;
      const numCoeffs = this.NUM_COEFFS;

      // Pre-emphasis filter
      const preEmphasized = this.preEmphasis(audioData);

      // Framing
      const frames = this.frameSignal(preEmphasized, frameSize, hopSize);
      if (frames.length === 0) return null;

      // Apply window function (Hann window)
      const window = this.hannWindow(frameSize);
      const windowedFrames = frames.map(frame => 
        frame.map((sample, i) => sample * window[i])
      );

      // FFT and Chroma features
      const chromaFrames = windowedFrames.map(frame => this.computeChroma(frame));

      // Quantize and compress to fingerprint
      const fingerprint = this.quantizeChroma(chromaFrames);

      return fingerprint;
    } catch (error) {
      console.error('[FingerprintService] Chromaprint computation failed:', error);
      return null;
    }
  }

  /**
   * Pre-emphasis filter (high-pass)
   */
  private preEmphasis(signal: Float32Array, coefficient = 0.97): Float32Array {
    const result = new Float32Array(signal.length);
    result[0] = signal[0];
    for (let i = 1; i < signal.length; i++) {
      result[i] = signal[i] - coefficient * signal[i - 1];
    }
    return result;
  }

  /**
   * Frame signal into overlapping frames
   */
  private frameSignal(signal: Float32Array, frameSize: number, hopSize: number): Float32Array[] {
    const frames: Float32Array[] = [];
    for (let i = 0; i + frameSize <= signal.length; i += hopSize) {
      const frame = new Float32Array(frameSize);
      frame.set(signal.slice(i, i + frameSize));
      frames.push(frame);
    }
    return frames;
  }

  /**
   * Hann window function
   */
  private hannWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }

  /**
   * Compute chroma features (12 pitch classes) from FFT
   * Simplified chroma extraction
   */
  private computeChroma(frame: Float32Array): Float32Array {
    const fftSize = frame.length;
    const chroma = new Float32Array(12);
    
    // Simple FFT magnitude (placeholder - use real FFT in production)
    // This is a simplified chroma computation
    const magnitudes = this.computeMagnitudeSpectrum(frame);
    
    // Map frequency bins to 12 chroma bins
    const binsPerChroma = Math.floor(magnitudes.length / 12);
    for (let c = 0; c < 12; c++) {
      let sum = 0;
      let count = 0;
      for (let b = 0; b < binsPerChroma; b++) {
        const idx = c * binsPerChroma + b;
        if (idx < magnitudes.length) {
          sum += magnitudes[idx];
          count++;
        }
      }
      chroma[c] = count > 0 ? sum / count : 0;
    }

    // Normalize
    const max = Math.max(...chroma);
    if (max > 0) {
      for (let i = 0; i < 12; i++) {
        chroma[i] /= max;
      }
    }

    return chroma;
  }

  /**
   * Compute magnitude spectrum from time-domain signal
   * Simplified - use real FFT library in production
   */
  private computeMagnitudeSpectrum(frame: Float32Array): Float32Array {
    const n = frame.length;
    const magnitudes = new Float32Array(n / 2);
    
    // Simplified DFT (use FFT library like fft.js in production)
    for (let k = 0; k < n / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let t = 0; t < n; t++) {
        const angle = -2 * Math.PI * k * t / n;
        real += frame[t] * Math.cos(angle);
        imag += frame[t] * Math.sin(angle);
      }
      magnitudes[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return magnitudes;
  }

  /**
   * Quantize chroma frames to fingerprint bytes
   */
  private quantizeChroma(chromaFrames: Float32Array[]): Uint8Array {
    // Chromaprint algorithm: quantize chroma differences
    // Simplified implementation
    const subfingerprints: number[] = [];
    
    for (let i = 1; i < chromaFrames.length; i++) {
      const prev = chromaFrames[i - 1];
      const curr = chromaFrames[i];
      
      // Compute differences between consecutive chroma frames
      for (let c = 0; c < 12; c++) {
        const diff = curr[c] - prev[c];
        // Quantize to 8 bits
        const quantized = Math.max(0, Math.min(255, Math.round((diff + 1) * 127.5)));
        subfingerprints.push(quantized);
      }
    }

    // Compress using simple run-length encoding
    return this.compressFingerprint(new Uint8Array(subfingerprints));
  }

  /**
   * Simple run-length compression
   */
  private compressFingerprint(data: Uint8Array): Uint8Array {
    // Simple compression - in production use zlib or Chromaprint's native compression
    return data; // Return raw for now
  }

  /**
   * Resample audio to target sample rate
   */
  private resampleAudio(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return audioData;
    
    const ratio = fromRate / toRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const index = Math.floor(srcIndex);
      const frac = srcIndex - index;
      
      if (index + 1 < audioData.length) {
        result[i] = audioData[index] * (1 - frac) + audioData[index + 1] * frac;
      } else {
        result[i] = audioData[index];
      }
    }
    
    return result;
  }

  /**
   * Load audio file for fingerprinting
   * Returns mono audio at 44100 Hz
   */
  private async loadAudioForFingerprint(filePath: string): Promise<Float32Array | null> {
    try {
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100
      });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to mono
      const numberOfChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      const monoData = new Float32Array(length);
      
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          monoData[i] += channelData[i];
        }
      }
      
      for (let i = 0; i < length; i++) {
        monoData[i] /= numberOfChannels;
      }
      
      return monoData;
    } catch (error) {
      console.error('[FingerprintService] Failed to load audio:', error);
      return null;
    }
  }

  /**
   * Add fingerprint to search index
   */
  private addToIndex(fp: FingerprintResult): void {
    if (!this.index[fp.fingerprint]) {
      this.index[fp.fingerprint] = [];
    }
    if (!this.index[fp.fingerprint].includes(fp.trackId)) {
      this.index[fp.fingerprint].push(fp.trackId);
    }
  }

  /**
   * Base64 encoding
   */
  private encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64 decoding
   */
  private decodeBase64(str: string): Uint8Array | null {
    try {
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  }

  /**
   * Clear cache and index
   */
  clearCache(): void {
    this.fingerprintCache.clear();
    this.index = {};
  }

  /**
   * Get cache stats
   */
  getStats(): { cached: number; indexed: number } {
    return {
      cached: this.fingerprintCache.size,
      indexed: Object.keys(this.index).length,
    };
  }
}

export default FingerprintService.getInstance();