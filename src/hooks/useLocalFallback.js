import { useState, useCallback } from 'react';

/**
 * Local fallback functions (self-contained, no external dependencies)
 */

async function analyzeWithGemini(track) {
  // Placeholder - would call actual Gemini API
  return { mood: 'unknown', confidence: 0 };
}

async function getMediaLibraryMetadata(track) {
  // Placeholder - would read local metadata
  return { mood: 'unknown', confidence: 0 };
}

/**
 * Local fallback hook for AI analysis
 */
export function useLocalFallback() {
  const [isOnline, setIsOnline] = useState(true);

  const analyzeMusic = useCallback(async (track) => {
    try {
      // Try Gemini API first
      const geminiResult = await analyzeWithGemini(track);
      return geminiResult;
    } catch (error) {
      // Fallback to local metadata if API fails
      console.warn('Gemini API failed, using local metadata:', error);
      setIsOnline(false);
      return await getMediaLibraryMetadata(track);
    }
  }, []);

  return {
    isOnline,
    analyzeMusic,
  };
}