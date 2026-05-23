import { IngestionService } from './src/modules/knowledge/ingestion.service';
import { PrismaService } from './src/common/database/prisma.service';
import { Queue } from 'bullmq';

async function main() {
  const prisma = new PrismaService();
  const queue = new Queue('knowledge-ingestion');
  const service = new IngestionService(prisma, queue as any);
  const chunks = ["This is a test chunk.", "Another test chunk."];
  const atoms = await service.classify(chunks, "business-id-test");
  console.log("Classified atoms count:", atoms.length);
  console.log("Atoms:", JSON.stringify(atoms, null, 2));
  await (prisma as any).$disconnect();
  await queue.close();
}

main().catch(console.error);
