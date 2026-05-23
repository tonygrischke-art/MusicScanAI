import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  useEqualizerStore,
  EQ_BANDS,
  EQ_BAND_LABELS,
  EQ_PRESETS,
  EQ_MIN_DB,
  EQ_MAX_DB,
} from '../stores/useEqualizerStore';
import { useTheme } from '../components/ThemeProvider';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAND_WIDTH = (SCREEN_WIDTH - 80) / EQ_BANDS.length;

interface SliderBarProps {
  index: number;
  value: number;
  label: string;
  onChange: (index: number, value: number) => void;
  accentColor: string;
  isActive: boolean;
}

const SliderBar: React.FC<SliderBarProps> = ({ index, value, label, onChange, accentColor, isActive }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  useEffect(() => {
    const normalized = (value - EQ_MIN_DB) / (EQ_MAX_DB - EQ_MIN_DB);
    Animated.spring(animatedHeight, {
      toValue: normalized * 120,
      useNativeDriver: false,
      speed: 12,
      bounciness: 4,
    }).start();

    Animated.timing(glowOpacity, {
      toValue: isActive && Math.abs(value) > 2 ? 1 : 0.3,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, isActive]);

  const handlePressIn = useCallback(() => {
    isDragging.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMove = useCallback((evt: any) => {
    if (!isDragging.current) return;
    const { locationY } = evt.nativeEvent;
    const normalized = 1 - Math.max(0, Math.min(1, locationY / 120));
    const dbValue = EQ_MIN_DB + normalized * (EQ_MAX_DB - EQ_MIN_DB);
    const snapped = Math.round(dbValue * 2) / 2;
    onChange(index, snapped);
  }, [index, onChange]);

  const normalized = (value - EQ_MIN_DB) / (EQ_MAX_DB - EQ_MIN_DB);

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.dbLabel}>{value > 0 ? `+${value}` : value}dB</Text>
      <View
        style={styles.sliderTrack}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handlePressIn}
        onResponderRelease={handlePressOut}
        onResponderMove={handleMove}
      >
        <View style={styles.sliderTrackBg} />
        <Animated.View
          style={[
            styles.sliderFill,
            {
              height: animatedHeight,
              backgroundColor: accentColor,
              shadowColor: accentColor,
              shadowOpacity: glowOpacity as any,
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        />
        <View style={styles.centerLine} />
      </View>
      <Text style={styles.bandLabel}>{label}</Text>
    </View>
  );
};

const Visualizer: React.FC<{ data: number[]; accentColor: string }> = ({ data, accentColor }) => {
  return (
    <View style={styles.visualizerContainer}>
      {data.map((val, i) => (
        <Animated.View
          key={i}
          style={[
            styles.visualizerBar,
            {
              height: Math.max(4, val * 60),
              backgroundColor: accentColor,
              opacity: 0.6 + val * 0.4,
            },
          ]}
        />
      ))}
    </View>
  );
};

const PresetChip: React.FC<{
  name: string;
  isSelected: boolean;
  onPress: () => void;
  accentColor: string;
  isCustom?: boolean;
  onLongPress?: () => void;
}> = ({ name, isSelected, onPress, accentColor, isCustom, onLongPress }) => (
  <Pressable
    onPress={onPress}
    onLongPress={onLongPress}
    style={[
      styles.presetChip,
      isSelected && { backgroundColor: accentColor + '30', borderColor: accentColor },
    ]}
  >
    <Text style={[styles.presetChipText, isSelected && { color: accentColor }]}>
      {isCustom ? '★ ' : ''}{name}
    </Text>
  </Pressable>
);

export const Equalizer: React.FC = () => {
  const { theme, accentColor } = useTheme();
  const store = useEqualizerStore();
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [presetName, setPresetName] = React.useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleBandChange = useCallback((index: number, value: number) => {
    store.setBand(index, value);
  }, [store]);

  const handlePresetPress = useCallback((preset: typeof EQ_PRESETS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.applyPreset(preset);
  }, [store]);

  const handleSavePreset = useCallback(() => {
    if (presetName.trim()) {
      store.saveCustomPreset(presetName.trim());
      setPresetName('');
      setShowSaveModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [presetName, store]);

  const allPresets = [
    ...EQ_PRESETS,
    ...store.customPresets.map((p) => ({ name: p.name, bands: p.bands, isCustom: true, id: p.id })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Equalizer</Text>
        <Pressable
          onPress={() => store.setEnabled(!store.isEnabled)}
          style={[
            styles.toggleBtn,
            { backgroundColor: store.isEnabled ? accentColor + '30' : theme.surface },
          ]}
        >
          <Text style={[styles.toggleText, { color: store.isEnabled ? accentColor : theme.textSecondary }]}>
            {store.isEnabled ? 'ON' : 'OFF'}
          </Text>
        </Pressable>
      </View>

      {/* Visualizer */}
      <Visualizer data={store.visualizerData} accentColor={accentColor} />

      {/* Preset Chips */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.presetScroll}
        contentContainerStyle={styles.presetScrollContent}
      >
        {allPresets.map((preset, i) => (
          <PresetChip
            key={preset.name + i}
            name={preset.name}
            isSelected={store.presetName === preset.name}
            onPress={() => handlePresetPress(preset)}
            accentColor={accentColor}
            isCustom={'isCustom' in preset && preset.isCustom}
            onLongPress={'id' in preset ? () => store.deleteCustomPreset((preset as any).id) : undefined}
          />
        ))}
        <Pressable
          onPress={() => setShowSaveModal(true)}
          style={[styles.presetChip, { borderColor: theme.border }]}
        >
          <Text style={[styles.presetChipText, { color: theme.textSecondary }]}>+ Save</Text>
        </Pressable>
      </ScrollView>

      {/* EQ Sliders */}
      <View style={styles.slidersRow}>
        {EQ_BANDS.map((freq, i) => (
          <SliderBar
            key={freq}
            index={i}
            value={store.bands[i]}
            label={EQ_BAND_LABELS[i]}
            onChange={handleBandChange}
            accentColor={accentColor}
            isActive={store.isEnabled}
          />
        ))}
      </View>

      {/* Bass Boost & Stereo Widener */}
      <View style={styles.extraControls}>
        <View style={styles.extraControl}>
          <Text style={[styles.extraLabel, { color: theme.text }]}>Bass Boost</Text>
          <View style={styles.extraTrack}>
            {[0, 25, 50, 75, 100].map((v) => (
              <Pressable
                key={v}
                onPress={() => {
                  store.setBassBoost(v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.extraDot,
                  store.bassBoost === v && { backgroundColor: accentColor },
                ]}
              >
                <Text style={[styles.extraDotText, { color: store.bassBoost === v ? '#000' : theme.textSecondary }]}>
                  {v}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => {
            store.setStereoWidener(!store.stereoWidener);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={[
            styles.widenerBtn,
            { backgroundColor: store.stereoWidener ? accentColor + '30' : theme.surface },
          ]}
        >
          <Text style={[styles.widenerText, { color: store.stereoWidener ? accentColor : theme.textSecondary }]}>
            {store.stereoWidener ? '🎧 Stereo Wide' : '🔈 Stereo Normal'}
          </Text>
        </Pressable>
      </View>

      {/* Save Preset Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Save Custom Preset</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: accentColor }]}
              placeholder="Preset name..."
              placeholderTextColor={theme.textSecondary}
              value={presetName}
              onChangeText={setPresetName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowSaveModal(false)} style={styles.modalBtn}>
                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSavePreset} style={[styles.modalBtn, { backgroundColor: accentColor }]}>
                <Text style={{ color: '#000', fontWeight: '700' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleText: {
    fontWeight: '700',
    fontSize: 14,
  },
  visualizerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 70,
    gap: 3,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  visualizerBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 4,
  },
  presetScroll: {
    maxHeight: 50,
    marginBottom: 20,
  },
  presetScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  slidersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sliderContainer: {
    width: BAND_WIDTH,
    alignItems: 'center',
  },
  dbLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    fontWeight: '600',
  },
  sliderTrack: {
    width: 28,
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    height: 120,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sliderFill: {
    width: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 0,
  },
  centerLine: {
    position: 'absolute',
    bottom: 58,
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bandLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
    fontWeight: '500',
  },
  extraControls: {
    paddingHorizontal: 20,
    gap: 16,
  },
  extraControl: {
    gap: 8,
  },
  extraLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  extraTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  extraDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraDotText: {
    fontSize: 11,
    fontWeight: '600',
  },
  widenerBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  widenerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 80,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
