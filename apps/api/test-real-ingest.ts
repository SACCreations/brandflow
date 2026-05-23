import { PrismaClient } from '@prisma/client';
import { IngestionService } from './src/modules/knowledge/ingestion.service';

async function main() {
  const prisma = new PrismaClient();
  const queue = { add: async () => {} };
  const service = new IngestionService(prisma as any, queue as any);
  
  const chunks = ["This is a test chunk number one.", "This is test chunk number two."];
  const businessId = "00000000-0000-0000-0001-000000000001";
  
  console.log("Classifying chunks...");
  const atoms = await service.classify(chunks, businessId);
  console.log("Classified atoms:", atoms);
  
  if (atoms.length > 0) {
    const indexed = await (service as any).index("test-source-id", businessId, atoms);
    console.log("Indexed new atoms:", indexed);
  }
  
  await prisma.$disconnect();
}
main().catch(console.error);
