import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLibrary } from '../stores/useLibraryStore';
import { useTheme } from '../components/ThemeProvider';
import { Track } from '../types';
import { TAB_BAR_HEIGHT } from '../utils/constants';

export default function MetadataEditorScreen() {
  const { theme, accentColor } = useTheme();
  const router = useRouter();
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const { tracks, updateTrack } = useLibrary();

  const track = tracks.find(t => t.id === trackId);

  const [title, setTitle] = useState(track?.title || '');
  const [artist, setArtist] = useState(track?.artist || '');
  const [album, setAlbum] = useState(track?.album || '');
  const [genre, setGenre] = useState(track?.genre || '');
  const [year, setYear] = useState(track?.year?.toString() || '');
  const [trackNumber, setTrackNumber] = useState('');
  const [comment, setComment] = useState('');

  const hasChanges = track && (
    title !== track.title ||
    artist !== track.artist ||
    album !== track.album ||
    genre !== track.genre ||
    year !== (track.year?.toString() || '')
  );

  const handleSave = useCallback(() => {
    if (!track) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateTrack(track.id, {
      title: title || track.title,
      artist: artist || track.artist,
      album: album || track.album,
      genre: genre || track.genre,
      year: year ? parseInt(year) : track.year,
    });

    router.back();
  }, [track, title, artist, album, genre, year, updateTrack, router]);

  if (!track) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Track not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: theme.text, fontSize: 24 }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Edit Metadata</Text>
        {hasChanges && (
          <Pressable onPress={handleSave} style={[styles.saveBtn, { backgroundColor: accentColor }]}>
            <Text style={{ color: '#000', fontWeight: '700' }}>Save</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 20 }}>
        {/* Album Art Preview */}
        <View style={styles.artSection}>
          {track.artwork ? (
            <Image source={{ uri: track.artwork }} style={styles.artImage} />
          ) : (
            <View style={[styles.artPlaceholder, { backgroundColor: theme.surface }]}>
              <Text style={{ fontSize: 48 }}>🎵</Text>
            </View>
          )}
          <Pressable style={[styles.changeArtBtn, { borderColor: accentColor }]}>
            <Text style={{ color: accentColor, fontWeight: '600' }}>Change Artwork</Text>
          </Pressable>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <FieldInput label="Title" value={title} onChangeText={setTitle} theme={theme} accentColor={accentColor} />
          <FieldInput label="Artist" value={artist} onChangeText={setArtist} theme={theme} accentColor={accentColor} />
          <FieldInput label="Album" value={album} onChangeText={setAlbum} theme={theme} accentColor={accentColor} />
          <FieldInput label="Genre" value={genre} onChangeText={setGenre} theme={theme} accentColor={accentColor} />
          <FieldInput label="Year" value={year} onChangeText={setYear} theme={theme} accentColor={accentColor} keyboardType="numeric" />
          <FieldInput label="Track Number" value={trackNumber} onChangeText={setTrackNumber} theme={theme} accentColor={accentColor} keyboardType="numeric" />
          <FieldInput label="Comment" value={comment} onChangeText={setComment} theme={theme} accentColor={accentColor} multiline />
        </View>

        {/* File info */}
        <View style={[styles.fileInfo, { backgroundColor: theme.surface }]}>
          <Text style={[styles.fileInfoLabel, { color: theme.textSecondary }]}>File path</Text>
          <Text style={[styles.fileInfoValue, { color: theme.text }]} numberOfLines={2}>{track.path}</Text>
          <Text style={[styles.fileInfoLabel, { color: theme.textSecondary, marginTop: 8 }]}>
            Duration: {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
          </Text>
          {track.bitrate && (
            <Text style={[styles.fileInfoLabel, { color: theme.textSecondary }]}>
              {track.bitrate}kbps {track.sampleRate ? `${track.sampleRate}Hz` : ''}
            </Text>
          )}
        </View>

        {hasChanges && (
          <Pressable onPress={handleSave} style={[styles.saveBottomBtn, { backgroundColor: accentColor }]}>
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>Save Changes</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const FieldInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  theme: any;
  accentColor: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
}> = ({ label, value, onChangeText, theme, accentColor, keyboardType, multiline }) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
    <TextInput
      style={[
        styles.fieldInput,
        { color: theme.text, borderColor: theme.border },
        multiline && { height: 80, textAlignVertical: 'top' },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={`${label}...`}
      placeholderTextColor={theme.textSecondary + '80'}
      keyboardType={keyboardType}
      multiline={multiline}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: '800', flex: 1 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  artSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  artImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  artPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeArtBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  fields: {
    paddingHorizontal: 20,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  fileInfo: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    gap: 4,
  },
  fileInfoLabel: {
    fontSize: 12,
  },
  fileInfoValue: {
    fontSize: 13,
  },
  saveBottomBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
});
