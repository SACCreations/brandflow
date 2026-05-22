import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.knowledgeJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { source: { select: { type: true, status: true, sourceUrl: true } } }
  });
  console.log('Recent Jobs:');
  console.log(JSON.stringify(jobs, null, 2));

  const logs = await prisma.knowledgeIngestionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Recent Logs:');
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
