/**
 * Gemini Service Hook
 * Wrapper for AIService with local fallback
 */

import { useState, useCallback } from 'react';
import AIService from '../services/AIService';

export function useGeminiService() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const analyzeMood = useCallback(async (track, apiKey) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await AIService.analyzeMood(track, apiKey);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeGenre = useCallback(async (track, apiKey) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await AIService.analyzeGenre(track, apiKey);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const generatePlaylist = useCallback(async (params, apiKey) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await AIService.generatePlaylist(params, apiKey);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyzeMood,
    analyzeGenre,
    generatePlaylist,
    isAnalyzing,
    error,
  };
}