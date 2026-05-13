import TrackPlayer from 'react-native-track-player';

export const setupPlayer = async () => {
  await TrackPlayer.setupPlayer();
  
  await TrackPlayer.updateOptions({
    stopWithApp: false,
    capabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
      TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
      TrackPlayer.CAPABILITY_STOP,
    ],
    compactCapabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
    ],
    notificationCapabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
      TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
    ],
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