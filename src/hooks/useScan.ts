import { useCallback, useState } from 'react';
import { useLibrary } from '../stores/useLibraryStore';
import { useUIStore } from '../stores/useUIStore';
import { ScanningService } from '../services/ScanningService';
import { Track, ScanProgress } from '../types';

export const useScan = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [localProgress, setLocalProgress] = useState<ScanProgress | null>(null);
  
  const {
    tracks,
    scanProgress,
    setTracks,
    addTrack,
    setScanProgress,
    resetScanProgress,
  } = useLibrary();
  
  const { showNotification } = useUIStore();

  const startScan = useCallback(async () => {
    const hasPermission = await ScanningService.checkPermissions();
    
    if (!hasPermission) {
      showNotification('Please grant media library permission to scan your music', 'error');
      return;
    }

    setScanProgress({
      isScanning: true,
      currentFile: 'Starting scan...',
      currentIndex: 0,
      totalFiles: 0,
      percentage: 0,
      error: null,
    });

    const foundTracks: Track[] = [];

    await ScanningService.scanLibrary({
      onProgress: (progress) => {
        setLocalProgress(progress);
        setScanProgress(progress);
      },
      onTrackFound: (track) => {
        foundTracks.push(track);
        addTrack(track);
      },
      onError: (error) => {
        showNotification(`Scan error: ${error}`, 'error');
      },
    });

    setScanProgress({
      isScanning: false,
      currentFile: 'Scan complete',
      percentage: 100,
    });

    showNotification(`Scan complete! Found ${foundTracks.length} tracks`, 'success');
    return foundTracks;
  }, [setScanProgress, addTrack, showNotification]);

  const pauseScan = useCallback(async () => {
    setIsPaused(true);
    await ScanningService.pauseScan();
    showNotification('Scan paused', 'info');
  }, [showNotification]);

  const resumeScan = useCallback(async () => {
    setIsPaused(false);
    await ScanningService.resumeScan();
    showNotification('Scan resumed', 'info');
  }, [showNotification]);

  const cancelScan = useCallback(() => {
    resetScanProgress();
    setLocalProgress(null);
    showNotification('Scan cancelled', 'info');
  }, [resetScanProgress, showNotification]);

  return {
    isScanning: scanProgress.isScanning,
    isPaused,
    progress: localProgress || scanProgress,
    currentFile: scanProgress.currentFile,
    currentIndex: scanProgress.currentIndex,
    totalFiles: scanProgress.totalFiles,
    percentage: scanProgress.percentage,
    error: scanProgress.error,
    tracksFound: tracks.length,
    
    startScan,
    pauseScan,
    resumeScan,
    cancelScan,
  };
};
