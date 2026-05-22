import { PrismaClient } from '@prisma/client';
import { IngestionService } from './src/modules/knowledge/ingestion.service';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const prisma = new PrismaClient();
  const queue = { add: async () => {} };
  const service = new IngestionService(prisma as any, queue as any);
  
  const businessId = "00000000-0000-0000-0001-000000000001";
  const sourceId = uuidv4();
  
  await prisma.knowledgeSource.create({
    data: {
      id: sourceId,
      businessId,
      name: "Standalone Test URL",
      type: "url",
      sourceUrl: "https://rentasst.com/industries/industry/medical-rental",
      status: "pending",
      metadata: {}
    }
  });

  const job = await prisma.knowledgeJob.create({
    data: { sourceId, businessId, status: 'pending' },
  });

  console.log("Running standalone pipeline...");
  await service.runPipeline(job.id, sourceId, businessId, "url", "https://rentasst.com/industries/industry/medical-rental");
  
  const entries = await prisma.knowledgeEntry.findMany({
    where: { sourceId }
  });
  
  console.log("Indexed entries:", entries.map(e => e.content));
  await prisma.$disconnect();
}
main().catch(console.error);
