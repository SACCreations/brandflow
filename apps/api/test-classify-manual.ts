import { IngestionService } from './src/modules/knowledge/ingestion.service';
import { PrismaService } from './src/common/database/prisma.service';

async function main() {
  const prisma = new PrismaService();
  // Mock the queue
  const queue = { add: async () => {} };
  const service = new IngestionService(prisma, queue as any);
  
  const chunks = [
    "Test chunk 1: RentAsst provides high quality equipment.",
    "Test chunk 2: Their medical rental category is very popular."
  ];
  
  const businessId = "00000000-0000-0000-0001-000000000001";
  console.log("Classifying chunks...");
  const atoms = await service.classify(chunks, businessId);
  console.log("Returned atoms:", atoms);
  
  await (prisma as any).$disconnect();
}
main().catch(console.error);
