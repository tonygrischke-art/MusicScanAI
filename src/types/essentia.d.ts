// Type declarations for essentia.js

declare module 'essentia.js/dist/essentia-wasm.web.js' {
  interface EssentiaWASMModule {
    ready: Promise<any>;
    EssentiaJS: any;
    arrayToVector: (array: Float32Array) => any;
    vectorToArray: (vector: any) => Float32Array;
    VectorFloat: any;
  }
  
  const EssentiaWASM: EssentiaWASMModule;
  export default EssentiaWASM;
}

declare module 'essentia.js/dist/essentia.js-extractor.es.js' {
  interface EssentiaAlgorithms {
    // Audio I/O
    getAudioBufferFromURL(audioURL: string, webAudioCtx: AudioContext): Promise<AudioBuffer>;
    getAudioChannelDataFromURL(audioURL: string, webAudioCtx: AudioContext, channel?: number): Promise<Float32Array>;
    
    // Rhythm
    RhythmExtractor(
      signal: Float32Array,
      frameHop: number,
      frameSize: number,
      hopSize: number,
      lastBeatInterval: number,
      maxTempo: number,
      minTempo: number,
      numberFrames: number,
      sampleRate: number,
      tempoHints: number[],
      tolerance: number,
      useBands: boolean,
      useOnset: boolean
    ): {
      bpm: number;
      beats_position: any;
      confidence: number;
      bpm_intervals: any;
      first_peak_bpm: number;
      first_peak_spread: number;
      first_peak_weight: number;
      second_peak_bpm: number;
      second_peak_spread: number;
      second_peak_weight: number;
      histogram: any;
    };
    
    // Key
    KeyExtractor(
      audio: Float32Array,
      averageDetuningCorrection: number,
      frameSize: number,
      hopSize: number,
      hpcpSize: number,
      maxFrequency: number,
      maximumSpectralPeaks: number,
      minFrequency: number,
      pcpThreshold: number,
      profileType: string,
      sampleRate: number,
      spectralPeaksThreshold: number,
      tuningFrequency: number,
      weightType: string,
      windowType: string
    ): {
      key: string;
      scale: string;
      strength: number;
    };
    
    // Spectral
    LowLevelSpectralExtractor(
      signal: Float32Array,
      frameSize: number,
      hopSize: number,
      sampleRate: number
    ): {
      energy: number;
      spectral_centroid: number;
      spectral_rolloff: number;
      spectral_flux: number;
      spectral_complexity: number;
      mfcc: Float32Array;
      spectral_flatness_db: number;
      spectral_crest: number;
      spectral_decrease: number;
      barkbands: Float32Array;
      barkbands_kurtosis: Float32Array;
      barkbands_skewness: Float32Array;
      barkbands_spread: Float32Array;
      hfc: number;
      pitch: number;
      spectral_crest: number;
            spectral_decrease: number;
            spectral_energy: number;
            spectral_energyband_low: number;
            spectral_energyband_middle_low: number;
            spectral_energyband_middle_high: number;
            spectral_energyband_high: number;
            spectral_rms: number;
            spectral_strongpeak: number;
            zerocrossingrate: number;
            inharmonicity: number;
            tristimulus: Float32Array;
            oddtoevenharmonicenergyratio: number;
    };
    
    // Rhythm/Danceability
    Danceability(
      signal: Float32Array,
      maxTau: number,
      minTau: number,
      sampleRate: number,
      tauMultiplier: number
    ): number;
    
    Energy(array: Float32Array): number;
    
    // Tonal
    TonalExtractor(
      signal: Float32Array,
      frameSize: number,
      hopSize: number,
      tuningFrequency: number
    ): {
      hpcp: Float32Array;
      tuningFrequency: number;
    };
    
    // TensorFlow inputs
    TensorflowInputMusiCNN(frame: Float32Array): Float32Array;
    TensorflowInputVGGish(frame: Float32Array): Float32Array;
    
    // Utility
    FrameGenerator(inputAudioData: any, frameSize: number, hopSize: number): any;
    MonoMixer(left: any, right: any): { audio: any };
    arrayToVector(array: Float32Array): any;
    vectorToArray(vector: any): Float32Array;
    shutdown(): void;
  }
  
  interface EssentiaInstance {
    algorithms: EssentiaAlgorithms;
    module: any;
    version: string;
    algorithmNames: string[];
    arrayToVector: (inputArray: Float32Array) => any;
    vectorToArray: (inputVector: any) => Float32Array;
    MonoMixer: (left: any, right: any) => { audio: any };
    FrameGenerator: (inputAudioData: any, frameSize: number, hopSize: number) => any;
    LowLevelSpectralExtractor: (signal: Float32Array, frameSize: number, hopSize: number, sampleRate: number) => any;
    RhythmExtractor: (signal: Float32Array, ...args: any[]) => any;
    KeyExtractor: (audio: Float32Array, ...args: any[]) => any;
    Danceability: (signal: Float32Array, maxTau: number, minTau: number, sampleRate: number, tauMultiplier: number) => number;
    Energy: (array: Float32Array) => number;
    TonalExtractor: (signal: Float32Array, frameSize: number, hopSize: number, tuningFrequency: number) => any;
    TensorflowInputMusiCNN: (frame: Float32Array) => Float32Array;
    TensorflowInputVGGish: (frame: Float32Array) => Float32Array;
    shutdown: () => void;
  }
  
  interface EssentiaConstructor {
    new (EssentiaWASM: any, isDebug?: boolean): EssentiaInstance;
  }
  
  const Essentia: EssentiaConstructor;
  export default Essentia;
}

declare module 'essentia.js' {
  export { default as Essentia } from 'essentia.js/dist/essentia.js-extractor.es.js';
  export { default as EssentiaWASM } from 'essentia.js/dist/essentia-wasm.web.js';
}