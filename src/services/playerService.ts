import TrackPlayer, { AppKilledPlaybackBehavior } from 'react-native-track-player';
import { Capability } from 'react-native-track-player/src/constants';

export const setupPlayer = async () => {
  await TrackPlayer.setupPlayer();
  
  await TrackPlayer.updateOptions({
    stopWithApp: false,
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
    ],
    compactCapabilities: [
      Capability.Play,
      Capability.Pause,
    ],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
    ],
    appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
  });
};

export const playTrack = async (track: any) => {
  await TrackPlayer.add([track]);
  await TrackPlayer.play();
};

export const pauseTrack = async () => {
  await TrackPlayer.pause();
};

export const skipNext = async () => {
  await TrackPlayer.skipToNext();
};

export const skipPrev = async () => {
  await TrackPlayer.skipToPrevious();
};