import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

const SHAKE_THRESHOLD = 2.5;
const SHAKE_COOLDOWN = 1000; // ms

export function useShakeToShuffle(onShake: () => void) {
  const lastShake = useRef(0);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let subscription: any;

    const setup = async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!available) return;

        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const last = lastAccel.current;
          const deltaX = Math.abs(x - last.x);
          const deltaY = Math.abs(y - last.y);
          const deltaZ = Math.abs(z - last.z);
          const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

          lastAccel.current = { x, y, z };

          if (magnitude > SHAKE_THRESHOLD) {
            const now = Date.now();
            if (now - lastShake.current > SHAKE_COOLDOWN) {
              lastShake.current = now;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onShake();
            }
          }
        });
      } catch {
        // Accelerometer not available
      }
    };

    setup();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [onShake]);
}
