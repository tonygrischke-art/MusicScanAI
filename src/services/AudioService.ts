import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
  State,
} from 'react-native-track-player';
import { Track } from '../types';
import { SERVICE_NAME } from '../utils/constants';

export const setupAudioService = async () => {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 1024 * 100,
      autoHandleInterruptions: true,
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 1,
    });

    return true;
  } catch (error) {
    console.error('Error setting up audio service:', error);
    return false;
  }
};

export const PlaybackService = async function() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
};

const trackToPlayerTrack = (track: Track) => ({
  id: track.id,
  url: track.path,
  title: track.title,
  artist: track.artist,
  album: track.album || '',
  artwork: track.artwork || undefined,
  duration: track.duration,
});

export const AudioService = {
  async play(track: Track) {
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(trackToPlayerTrack(track));
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  },

  async playQueue(tracks: Track[], startIndex = 0) {
    try {
      await TrackPlayer.reset();
      const playerTracks = tracks.map(trackToPlayerTrack);
      await TrackPlayer.add(playerTracks);
      if (startIndex > 0) {
        await TrackPlayer.skip(startIndex);
      }
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing queue:', error);
      throw error;
    }
  },

  async addToQueue(track: Track) {
    try {
      await TrackPlayer.add(trackToPlayerTrack(track));
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  },

  async removeFromQueue(trackId: string) {
    try {
      const queue = await TrackPlayer.getQueue();
      const index = queue.findIndex(t => t.id === trackId);
      if (index !== -1) {
        await TrackPlayer.remove(index);
      }
    } catch (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  },

  async clearQueue() {
    try {
      await TrackPlayer.reset();
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  },

  async pause() {
    try {
      await TrackPlayer.pause();
    } catch (error) {
      console.error('Error pausing:', error);
      throw error;
    }
  },

  async resume() {
    try {
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error resuming:', error);
      throw error;
    }
  },

  async skipToNext() {
    try {
      await TrackPlayer.skipToNext();
    } catch (error) {
      console.error('Error skipping to next:', error);
    }
  },

  async skipToPrevious() {
    try {
      const position = await TrackPlayer.getPosition();
      if (position > 3) {
        await TrackPlayer.seekTo(0);
      } else {
        await TrackPlayer.skipToPrevious();
      }
    } catch (error) {
      console.error('Error skipping to previous:', error);
    }
  },

  async seekTo(position: number) {
    try {
      await TrackPlayer.seekTo(position);
    } catch (error) {
      console.error('Error seeking:', error);
      throw error;
    }
  },

  async setVolume(volume: number) {
    try {
      await TrackPlayer.setVolume(volume);
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  },

  async setRate(rate: number) {
    try {
      await TrackPlayer.setRate(rate);
    } catch (error) {
      console.error('Error setting rate:', error);
      throw error;
    }
  },

  async setRepeat(mode: RepeatMode) {
    try {
      await TrackPlayer.setRepeatMode(mode);
    } catch (error) {
      console.error('Error setting repeat:', error);
      throw error;
    }
  },

  async setShuffle(enabled: boolean) {
    try {
      const queue = await TrackPlayer.getQueue();
      if (enabled && queue.length > 1) {
        const currentIndex = await TrackPlayer.getActiveTrackIndex();
        const currentTrack = currentIndex !== undefined ? queue[currentIndex] : queue[0];
        
        const otherTracks = currentIndex !== undefined 
          ? queue.filter((_, i) => i !== currentIndex) 
          : queue.slice(1);
        const shuffled = otherTracks.sort(() => Math.random() - 0.5);
        
        await TrackPlayer.reset();
        if (currentTrack) {
          await TrackPlayer.add(currentTrack);
        }
        await TrackPlayer.add(shuffled);
        if (currentTrack) {
          await TrackPlayer.skip(0);
        }
      }
    } catch (error) {
      console.error('Error setting shuffle:', error);
      throw error;
    }
  },

  async getState() {
    try {
      const state = await TrackPlayer.getPlaybackState();
      const isPlaying = state.state === State.Playing;
      const position = await TrackPlayer.getPosition();
      const duration = await TrackPlayer.getDuration();
      const trackIndex = await TrackPlayer.getActiveTrackIndex();
      const queue = await TrackPlayer.getQueue();
      const currentTrack = trackIndex !== undefined ? queue[trackIndex] : null;
      
      return {
        isPlaying,
        position,
        duration,
        currentTrack,
        trackIndex,
        queue,
      };
    } catch (error) {
      console.error('Error getting state:', error);
      return {
        isPlaying: false,
        position: 0,
        duration: 0,
        currentTrack: null,
        trackIndex: undefined,
        queue: [],
      };
    }
  },

  async getQueue() {
    try {
      return await TrackPlayer.getQueue();
    } catch {
      return [];
    }
  },
};

export default AudioService;
