import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env['APP_PORT'] ?? '4000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  url: process.env['APP_URL'] ?? 'http://localhost:4000',
  webUrl: process.env['WEB_URL'] ?? 'http://localhost:3000',
  corsOrigins: process.env['CORS_ORIGINS'] ?? 'http://localhost:3000',
  jwt: {
    secret: process.env['JWT_SECRET'] ?? '',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] ?? '',
    accessExpiry: process.env['JWT_ACCESS_EXPIRY'] ?? '15m',
    refreshExpiry: process.env['JWT_REFRESH_EXPIRY'] ?? '7d',
  },
  mfa: {
    issuer: process.env['MFA_ISSUER'] ?? 'BrandFlow',
  },
  encryptionKey: process.env['ENCRYPTION_KEY'] ?? '',
  rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000', 10),
  rateLimitMax: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '100', 10),
}));
