import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (!process.env['SENTRY_DSN']) {
    console.warn('SENTRY_DSN not found. Sentry is disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
    environment: process.env['NODE_ENV'] || 'development',
  });
}
