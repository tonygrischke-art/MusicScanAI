import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ScanButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export default function ScanButton({ onPress, disabled = false }: ScanButtonProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      disabled={disabled}
    >
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.text}>Scan Album</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  gradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});