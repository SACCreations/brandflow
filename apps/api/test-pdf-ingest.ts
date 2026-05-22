import { IngestionService } from './src/modules/knowledge/ingestion.service';
import { PrismaService } from './src/common/database/prisma.service';

async function main() {
  const prisma = new PrismaService();
  const queue = { add: async () => {} };
  const service = new IngestionService(prisma, queue as any);
  
  // We'll manually call classify on 2 dummy chunks to see what it returns
  const chunks = ["PDF chunk 1", "PDF chunk 2"];
  const businessId = "00000000-0000-0000-0001-000000000001";
  
  const atoms = await service.classify(chunks, businessId);
  console.log("Returned atoms:", atoms);
  
  // Then we will manually call index
  const indexed = await (service as any).index("test-source-id", businessId, atoms);
  console.log("Indexed:", indexed);
  
  await (prisma as any).$disconnect();
}
main().catch(console.error);
