import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ContentService } from './modules/content/content.service';
import { PrismaClient } from '@prisma/client';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contentService = app.get(ContentService);
  const prisma = new PrismaClient();

  const brand = await prisma.brand.findFirst();
  if (!brand) return console.log('no brand');
  
  try {
    console.log('Fetching topics for', brand.name);
    const topics = await contentService.suggestTopics(brand.businessId, brand.id, 'SMO Poster');
    console.log('Result:', JSON.stringify(topics, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }

  await app.close();
  await prisma.$disconnect();
}

run().catch(console.error);
