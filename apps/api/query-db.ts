import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.imageGenerationJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('--- Image Generation Jobs ---');
  for (const job of jobs) {
    console.log(`JobId: ${job.id}, Status: ${job.status}, Error: ${job.error}`);
  }

  const logs = await prisma.aIImageLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('--- AI Image Logs ---');
  for (const log of logs) {
    console.log(`LogId: ${log.id}, Provider: ${log.provider}, Error: ${log.errorMessage}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
