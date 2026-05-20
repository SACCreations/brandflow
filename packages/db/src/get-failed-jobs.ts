import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching latest image generation jobs...');
  const jobs = await prisma.imageGenerationJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('Latest 5 image generation jobs:', JSON.stringify(jobs, null, 2));

  console.log('Fetching latest AI image logs...');
  const logs = await prisma.aIImageLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('Latest 5 AI image logs:', JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
