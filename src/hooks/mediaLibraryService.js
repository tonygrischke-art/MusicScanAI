/**
 * Media Library Service Hook
 * Handles local music file access and scanning
 */

import { useState, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import ScanningService from '../services/ScanningService';

export function useMediaLibrary() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [tracks, setTracks] = useState([]);

  const requestPermission = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    return status === 'granted';
  }, []);

  const scanLibrary = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return [];
    }

    setIsScanning(true);
    
    try {
      const scannedTracks = await ScanningService.scanLibrary();
      setTracks(scannedTracks);
      return scannedTracks;
    } catch (error) {
      console.error('Library scan failed:', error);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [hasPermission, requestPermission]);

  const getTrackById = useCallback((id) => {
    return tracks.find(t => t.id === id);
  }, [tracks]);

  return {
    hasPermission,
    isScanning,
    tracks,
    requestPermission,
    scanLibrary,
    getTrackById,
  };
}