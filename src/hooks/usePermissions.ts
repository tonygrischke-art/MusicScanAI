import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { useUIStore } from '../stores/useUIStore';

interface PermissionState {
  mediaPermission: MediaLibrary.PermissionResponse | null;
  loading: boolean;
  hasPermission: boolean;
}

interface UsePermissionsReturn extends PermissionState {
  requestMediaPermission: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const [state, setState] = useState<PermissionState>({
    mediaPermission: null,
    loading: true,
    hasPermission: false,
  });

  const { showNotification } = useUIStore();

  const checkPermissions = useCallback(async () => {
    try {
      const permission = await MediaLibrary.getPermissionsAsync();
      setState({
        mediaPermission: permission,
        loading: false,
        hasPermission: permission.granted === true,
      });
    } catch (error) {
      console.error('[usePermissions] Failed to check permissions:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const requestMediaPermission = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      
      const granted = permission.granted === true;
      
      setState({
        mediaPermission: permission,
        loading: false,
        hasPermission: granted,
      });

      if (!granted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showNotification('MusicScan AI needs access to your music library to scan and play tracks.', 'warning');
        return false;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotification('Music library access granted. Scanning will begin shortly.', 'success');
      return true;
    } catch (error) {
      console.error('[usePermissions] Failed to request media permission:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, [showNotification]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    ...state,
    requestMediaPermission,
    checkPermissions,
  };
}

export default usePermissions;