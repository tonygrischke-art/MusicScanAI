import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';

// Optional Sentry - use dynamic require to avoid TypeScript errors
const Sentry = (() => {
  try {
    return require('@sentry/react-native');
  } catch {
    return null;
  }
})();

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Trigger haptic feedback on error
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Log to Sentry if available
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
      Sentry.captureException(error, {
        extra: errorInfo,
      });
    }

    // Log to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.stackContainer}>
                <Text style={styles.stackTitle}>Stack Trace:</Text>
                <Text style={styles.stackText}>
                  {this.state.error.stack}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Try Again"
                onPress={this.resetErrorBoundary}
                color="#8B5CF6"
              />
              <Button
                title="Report Issue"
                onPress={() => {
                  if (typeof Sentry !== 'undefined' && Sentry.captureException) {
                    Sentry.captureMessage('User tapped Report Issue from ErrorBoundary');
                  }
                }}
                color="#EF4444"
              />
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    maxWidth: '90%',
    width: '100%',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  stackContainer: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    maxHeight: 200,
  },
  stackTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 8,
  },
  stackText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
});

export default ErrorBoundary;