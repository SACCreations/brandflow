import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  defaultProvider: process.env['AI_DEFAULT_PROVIDER'] ?? 'openai',
  fallbackProvider: process.env['AI_FALLBACK_PROVIDER'] ?? 'anthropic',
  requestTimeoutMs: parseInt(process.env['AI_REQUEST_TIMEOUT_MS'] ?? '300000', 10),
  openaiApiKey: process.env['OPENAI_API_KEY'] ?? '',
  anthropicApiKey: process.env['ANTHROPIC_API_KEY'] ?? '',
}));
