import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { LlmSettingsService } from './apps/api/src/modules/llm-settings/llm-settings.service';
import { BrandAnalyserService } from './apps/api/src/modules/brand/brand-analyser.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const llmSettings = app.get(LlmSettingsService);
  const brandAnalyser = app.get(BrandAnalyserService);
  
  const decrypted = await llmSettings.getDecryptedApiKey('00000000-0000-0000-0001-000000000001');
  console.log("Decrypted API Key length:", decrypted?.length);
  
  // Also we can call complete directly on gateway using BrandAnalyserService
  try {
     const gateway = (brandAnalyser as any).gateway;
     const res = await gateway.complete(
        "Return a JSON object { result: 'ok' }", 
        "Hi", 
        { provider: 'nvidia', apiKey: decrypted, jsonMode: true, model: 'meta/llama-3.1-70b-instruct' }
     );
     console.log("GATEWAY RESPONSE:", res);
  } catch(err: any) {
     console.error("GATEWAY ERROR:", err.message, err.response?.data);
  }
  
  await app.close();
}
run();
