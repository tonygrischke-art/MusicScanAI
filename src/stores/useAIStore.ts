import { create } from 'zustand';
import { AIAnalysisProgress, Track, ActivityLogEntry, MoodType, GenreType } from '../types';
import StorageService from '../services/StorageService';
import { generateId } from '../utils/helpers';

interface AIStore {
  isAnalyzing: boolean;
  progress: AIAnalysisProgress;
  apiKey: string;
  offlineMode: boolean;
  activityLog: ActivityLogEntry[];
  isOnline: boolean;
  
  setApiKey: (key: string) => void;
  setOfflineMode: (enabled: boolean) => void;
  setIsOnline: (online: boolean) => void;
  
  setAnalyzing: (isAnalyzing: boolean) => void;
  setProgress: (progress: Partial<AIAnalysisProgress>) => void;
  resetProgress: () => void;
  
  addLogEntry: (message: string, type: ActivityLogEntry['type']) => void;
  clearLog: () => void;
  
  analyzeTrack: (track: Track) => Promise<Partial<Track>>;
  batchAnalyzeTracks: (tracks: Track[]) => Promise<Track[]>;
  findDuplicates: (tracks: Track[]) => Promise<Track[][]>;
  generateSmartPlaylist: (prompt: string) => Promise<{ name: string; rules: string }>;
  getTrackInsight: (track: Track) => Promise<string>;
  fallbackAnalyze: (track: Track) => Partial<Track>;
  
  cancelAnalysis: () => void;
}

const initialProgress: AIAnalysisProgress = {
  isAnalyzing: false,
  currentStep: '',
  progress: 0,
  totalTracks: 0,
  analyzedTracks: 0,
  error: null,
};

const initialState = {
  isAnalyzing: false,
  progress: initialProgress,
  apiKey: '',
  offlineMode: false,
  activityLog: [],
  isOnline: true,
};

export const useAIStore = create<AIStore>((set, get) => ({
  ...initialState,

  setApiKey: (key) => {
    set({ apiKey: key });
    const settings = StorageService.getSettings();
    StorageService.saveSettings({ ...settings, geminiApiKey: key });
  },

  setOfflineMode: (enabled) => {
    set({ offlineMode: enabled });
    const settings = StorageService.getSettings();
    StorageService.saveSettings({ ...settings, offlineMode: enabled });
  },

  setIsOnline: (online) => set({ isOnline: online }),

  setAnalyzing: (isAnalyzing) => {
    set({ isAnalyzing });
    set((state) => ({
      progress: { ...state.progress, isAnalyzing }
    }));
  },

  setProgress: (progress) => {
    set((state) => ({
      progress: { ...state.progress, ...progress }
    }));
    StorageService.saveAIState({ ...get().progress, ...progress });
  },

  resetProgress: () => {
    set({ progress: initialProgress, isAnalyzing: false });
    StorageService.clearAIState();
  },

  addLogEntry: (message, type) => {
    const entry: ActivityLogEntry = {
      timestamp: new Date().toISOString(),
      message,
      type,
    };
    set((state) => ({
      activityLog: [...state.activityLog, entry].slice(-100)
    }));
  },

  clearLog: () => set({ activityLog: [] }),

  analyzeTrack: async (track) => {
    const { apiKey, offlineMode, addLogEntry } = get();
    
    if (!apiKey || offlineMode) {
      return get().fallbackAnalyze(track);
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this music track:
Title: ${track.title}
Artist: ${track.artist}
Album: ${track.album || 'Unknown'}
Duration: ${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}
Energy: ${track.energy}/1
Valence: ${track.valence}/1

Return JSON with:
- mood: one of energetic, chill, melancholic, euphoric, aggressive, romantic
- genre: one of pop, rock, hip-hop, electronic, classical, jazz, r&b, country, metal, indie, folk, blues, reggae, latin, ambient
- confidence: 0-1 score
- insight: brief 2-sentence description`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          addLogEntry(`Analyzed: ${track.title}`, 'success');
          return {
            mood: analysis.mood as MoodType,
            genre: analysis.genre as GenreType,
            confidence: analysis.confidence,
          };
        }
      }
      
      throw new Error('Failed to parse response');
    } catch (error) {
      addLogEntry(`Analysis failed for ${track.title}: ${error}`, 'error');
      return get().fallbackAnalyze(track);
    }
  },

  batchAnalyzeTracks: async (tracks) => {
    const { analyzeTrack, setAnalyzing, setProgress, addLogEntry } = get();
    
    setAnalyzing(true);
    setProgress({
      totalTracks: tracks.length,
      analyzedTracks: 0,
      currentStep: 'Starting analysis...',
      progress: 0,
    });

    const results = [...tracks];
    const batchSize = 50;

    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      addLogEntry(`Analyzing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(tracks.length / batchSize)}`, 'info');

      for (let j = 0; j < batch.length; j++) {
        const track = batch[j];
        const analysis = await analyzeTrack(track);
        
        const index = results.findIndex(t => t.id === track.id);
        if (index !== -1) {
          results[index] = { ...results[index], ...analysis };
        }

        setProgress({
          analyzedTracks: i + j + 1,
          progress: ((i + j + 1) / tracks.length) * 100,
          currentStep: `Analyzing: ${track.title}`,
        });
      }
    }

    setProgress({ currentStep: 'Complete!', progress: 100 });
    setAnalyzing(false);
    addLogEntry(`Analysis complete! Processed ${tracks.length} tracks.`, 'success');

    return results;
  },

  findDuplicates: async (tracks) => {
    const { apiKey, offlineMode, addLogEntry } = get();
    
    if (!apiKey || offlineMode) {
      return [];
    }

    try {
      addLogEntry('Finding duplicates...', 'info');
      
      const trackSummaries = tracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        duration: t.duration,
      }));

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Find duplicate tracks in this list. Return JSON array of arrays, where each inner array contains IDs of duplicate tracks.
Tracks: ${JSON.stringify(trackSummaries)}`
            }]
          }],
        }),
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const duplicateIds = JSON.parse(jsonMatch[0]);
          return duplicateIds.map((ids: string[]) => 
            ids.map((id: string) => tracks.find(t => t.id === id)).filter(Boolean)
          );
        }
      }
      
      return [];
    } catch (error) {
      addLogEntry(`Duplicate detection failed: ${error}`, 'error');
      return [];
    }
  },

  generateSmartPlaylist: async (prompt) => {
    const { apiKey, offlineMode, addLogEntry } = get();
    
    addLogEntry(`Generating playlist: "${prompt}"`, 'info');

    if (!apiKey || offlineMode) {
      return {
        name: prompt,
        rules: JSON.stringify({ conditions: [], matchType: 'all' })
      };
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a smart playlist based on this description: "${prompt}"
              
Available filters:
- genre: pop, rock, hip-hop, electronic, classical, jazz, r&b, country, metal, indie, folk, blues, reggae, latin, ambient
- mood: energetic, chill, melancholic, euphoric, aggressive, romantic
- energy: 0-1
- valence: 0-1
- year: number
- rating: 0-5
- playCount: number
- isFavorite: boolean

Return JSON with:
- name: suggested playlist name
- rules: array of conditions with field, operator, value`
            }]
          }],
        }),
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          addLogEntry(`Playlist generated: ${result.name}`, 'success');
          return result;
        }
      }
      
      return { name: prompt, rules: '{}' };
    } catch (error) {
      addLogEntry(`Playlist generation failed: ${error}`, 'error');
      return { name: prompt, rules: '{}' };
    }
  },

  getTrackInsight: async (track) => {
    const { apiKey, offlineMode } = get();
    
    if (!apiKey || offlineMode) {
      return `A ${track.genre || 'diverse'} track by ${track.artist}. ${track.mood ? `With a ${track.mood} mood and ` : ''}energy level of ${Math.round(track.energy * 100)}%.`;
    }

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Give a 2-sentence insight about this track:
Title: ${track.title}
Artist: ${track.artist}
Genre: ${track.genre || 'Unknown'}
Mood: ${track.mood || 'Unknown'}
Energy: ${track.energy}/1
Valence: ${track.valence}/1`
            }]
          }],
        }),
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No insight available.';
    } catch {
      return `A ${track.genre || 'diverse'} track by ${track.artist}.`;
    }
  },

  fallbackAnalyze: (track) => {
    const energy = track.energy;
    const valence = track.valence;
    const bpm = track.bpm;

    let mood: MoodType = 'chill';
    if (energy > 0.7 && valence > 0.5) mood = 'euphoric';
    else if (energy > 0.7 && valence < 0.3) mood = 'aggressive';
    else if (energy < 0.4 && valence < 0.4) mood = 'melancholic';
    else if (energy < 0.4 && valence > 0.5) mood = 'romantic';
    else if (energy > 0.5) mood = 'energetic';

    return {
      mood,
      confidence: 0.5,
    };
  },

  cancelAnalysis: () => {
    set({ isAnalyzing: false, progress: initialProgress });
    get().addLogEntry('Analysis cancelled', 'warning');
  },
}));
