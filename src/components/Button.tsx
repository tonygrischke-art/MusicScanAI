import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTheme } from './ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = memo(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}) => {
  const { accentColor } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return 'rgba(255, 255, 255, 0.1)';
    switch (variant) {
      case 'primary':
        return accentColor;
      case 'secondary':
        return 'rgba(255, 255, 255, 0.1)';
      case 'outline':
        return 'transparent';
      case 'ghost':
        return 'transparent';
      default:
        return accentColor;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return disabled ? 'rgba(255, 255, 255, 0.2)' : accentColor;
    }
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return 'rgba(255, 255, 255, 0.4)';
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
        return accentColor;
      case 'ghost':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      style={fullWidth ? { width: '100%' } : undefined}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: variant === 'outline' ? 2 : 0,
            ...getPadding(),
          },
          pressed && styles.pressed,
          fullWidth && styles.fullWidth,
        ]}
      >
        {loading ? (
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
            Loading...
          </Text>
        ) : (
          <View style={styles.content}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    fontSize: 18,
  },
});

export default Button;
