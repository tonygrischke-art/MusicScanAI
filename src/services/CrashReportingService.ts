// Optional Sentry - use dynamic require to avoid TypeScript errors
const Sentry: any = (() => {
  try {
    return require('@sentry/react-native');
  } catch {
    return null;
  }
})();

import Constants from 'expo-constants';

let sentryInitialized = false;

export function initCrashReporting(): void {
  if (sentryInitialized) {
    console.log('[CrashReporting] Already initialized');
    return;
  }

  // Get DSN from Expo config (set via app.json extra or .env)
  const dsn = Constants.expoConfig?.extra?.sentryDSN || 
              process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('[CrashReporting] No Sentry DSN found - crash reporting disabled');
    console.warn('[CrashReporting] Set EXPO_PUBLIC_SENTRY_DSN in .env or app.json extra.sentryDSN');
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: __DEV__ ? 'development' : 'production',
      tracesSampleRate: 1.0,
      enableNativeCrashHandling: true,
      attachStacktrace: true,
      debug: __DEV__,
      beforeSend(event: any, hint: any) {
        // Filter out non-error events in production
        if (!__DEV__ && event.level === 'log') {
          return null;
        }
        return event;
      },
      // Add custom tags
      initialScope: {
        tags: {
          app_version: Constants.expoConfig?.version || '1.0.0',
          platform: Constants.platform?.ios ? 'ios' : 'android',
        },
      },
    });

    sentryInitialized = true;
    console.log('[CrashReporting] Sentry initialized successfully');
  } catch (error) {
    console.error('[CrashReporting] Failed to initialize Sentry:', error);
  }
}

export function captureException(error: Error, context?: Record<string, any>): void {
  if (!sentryInitialized) {
    console.warn('[CrashReporting] Sentry not initialized - cannot capture exception');
    return;
  }

  try {
    Sentry.captureException(error, {
      extra: context,
    });
  } catch (e) {
    console.error('[CrashReporting] Failed to capture exception:', e);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
  if (!sentryInitialized) {
    console.warn('[CrashReporting] Sentry not initialized - cannot capture message');
    return;
  }

  try {
    Sentry.captureMessage(message, level, {
      extra: context,
    });
  } catch (e) {
    console.error('[CrashReporting] Failed to capture message:', e);
  }
}

export function setUserContext(user: { id: string; email?: string; username?: string } | null): void {
  if (!sentryInitialized) return;

  try {
    if (user) {
      Sentry.setUser(user);
    } else {
      Sentry.setUser(null);
    }
  } catch (e) {
    console.error('[CrashReporting] Failed to set user context:', e);
  }
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, any>): void {
  if (!sentryInitialized) return;

  try {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  } catch (e) {
    console.error('[CrashReporting] Failed to add breadcrumb:', e);
  }
}

export function startTransaction(name: string, op: string): any {
  if (!sentryInitialized) return null;

  try {
    return Sentry.startTransaction({ name, op });
  } catch (e) {
    console.error('[CrashReporting] Failed to start transaction:', e);
    return null;
  }
}

// Wrapper for async functions with automatic error capture
export function withErrorCapture<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error as Error, context);
      throw error;
    }
  }) as T;
}

export default {
  initCrashReporting,
  captureException,
  captureMessage,
  setUserContext,
  addBreadcrumb,
  startTransaction,
  withErrorCapture,
};