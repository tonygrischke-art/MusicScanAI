import { useState, useEffect } from 'react'
import { analyzeWithGemini } from './geminiService'
import { getMediaLibraryMetadata } from './mediaLibraryService'

// Function to analyze music with Gemini API or fallback to local metadata
export const useLocalFallback = () => {
  const [isOnline, setIsOnline] = useState(true)

  const analyzeMusic = async (track) => {
    try {
      // Try Gemini API first
      const geminiResult = await analyzeWithGemini(track)
      return geminiResult
    } catch (error) {
      // Fallback to local metadata if API fails
      console.warn('Gemini API failed, using local metadata:', error)
      setIsOnline(false)
      return await getMediaLibraryMetadata(track)
    }
  }

  return {
    isOnline,
    analyzeMusic,
  }
}