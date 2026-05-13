import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../src/stores/musicStore';
import { scanAlbumImage } from '../../src/services/aiService';

export default function ScanScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const addTrack = useStore(state => state.addTrack);
  
  const pickImage = async () => {
    setIsScanning(true);
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        
        // Convert image to base64
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        // Scan the image using AI
        const result = await scanAlbumImage(base64);
        
        if (result) {
          addTrack({
            id: Date.now().toString(),
            title: result.album,
            artist: result.artist,
            album: result.album,
            genre: null,
            year: result.year || null,
            duration: 0,
            path: '',
            artwork: '',
            blurhash: '',
            colors: [],
            waveformData: [],
            bpm: 0,
            key: null,
            energy: 0,
            valence: 0,
            mood: null,
            confidence: 0,
            isFavorite: false,
            rating: 0,
            playCount: 0,
            lastPlayed: null,
            dateAdded: new Date().toISOString(),
            bitrate: null,
            sampleRate: null,
            channels: null,
          });
          
          Alert.alert('Success', 'Album scanned successfully!');
        } else {
          Alert.alert('Error', 'Could not scan the album. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Album</Text>
      <Button
        title={isScanning ? 'Scanning...' : 'Pick Album Art'}
        onPress={pickImage}
        disabled={isScanning}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
});