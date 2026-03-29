import { useCallback, useEffect, useRef } from 'react';
import TrackPlayer, {
  Event,
  State,
  usePlaybackState,
  useProgress,
  useActiveTrack,
  RepeatMode,
} from 'react-native-track-player';
import { useAudioStore } from '../stores/useAudioStore';
import { useLibrary } from '../stores/useLibraryStore';
import { AudioService } from '../services/AudioService';
import { Track } from '../types';

export const useAudio = () => {
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const activeTrack = useActiveTrack();
  
  const {
    currentTrack,
    isPlaying,
    queue,
    history,
    shuffle,
    repeat,
    volume,
    rate,
    sleepTimerEndTime,
    sleepTimerRemaining,
    setCurrentTrack,
    setIsPlaying,
    setQueue,
    setProgress,
    setDuration,
    setShuffle,
    setRepeat,
    setVolume,
    setRate,
    addToHistory,
    setSleepTimer,
    updateSleepTimerRemaining,
  } = useAudioStore();

  const { tracks, getTrackById, incrementPlayCount } = useLibrary();
  
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const isCurrentlyPlaying = playbackState.state === State.Playing;
    setIsPlaying(isCurrentlyPlaying);
  }, [playbackState.state, setIsPlaying]);

  useEffect(() => {
    if (activeTrack) {
      const track = getTrackById(activeTrack.id as string);
      if (track) {
        setCurrentTrack(track);
        incrementPlayCount(track.id);
        addToHistory(track);
      }
    }
  }, [activeTrack?.id]);

  useEffect(() => {
    setProgress(progress.position);
    setDuration(progress.duration);
  }, [progress.position, progress.duration]);

  useEffect(() => {
    if (sleepTimerEndTime) {
      sleepTimerRef.current = setInterval(() => {
        updateSleepTimerRemaining();
      }, 1000);
    } else {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
    }

    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, [sleepTimerEndTime, updateSleepTimerRemaining]);

  const play = useCallback(async (track: Track) => {
    await AudioService.play(track);
  }, []);

  const playQueue = useCallback(async (tracks: Track[], startIndex = 0) => {
    setQueue(tracks);
    await AudioService.playQueue(tracks, startIndex);
  }, [setQueue]);

  const pause = useCallback(async () => {
    await AudioService.pause();
  }, []);

  const resume = useCallback(async () => {
    await AudioService.resume();
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await resume();
    }
  }, [isPlaying, pause, resume]);

  const next = useCallback(async () => {
    await AudioService.skipToNext();
  }, []);

  const previous = useCallback(async () => {
    await AudioService.skipToPrevious();
  }, []);

  const seek = useCallback(async (position: number) => {
    await AudioService.seekTo(position);
  }, []);

  const seekForward = useCallback(async (seconds = 10) => {
    const newPosition = Math.min(progress.position + seconds, progress.duration);
    await seek(newPosition);
  }, [progress.position, progress.duration, seek]);

  const seekBackward = useCallback(async (seconds = 10) => {
    const newPosition = Math.max(progress.position - seconds, 0);
    await seek(newPosition);
  }, [progress.position, seek]);

  const setVolumeLevel = useCallback(async (vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    await AudioService.setVolume(clampedVol);
    setVolume(clampedVol);
  }, [setVolume]);

  const setRateValue = useCallback(async (newRate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2, newRate));
    await AudioService.setRate(clampedRate);
    setRate(clampedRate);
  }, [setRate]);

  const toggleShuffle = useCallback(async () => {
    const newShuffle = !shuffle;
    await AudioService.setShuffle(newShuffle);
    setShuffle(newShuffle);
  }, [shuffle, setShuffle]);

  const cycleRepeat = useCallback(async () => {
    const modes: ('off' | 'track' | 'queue')[] = ['off', 'queue', 'track'];
    const currentIndex = modes.indexOf(repeat);
    const nextRepeat = modes[(currentIndex + 1) % modes.length];
    
    let trackPlayerRepeat: RepeatMode;
    switch (nextRepeat) {
      case 'off':
        trackPlayerRepeat = RepeatMode.Off;
        break;
      case 'queue':
        trackPlayerRepeat = RepeatMode.Queue;
        break;
      case 'track':
        trackPlayerRepeat = RepeatMode.Track;
        break;
    }
    
    await AudioService.setRepeat(trackPlayerRepeat);
    setRepeat(nextRepeat);
  }, [repeat, setRepeat]);

  const addToQueueTrack = useCallback(async (track: Track) => {
    await AudioService.addToQueue(track);
  }, []);

  const removeFromQueueTrack = useCallback(async (trackId: string) => {
    await AudioService.removeFromQueue(trackId);
  }, []);

  const clearQueueTracks = useCallback(async () => {
    await AudioService.clearQueue();
    setQueue([]);
  }, [setQueue]);

  const setSleepTimerValue = useCallback((minutes: number | null) => {
    setSleepTimer(minutes);
  }, [setSleepTimer]);

  return {
    currentTrack,
    isPlaying,
    progress: progress.position,
    duration: progress.duration,
    buffered: progress.buffered,
    queue,
    history,
    shuffle,
    repeat,
    volume,
    rate,
    sleepTimerRemaining,
    sleepTimerEndTime,
    
    play,
    playQueue,
    pause,
    resume,
    togglePlayPause,
    next,
    previous,
    seek,
    seekForward,
    seekBackward,
    setVolume: setVolumeLevel,
    setRate: setRateValue,
    toggleShuffle,
    cycleRepeat,
    addToQueue: addToQueueTrack,
    removeFromQueue: removeFromQueueTrack,
    clearQueue: clearQueueTracks,
    setSleepTimer: setSleepTimerValue,
  };
};
