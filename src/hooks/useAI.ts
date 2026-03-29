import { useCallback } from 'react';
import { useAIStore } from '../stores/useAIStore';
import { useLibrary } from '../stores/useLibraryStore';
import { useUIStore } from '../stores/useUIStore';
import { AIService } from '../services/AIService';
import { Track, Playlist, MoodType, GenreType } from '../types';
import { generateId, getPlaylistArtwork } from '../utils/helpers';
import { AI_BATCH_SIZE } from '../utils/constants';

export const useAI = () => {
  const {
    isAnalyzing,
    progress,
    apiKey,
    offlineMode,
    activityLog,
    isOnline,
    setApiKey,
    setOfflineMode,
    setAnalyzing,
    setProgress,
    resetProgress,
    addLogEntry,
    clearLog,
    analyzeTrack,
    batchAnalyzeTracks,
    findDuplicates,
    generateSmartPlaylist,
    getTrackInsight,
    cancelAnalysis,
  } = useAIStore();

  const { tracks, setTracks, playlists, setPlaylists, updateTrack, createPlaylist, updatePlaylist } = useLibrary();
  const { showNotification } = useUIStore();

  const runAnalysis = useCallback(async (tracksToAnalyze?: Track[]) => {
    const tracksForAnalysis = tracksToAnalyze || tracks.filter(t => !t.mood || t.confidence < 0.5);
    
    if (tracksForAnalysis.length === 0) {
      showNotification('No tracks need analysis', 'info');
      return;
    }

    setAnalyzing(true);
    setProgress({
      totalTracks: tracksForAnalysis.length,
      analyzedTracks: 0,
      currentStep: 'Starting AI analysis...',
      progress: 0,
    });

    addLogEntry(`Starting analysis of ${tracksForAnalysis.length} tracks`, 'info');

    const batches: Track[][] = [];
    for (let i = 0; i < tracksForAnalysis.length; i += AI_BATCH_SIZE) {
      batches.push(tracksForAnalysis.slice(i, i + AI_BATCH_SIZE));
    }

    const analyzedResults: Track[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      addLogEntry(`Processing batch ${batchIndex + 1}/${batches.length}`, 'info');

      for (let i = 0; i < batch.length; i++) {
        const track = batch[i];
        
        try {
          const analysis = await analyzeTrack(track);
          const index = tracks.findIndex(t => t.id === track.id);
          
          if (index !== -1) {
            const updatedTrack = { ...tracks[index], ...analysis };
            tracks[index] = updatedTrack;
            analyzedResults.push(updatedTrack);
          }

          setProgress({
            analyzedTracks: batchIndex * AI_BATCH_SIZE + i + 1,
            progress: ((batchIndex * AI_BATCH_SIZE + i + 1) / tracksForAnalysis.length) * 100,
            currentStep: `Analyzing: ${track.title}`,
          });
        } catch (error) {
          addLogEntry(`Failed to analyze ${track.title}: ${error}`, 'error');
        }
      }
    }

    setTracks([...tracks]);
    setProgress({
      currentStep: 'Analysis complete!',
      progress: 100,
    });
    setAnalyzing(false);
    addLogEntry(`Analysis complete! Processed ${analyzedResults.length} tracks`, 'success');
    showNotification(`AI analysis complete! Analyzed ${analyzedResults.length} tracks`, 'success');

    return analyzedResults;
  }, [tracks, setTracks, setAnalyzing, setProgress, addLogEntry, analyzeTrack, showNotification]);

  const analyzeMood = useCallback(async (track: Track) => {
    return AIService.analyzeMood(track, apiKey);
  }, [apiKey]);

  const analyzeGenre = useCallback(async (track: Track) => {
    return AIService.analyzeGenre(track, apiKey);
  }, [apiKey]);

  const checkDuplicates = useCallback(async () => {
    if (tracks.length < 2) {
      showNotification('Need at least 2 tracks to check for duplicates', 'info');
      return [];
    }

    setAnalyzing(true);
    addLogEntry('Checking for duplicates...', 'info');

    const duplicates = await AIService.findDuplicates(tracks, apiKey);

    setAnalyzing(false);
    
    if (duplicates.length > 0) {
      addLogEntry(`Found ${duplicates.length} duplicate pairs`, 'success');
      showNotification(`Found ${duplicates.length} potential duplicate pairs`, 'success');
    } else {
      addLogEntry('No duplicates found', 'success');
      showNotification('No duplicates found!', 'success');
    }

    return duplicates;
  }, [tracks, apiKey, setAnalyzing, addLogEntry, showNotification]);

  const createAIPlaylist = useCallback(async (prompt: string) => {
    setAnalyzing(true);
    addLogEntry(`Creating AI playlist: "${prompt}"`, 'info');

    try {
      const { name, rules } = await AIService.generatePlaylistFromPrompt(prompt, apiKey);
      
      const matchingTracks = tracks.filter(track => {
        return rules.conditions.every(condition => {
          switch (condition.field) {
            case 'genre':
              if (condition.operator === 'equals') return track.genre === condition.value;
              if (condition.operator === 'notEquals') return track.genre !== condition.value;
              break;
            case 'mood':
              if (condition.operator === 'equals') return track.mood === condition.value;
              break;
            case 'energy':
              if (condition.operator === 'greaterThan') return track.energy > (condition.value as number);
              if (condition.operator === 'lessThan') return track.energy < (condition.value as number);
              break;
            case 'valence':
              if (condition.operator === 'greaterThan') return track.valence > (condition.value as number);
              if (condition.operator === 'lessThan') return track.valence < (condition.value as number);
              break;
            case 'rating':
              if (condition.operator === 'greaterThan') return track.rating > (condition.value as number);
              break;
            case 'isFavorite':
              if (condition.operator === 'equals') return track.isFavorite === condition.value;
              break;
          }
          return true;
        });
      });

      const playlist = createPlaylist(name, matchingTracks.map(t => t.id));
      
      const playlistTracks = matchingTracks;
      updatePlaylist(playlist.id, {
        type: 'ai-generated',
        rules,
        artworkCollage: getPlaylistArtwork(playlist, playlistTracks).slice(0, 4),
      });

      addLogEntry(`Created playlist "${name}" with ${matchingTracks.length} tracks`, 'success');
      showNotification(`Created "${name}" with ${matchingTracks.length} tracks!`, 'success');
      
      return playlist;
    } catch (error) {
      addLogEntry(`Failed to create playlist: ${error}`, 'error');
      showNotification('Failed to create playlist', 'error');
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [tracks, apiKey, setAnalyzing, addLogEntry, createPlaylist, updatePlaylist, showNotification]);

  const getSimilarTracks = useCallback(async (seedTrack: Track) => {
    return AIService.getRecommendations(seedTrack, tracks, apiKey);
  }, [tracks, apiKey]);

  const getInsight = useCallback(async (track: Track) => {
    return AIService.getTrackInsight(track, apiKey);
  }, [apiKey]);

  return {
    isAnalyzing,
    progress,
    apiKey,
    offlineMode,
    activityLog,
    isOnline,
    
    setApiKey,
    setOfflineMode,
    
    runAnalysis,
    cancelAnalysis,
    analyzeMood,
    analyzeGenre,
    checkDuplicates,
    createAIPlaylist,
    getSimilarTracks,
    getInsight,
    
    resetProgress,
    clearLog,
  };
};
