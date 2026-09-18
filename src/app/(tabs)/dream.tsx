import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../components/ThemeProvider';
import { JOURNEY_TEMPLATES } from '../../types/journey';

export default function DreamTabScreen() {
  const router = useRouter();
  const { theme, accentColor } = useTheme();

  const navigateToBuilder = () => {
    router.push('/journey-builder');
  };

  const navigateToJourney = (templateId: string) => {
    // For now, just go to builder with template pre-selected
    router.push(`/journey-builder?template=${templateId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dream Playlist Generator</Text>
        <Text style={styles.subtitle}>
          Create emotional journeys through your music
        </Text>
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={navigateToBuilder} activeOpacity={0.8}>
        <Text style={styles.mainButtonIcon}>✨</Text>
        <Text style={styles.mainButtonText}>Create New Journey</Text>
        <Text style={styles.mainButtonHint}>Tap to start</Text>
      </TouchableOpacity>

      <View style={styles.templatesSection}>
        <Text style={styles.sectionTitle}>Journey Templates</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templatesContainer}
        >
          {JOURNEY_TEMPLATES.map(template => (
            <TouchableOpacity
              key={template.id}
              style={[styles.templateCard, { borderColor: template.color }]}
              onPress={() => navigateToJourney(template.id)}
            >
              <View style={styles.templateCardContent}>
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <View style={styles.templateInfo}>
                  <Text style={[styles.templateName, { color: template.color }]}>
                    {template.name}
                  </Text>
                  <Text style={styles.templateDesc}>{template.description}</Text>
                </View>
              </View>
              <View style={styles.templateArrow}>
                <Text style={styles.templateArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.featureList}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>1</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Pick Your Moods</Text>
            <Text style={styles.featureDesc}>
              Choose a starting mood and ending mood on the emotional canvas
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>2</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Set Duration</Text>
            <Text style={styles.featureDesc}>
              Select how long you want your journey to be (15min - 4hrs)
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>3</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>AI Generates Journey</Text>
            <Text style={styles.featureDesc}>
              Bezier curves map emotional arcs; tracks selected for smooth transitions
            </Text>
          </View>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureNumber}>4</Text>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Enjoy the Ride</Text>
            <Text style={styles.featureDesc}>
              Play with visual journey progress and mood-aware transitions
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  mainButton: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
  },
  mainButtonIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  mainButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  mainButtonHint: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  templatesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  templatesContainer: {
    paddingBottom: 10,
    gap: 12,
  },
  templateCard: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  templateDesc: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  templateArrow: {
    padding: 8,
  },
  templateArrowText: {
    fontSize: 20,
    color: '#6B7280',
  },
  featureList: {
    padding: 20,
    paddingBottom: 100,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  featureNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});