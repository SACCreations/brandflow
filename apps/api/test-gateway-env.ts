import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { IngestionService } from './src/modules/knowledge/ingestion.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ingestionService = app.get(IngestionService);
  
  const atoms = await ingestionService.classify(["Whitespace chunk"], "test-biz");
  console.log("Classify Result:", atoms);
  await app.close();
}
main();
