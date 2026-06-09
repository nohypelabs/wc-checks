// src/lib/sentry.ts - Sentry error tracking integration
// @ts-ignore
// @ts-ignore
// @ts-ignore
import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking
 *
 * Tracks:
 * - Unhandled exceptions
 * - Promise rejections
 * - Performance (Web Vitals, API calls)
 * - Session replay (10% sampled, 100% on errors)
 *
 * Privacy:
 * - Masks all text in replays
 * - Blocks all media in replays
 * - Filters out Authorization headers
 * - Only enabled in production
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Don't initialize if DSN not configured
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.warn('[Sentry] DSN not configured - error tracking disabled');
      console.warn('[Sentry] Add VITE_SENTRY_DSN to .env.local to enable');
    }
    return;
  }

  Sentry.init({
    dsn,

    // Environment (development, production, preview)
    environment: import.meta.env.MODE,

    // Integrations
    integrations: [
      // Performance monitoring (Web Vitals, API calls)
      new Sentry.BrowserTracing({
        // Which hosts to track
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.vercel\.app/,
          // Add your production domain here:
          // /^https:\/\/your-domain\.com/,
        ],
      }),

      // Session replay (watch what user did before error)
      new Sentry.Replay({
        // Privacy: mask all text
        maskAllText: true,
        // Privacy: block all images/videos
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    // 1.0 = 100% of transactions sent to Sentry
    // Lower this in production if needed (0.1 = 10%)
    tracesSampleRate: 1.0,

    // Session Replay
    // 0.1 = 10% of normal sessions recorded
    replaysSessionSampleRate: 0.1,
    // 1.0 = 100% of error sessions recorded
    replaysOnErrorSampleRate: 1.0,

    // Release tracking (tie errors to specific versions)
    release: `wc-checks@${import.meta.env.VITE_APP_VERSION || '3.0.0'}`,

    // Only send errors in production
    enabled: import.meta.env.PROD,

    // Privacy: Filter sensitive data before sending
    beforeSend(event, _hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Remove sensitive query params
      if (event.request?.query_string) {
        const sensitiveParams = ['token', 'password', 'secret', 'api_key'];
        sensitiveParams.forEach(param => {
          if (event.request?.query_string?.includes(param)) {
            event.request.query_string = '[REDACTED]';
          }
        });
      }

      return event;
    },

    // Ignore common errors (optional)
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Facebook flakiness
      'fb_xd_fragment',
      // Chrome extensions
      'Non-Error promise rejection captured',
      // ResizeObserver loop errors (harmless)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
  });

  // Log initialization (dev only)
  if (import.meta.env.DEV) {
    console.log('[Sentry] Initialized (but disabled in dev mode)');
  }
}

/**
 * Capture exception with custom context
 *
 * @example
 * ```ts
 * captureError(error, {
 *   feature: 'inspection-form',
 *   action: 'submit',
 *   inspectionId: '123',
 * });
 * ```
 */
export function captureError(
  error: Error,
  context?: {
    feature?: string;
    action?: string;
    [key: string]: any;
  }
) {
  Sentry.captureException(error, {
    tags: context
      ? {
          feature: context.feature,
          action: context.action,
        }
      : undefined,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 *
 * @example
 * ```ts
 * // After login
 * setUserContext(user);
 *
 * // On logout
 * clearUserContext();
 * ```
 */
export function setUserContext(user: {
  id: string;
  email: string;
  full_name?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.full_name || user.email,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb (track user actions)
 *
 * @example
 * ```ts
 * addBreadcrumb('inspection', 'User started inspection', {
 *   locationId: '123',
 * });
 * ```
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start performance transaction
 *
 * @example
 * ```ts
 * const transaction = startTransaction('inspection.submit', 'Inspection Submission');
 * try {
 *   await submitInspection(data);
 *   transaction.setStatus('ok');
 * } catch (error) {
 *   transaction.setStatus('unknown_error');
 *   throw error;
 * } finally {
 *   transaction.finish();
 * }
 * ```
 */
export function startTransaction(op: string, name: string) {
  return Sentry.startTransaction({ op, name });
}
