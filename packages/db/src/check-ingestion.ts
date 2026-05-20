import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.knowledgeSource.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('--- Knowledge Sources ---');
  console.log(JSON.stringify(sources, null, 2));

  const jobs = await prisma.knowledgeJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('--- Knowledge Jobs ---');
  console.log(JSON.stringify(jobs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
