import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { initSentry } from './common/observability/sentry.init';
import { SentryFilter } from './common/filters/sentry.filter';

function loadEnvManual() {
  const possiblePaths = [
    path.join(__dirname, '../.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'apps/api/.env'),
  ];
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const index = trimmed.indexOf('=');
        if (index === -1) continue;
        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim();
        
        // Override process.env if currently empty, not defined, or holds default placeholders
        if (!process.env[key] || process.env[key] === '' || process.env[key].startsWith('change-me')) {
          process.env[key] = value;
        }
      }
      console.log(`[ManualEnv] Loaded and resolved keys from: ${envPath}`);
      break;
    }
  }
}

async function bootstrap() {
  loadEnvManual();
  initSentry();
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    rawBody: true,
  });

  // ─── WebSocket Adapter ───────────────────────────────────────
  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // ─── Correlation ID (before all other middleware) ─────────────
  const correlationMiddleware = new CorrelationIdMiddleware();
  app.use(correlationMiddleware.use.bind(correlationMiddleware));

  const config = app.get(ConfigService);


  // ─── Environment Keys Validation ─────────────────────────────
  console.log('DEBUG env keys:', {
    processOpenAi: process.env['OPENAI_API_KEY'],
    processAnthropic: process.env['ANTHROPIC_API_KEY'],
    processEncryption: process.env['ENCRYPTION_KEY'],
    configOpenAi: config.get<string>('OPENAI_API_KEY'),
    configLlmOpenAi: config.get<string>('llm.openaiApiKey'),
    configAppEncryption: config.get<string>('app.encryptionKey'),
  });

  const openAiKey = config.get<string>('llm.openaiApiKey') || process.env['OPENAI_API_KEY'];
  const anthropicKey = config.get<string>('llm.anthropicApiKey') || process.env['ANTHROPIC_API_KEY'];
  const encryptionKey = config.get<string>('app.encryptionKey') || process.env['ENCRYPTION_KEY'];

  const missingKeys: string[] = [];
  if (!openAiKey) missingKeys.push('OPENAI_API_KEY');
  if (!anthropicKey) missingKeys.push('ANTHROPIC_API_KEY');
  if (!encryptionKey || encryptionKey.startsWith('change-me')) missingKeys.push('ENCRYPTION_KEY (must not be placeholder)');

  if (missingKeys.length > 0) {
    console.error(`
============================================================
🚨 CRITICAL STARTUP ERROR: MISSING REQUIRED AI OR ENCRYPTION KEYS!
============================================================
The following required keys are missing or invalid in .env:
${missingKeys.map(k => `  - ${k}`).join('\n')}

To prevent silent failures in LLMGateway or encryption-dependent
modules, startup has been aborted. Please update your .env.
============================================================
`);
    throw new Error(`Missing environment keys: ${missingKeys.join(', ')}`);
  }

  const port = config.get<number>('app.port', 4000);
  const corsOrigins = config.get<string>('app.corsOrigins', 'http://localhost:3000,http://localhost:3002');



  // ─── Security ────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: process.env['NODE_ENV'] === 'production' ? undefined : false,
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('NODE_ENV') === 'production'
      ? corsOrigins.split(',').map((o) => o.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ─── Global Pipes & Filters ──────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new SentryFilter(), new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // ─── API Prefix ──────────────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: [
      'health',
      { path: 'social/linkedin/callback', method: RequestMethod.GET },
    ],
  });

  // ─── Swagger ─────────────────────────────────────────────────
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('BrandFlow API')
      .setDescription('AI Brand & Marketing Automation Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & session management')
      .addTag('business', 'Workspace management')
      .addTag('brand', 'Brand profiles & governance')
      .addTag('knowledge', 'Knowledge base management')
      .addTag('prompt', 'Prompt versioning & management')
      .addTag('content', 'Content generation & management')
      .addTag('campaign', 'Campaign management')
      .addTag('approval', 'Approval workflows')
      .addTag('social', 'Social account connections')
      .addTag('scheduler', 'Content scheduling')
      .addTag('automation', 'Automation flows')
      .addTag('analytics', 'Performance analytics')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`🚀 BrandFlow API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);

  // ─── Graceful Shutdown ───────────────────────────────────────
  app.enableShutdownHooks();
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n⏹️  Received ${signal} — shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  }
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

