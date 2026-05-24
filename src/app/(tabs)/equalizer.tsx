import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function EqualizerTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Equalizer</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#9CA3AF' },
});
