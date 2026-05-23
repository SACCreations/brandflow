import { PrismaClient } from '@prisma/client';
import { IngestionService } from './src/modules/knowledge/ingestion.service';
import { LLMGateway, TextSplitter, VectorService } from '@brandflow/ai';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up failed PDF jobs...');
  const deleted = await prisma.knowledgeJob.deleteMany({
    where: { status: 'failed', error: { contains: 'text (base64) is required' } }
  });
  console.log(`Deleted ${deleted.count} failed jobs.`);
  
  console.log('Fetching entries stuck as "fact"...');
  const entries = await prisma.knowledgeEntry.findMany({
    where: { classification: 'fact' }
  });
  console.log(`Found ${entries.length} entries.`);

  if (entries.length > 0) {
    // We cannot easily inject IngestionService from scratch here because it requires Queue
    // But we can just use Prisma to reset them or we can call the API if we had a token.
    console.log('Since we cannot easily run IngestionService outside nest context, please run the API endpoint or let the user know they can delete and re-upload the PDF, or wait for next sync.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
