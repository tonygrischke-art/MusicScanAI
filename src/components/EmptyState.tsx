import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = memo(({
  icon = '🎵',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(100)}
      style={styles.container}
    >
      <Animated.Text
        entering={ZoomIn.duration(500).delay(200)}
        style={styles.icon}
      >
        {icon}
      </Animated.Text>
      
      <Animated.View entering={FadeIn.duration(400).delay(300)}>
        <Text style={styles.title}>{title}</Text>
        
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
        
        {actionLabel && onAction && (
          <View style={styles.actionContainer}>
            <Button
              title={actionLabel}
              onPress={onAction}
              variant="primary"
              size="medium"
            />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 24,
  },
});

export default EmptyState;
