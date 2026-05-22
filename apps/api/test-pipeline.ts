import { IngestionService } from './src/modules/knowledge/ingestion.service';
import { PrismaService } from './src/common/database/prisma.service';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const prisma = new PrismaService();
  const queue = new Queue('knowledge-ingestion');
  const service = new IngestionService(prisma, queue as any);
  
  const businessId = "00000000-0000-0000-0001-000000000001";
  const sourceId = "8e0331d1-abe6-4f3f-aad8-01dcd732ff0a";
  
  // We need to create a job first
  const job = await prisma.client.knowledgeJob.create({
    data: { sourceId, businessId, status: 'pending' },
  });

  console.log("Running pipeline for job", job.id);
  await service.runPipeline(job.id, sourceId, businessId, 'url', 'https://rentasst.com/blogs');
  console.log("Pipeline finished");
  
  await (prisma as any).$disconnect();
  await queue.close();
}

main().catch(console.error);
