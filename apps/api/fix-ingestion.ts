import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { KnowledgeService } from './src/modules/knowledge/knowledge.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const knowledgeService = app.get(KnowledgeService);
  
  const businessId = "00000000-0000-0000-0001-000000000001";
  console.log("Triggering re-ingestion for all sources...");
  const result = await knowledgeService.triggerIngestionAll(businessId);
  console.log("Triggered:", result);
  
  await app.close();
}

main().catch(console.error);
